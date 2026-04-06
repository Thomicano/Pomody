// ═══════════════════════════════════════════════════════════════
// 🔐 Token Manager — Sistema definitivo de gestión de tokens
// Maneja: storage, exchange, refresh, y validación de expiry.
// ═══════════════════════════════════════════════════════════════

const CLIENT_ID = "49d13b1a43f5464aaab361a326c3aae6";
const REDIRECT_URI = "http://127.0.0.1:5174/callback";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";

// ─── Keys de localStorage ───
const KEYS = {
  accessToken:  "pomody_access_token",
  refreshToken: "pomody_refresh_token",
  expiresAt:    "pomody_token_expires_at",
} as const;

// ─── Tipos ───
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp ms
}

// ═══════════════════════════════════════
// STORAGE — Leer / Escribir / Borrar
// ═══════════════════════════════════════

export function saveTokens(data: TokenData): void {
  localStorage.setItem(KEYS.accessToken, data.accessToken);
  localStorage.setItem(KEYS.refreshToken, data.refreshToken);
  localStorage.setItem(KEYS.expiresAt, String(data.expiresAt));
  console.log("🔐 [TokenManager] Tokens guardados. Expiran en:", new Date(data.expiresAt).toLocaleTimeString());
}

export function loadTokens(): TokenData | null {
  const accessToken = localStorage.getItem(KEYS.accessToken);
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  const expiresAt = localStorage.getItem(KEYS.expiresAt);

  if (!accessToken || !refreshToken || !expiresAt) return null;

  return {
    accessToken,
    refreshToken,
    expiresAt: Number(expiresAt),
  };
}

export function clearTokens(): void {
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.refreshToken);
  localStorage.removeItem(KEYS.expiresAt);
  localStorage.removeItem("verifier");
  console.log("🗑️ [TokenManager] Tokens borrados.");
}

export function isTokenExpired(tokens: TokenData): boolean {
  // Consideramos expirado 60 segundos antes para tener margen
  return Date.now() > tokens.expiresAt - 60_000;
}

// ═══════════════════════════════════════
// EXCHANGE — Intercambiar code por tokens
// (Paso 4 del flujo PKCE de Spotify)
// ═══════════════════════════════════════

export async function exchangeCodeForTokens(code: string): Promise<TokenData> {
  const verifier = localStorage.getItem("verifier");
  if (!verifier) {
    throw new Error("No se encontró el code_verifier en localStorage. ¿Se completó el paso de login?");
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  console.log("🔄 [TokenManager] Intercambiando code por tokens...");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("❌ [TokenManager] Error en exchange:", response.status, errorBody);
    throw new Error(`Token exchange failed: ${response.status} — ${errorBody}`);
  }

  const data = await response.json();
  console.log("✅ [TokenManager] Tokens recibidos correctamente.");

  const tokens: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveTokens(tokens);
  // Limpiamos el verifier porque ya no se necesita
  localStorage.removeItem("verifier");

  return tokens;
}

// ═══════════════════════════════════════
// REFRESH — Renovar un token expirado
// (Regla 5 de la spec de Spotify)
// ═══════════════════════════════════════

export async function refreshAccessToken(currentRefreshToken: string): Promise<TokenData> {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: currentRefreshToken,
  });

  console.log("🔄 [TokenManager] Refrescando access_token...");

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("❌ [TokenManager] Error en refresh:", response.status, errorBody);
    // Si el refresh falla, borramos todo y forzamos re-login
    clearTokens();
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ [TokenManager] Token refrescado correctamente.");

  const tokens: TokenData = {
    accessToken: data.access_token,
    // Spotify puede devolver un nuevo refresh_token o no
    refreshToken: data.refresh_token || currentRefreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  saveTokens(tokens);
  return tokens;
}

// ═══════════════════════════════════════
// GET VALID TOKEN — Punto de entrada principal
// Lee, valida, y refresca automáticamente
// ═══════════════════════════════════════

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = loadTokens();
  if (!tokens) return null;

  if (!isTokenExpired(tokens)) {
    return tokens.accessToken;
  }

  // Token expirado → intentamos refrescar
  try {
    const refreshed = await refreshAccessToken(tokens.refreshToken);
    return refreshed.accessToken;
  } catch {
    // Si falla el refresh, el usuario tendrá que re-loguearse
    return null;
  }
}
