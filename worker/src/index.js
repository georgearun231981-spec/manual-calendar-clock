const SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";
const GOOGLE_AUTHORIZE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";

function redirect(url, cookies = []) {
  const headers = new Headers({ Location: url });
  cookies.forEach((cookie) => headers.append("Set-Cookie", cookie));
  return new Response(null, { status: 302, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/oauth/start") {
      const state = crypto.randomUUID();
      const callback = `${url.origin}/oauth/callback`;
      const authUrl = new URL(GOOGLE_AUTHORIZE);
      authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", callback);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", SCOPE);
      authUrl.searchParams.set("access_type", "online");
      authUrl.searchParams.set("state", state);
      return redirect(authUrl.toString(), [
        `oauth_state=${state}; Max-Age=600; Path=/; Secure; HttpOnly; SameSite=Lax`,
      ]);
    }
    if (url.pathname === "/oauth/callback") {
      const state = url.searchParams.get("state");
      const code = url.searchParams.get("code");
      const cookieState = request.headers.get("Cookie")?.match(/oauth_state=([^;]+)/)?.[1];
      if (!code || !state || state !== cookieState) return new Response("Invalid OAuth state", { status: 400 });
      const tokenResponse = await fetch(GOOGLE_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${url.origin}/oauth/callback`,
          grant_type: "authorization_code",
        }),
      });
      if (!tokenResponse.ok) return new Response("Google token exchange failed", { status: 502 });
      const token = await tokenResponse.json();
      const fragment = new URLSearchParams({ access_token: token.access_token });
      return redirect(`${env.APP_URL}#${fragment}`);
    }
    return new Response("Day Clock OAuth worker is running", { status: 200 });
  },
};
