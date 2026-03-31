import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getAuthUser } from '../_shared/auth.ts';
import { createUserClient } from '../_shared/supabaseClient.ts';
import { validatePayload, verifyPremiumPlan } from '../_shared/validators.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // 1. Manejo automático de CORS (Preflight requests de Next.js/React)
  const isOptions = handleCors(req);
  if (isOptions) return isOptions;

  try {
    // 2. Extraer usuario (Valida el Token)
    const user = await getAuthUser(req);

    // 3. Proteger la ruta (Opcional según tu designación de Feature)
    // const isPremium = await verifyPremiumPlan(user.id);
    // if (!isPremium) {
    //   throw new Error("403: Requiere Plan Premium para invocar a la IA.");
    // }

    // 4. Leer y sanitizar el Input de la Request
    const body = await req.json();
    validatePayload(body, ['input']);
    const { input } = body;

    if (!GEMINI_API_KEY) {
      throw new Error("500: Fallo de configuración en Backend (API Key IA faltante).");
    }

    // 5. Invocación a Gemini 1.5 Flash - Forzando JSON 
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // Configuración del System Prompt para asegurar calidad y formato de salida
    const promptDef = `
      Eres un asistente experto en organizar fechas de estudio.
      Del input proporcionado, extrae y arma un JSON ESTRICTO bajo este diseño:
      {
        "title": "título derivado claro",
        "date": "fecha ISO si la deduces, o DD/MM/YYYY text",
        "type": "exam" | "hw" | "class" | "other"
      }
      Input usuario: ${input}
    `;

    const aiResponse = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptDef }] }],
        generationConfig: {
          response_mime_type: "application/json" // Core feature requerida
        }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`502: Bad Gateway. La Red Neuronal se rehusó a procesar: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const structuredResultText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!structuredResultText) throw new Error("500: Formato de AI inesperado.");

    // 6. Castear y Validar Formato JSON (Sanitización)
    const jsonEvent = JSON.parse(structuredResultText);

    if (!jsonEvent.title || !jsonEvent.date) {
        throw new Error("500: AI devolvió objeto malformado.");
    }

    // 7. Guardar en Base de Datos vía Supabase Creado por Usuario (Respeta RLS)
    const supabase = createUserClient(req);
    const { data: dbInsert, error: dbError } = await supabase
      .from('user_events')
      .insert({
        user_id: user.id,
        title: jsonEvent.title,
        date_string: jsonEvent.date,
        event_type: jsonEvent.type || 'other'
      })
      .select()
      .single();

    if (dbError) {
      console.error(dbError);
      throw new Error("500: Fallo de Inserción DB.");
    }

    // 8. Retorno Glorioso y Tipado
    return new Response(JSON.stringify({ 
      success: true, 
      event: dbInsert 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error("ParseEvent Edge Function Error:", err);
    
    // Parseo de Código HTTP Estándar de Errores propios 
    const isCustomError = typeof err.message === 'string' && /^\d{3}:/.test(err.message);
    const status = isCustomError ? parseInt(err.message.substring(0, 3)) : 500;
    const msg = isCustomError ? err.message.substring(4) : "Internal Server Error";

    return new Response(JSON.stringify({ error: msg }), {
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
