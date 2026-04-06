import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') ?? '';

Deno.serve(async (req) => {
  const isOptions = handleCors(req);
  if (isOptions) return isOptions;

  try {
    console.log("🚀 1. Iniciando con Groq (Llama 3.3)");
    const { input, localTime } = await req.json();

    // Groq usa el formato de OpenAI, que es el estándar de la industria
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `Hoy es ${localTime}. Extrae un JSON de la entrada del usuario. 
            Responde ÚNICAMENTE el JSON: {"title": "string", "start": "ISO_DATETIME", "type": "EXAMEN" | "TAREA"}` 
          },
          { role: "user", content: input }
        ],
        temperature: 0, // Para que sea preciso y no invente
        stream: false
      })
    });

    const aiData = await res.json();
    
    if (aiData.error) throw new Error(`Groq Error: ${aiData.error.message}`);

    const jsonEvent = JSON.parse(aiData.choices[0].message.content);
    console.log("🎯 2. JSON recibido:", jsonEvent.title);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error: dbError } = await supabaseAdmin
      .from('events')
      .insert({
        user_id: 'eefdff98-075c-4f4a-8cfd-c168dec1b2e0', 
        calendar_id: '69d923a4-202e-4154-8adf-8ece31269023',
        title: jsonEvent.title,
        start_time: jsonEvent.start,
        end_time: new Date(new Date(jsonEvent.start).getTime() + 3600000).toISOString(),
        event_type: (jsonEvent.type || 'TAREA').toUpperCase(),
        description: 'Sync Pomody (Groq AI)',
        color: 'blue'
      })
      .select().single();

    if (dbError) throw dbError;

    console.log("🎉 3. EVENTO GUARDADO!");
    return new Response(JSON.stringify({ success: true, event: data }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error("💥 ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});