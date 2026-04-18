export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Supports multiple domains by using the Manus domain as fallback
export const getLoginUrl = () => {
  const appId = import.meta.env.VITE_APP_ID;
  
  // Use Manus domain as the primary redirect URI for OAuth
  // This ensures OAuth always works regardless of which domain the user accesses from
  const redirectUri = `https://combateapi-7di34rx2.manus.space/api/oauth/callback`;
  const state = btoa(window.location.origin); // Store the actual origin in state for later redirect

  // Use the correct OAuth portal URL
  const oauthPortalUrl = "https://api.manus.im";
  const url = new URL(`${oauthPortalUrl}/webdev.v1.WebDevAuthPublicService/AppAuth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
