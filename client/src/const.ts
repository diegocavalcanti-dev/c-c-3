export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const getLoginUrl = () => {
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(window.location.origin);

  const oauthPortalUrl =
    import.meta.env.VITE_OAUTH_PORTAL_URL || "https://login.manus.im";

  const url = new URL(
    "/webdev.v1.WebDevAuthPublicService/AppAuth",
    oauthPortalUrl
  );

  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};