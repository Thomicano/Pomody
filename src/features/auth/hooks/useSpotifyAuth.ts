import { generateCodeVerifier, generateCodeChallenge } from "../pkce";

const CLIENT_ID = "49d13b1a43f5464aaab361a326c3aae6";
const REDIRECT_URI = "http://127.0.0.1:5174/callback"; 
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "streaming",
  "user-read-email",
  "user-read-private"
].join(" ");

export function useSpotifyAuth() {
  const login = async () => {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    // Guardamos el verifier en el navegador para cuando volvamos de Spotify
    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("response_type", "code");
    params.append("redirect_uri", REDIRECT_URI);
    params.append("scope", SCOPES);
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
  };

  return { login };
}