export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  const appId = import.meta.env.VITE_APP_ID;

  if (!appId) {
    throw new Error("VITE_APP_ID não configurado");
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(window.location.origin);

  const oauthPortalUrl = (
    import.meta.env.VITE_OAUTH_PORTAL_URL || "https://manus.im"
  ).replace(/\/$/, "");

  const url = new URL("/app-auth", oauthPortalUrl);

  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("responseType", "code");

  // opcional para compatibilidade com alguns templates antigos
  url.searchParams.set("type", "signIn");

  return url.toString();
};