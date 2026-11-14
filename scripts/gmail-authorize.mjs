// Local, one-time OAuth setup. Run only on a trusted computer; never commit the output.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { randomBytes, createHash } from "node:crypto";

const path = process.argv[2];
if (!path) throw new Error("Usage: node scripts/gmail-authorize.mjs <private-client-json-path>");
const credentials = JSON.parse(await readFile(path, "utf8"));
const client = credentials.web;
if (!client?.client_id || !client?.client_secret) throw new Error("Expected a Google Web OAuth client JSON");
const redirect = "http://127.0.0.1:8765/oauth2/callback";
const state = randomBytes(32).toString("base64url");
const verifier = randomBytes(48).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
for (const [key, value] of Object.entries({ client_id: client.client_id, redirect_uri: redirect,
  response_type: "code", scope: "https://www.googleapis.com/auth/gmail.send",
  access_type: "offline", prompt: "consent select_account", state,
  code_challenge: challenge, code_challenge_method: "S256" })) auth.searchParams.set(key, value);
const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", redirect);
  if (url.pathname !== "/oauth2/callback") { response.writeHead(404).end(); return; }
  if (url.searchParams.get("state") !== state || !url.searchParams.get("code")) {
    response.writeHead(400).end("Authorization rejected. Check the terminal."); server.close(); return;
  }
  try {
    const result = await fetch("https://oauth2.googleapis.com/token", { method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: url.searchParams.get("code"), client_id: client.client_id,
        client_secret: client.client_secret, redirect_uri: redirect, grant_type: "authorization_code",
        code_verifier: verifier }) });
    const token = await result.json();
    if (!result.ok || !token.refresh_token) throw new Error("No refresh token returned; check consent and test-user setup");
    response.writeHead(200, { "Content-Type": "text/plain" }).end("Authorization complete. Return to your terminal.");
    process.stdout.write(`\nGMAIL_CLIENT_ID=${client.client_id}\nGMAIL_CLIENT_SECRET=${client.client_secret}\nGMAIL_REFRESH_TOKEN=${token.refresh_token}\n`);
    process.stdout.write("Store these privately as server-only variables. Do not commit or share them.\n");
  } catch (error) {
    response.writeHead(500).end("Authorization failed. Check the terminal.");
    process.stderr.write(`${error instanceof Error ? error.message : "Authorization failed"}\n`);
  } finally { server.close(); }
});
server.listen(8765, "127.0.0.1", () => process.stdout.write(`Open this URL in your browser:\n${auth}\n`));
