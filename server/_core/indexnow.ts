const SITE_URL = (
  process.env.SITE_URL || "https://www.cenasdecombate.com"
).replace(/\/$/, "");

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || "7b676a9fc53b468cabb1a9dae3f0c8fc";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function normalizeUrl(urlOrPath: string): string | null {
  if (!urlOrPath) return null;

  const fullUrl = urlOrPath.startsWith("http")
    ? urlOrPath
    : `${SITE_URL}${urlOrPath.startsWith("/") ? "" : "/"}${urlOrPath}`;

  try {
    const url = new URL(fullUrl);
    const site = new URL(SITE_URL);

    if (url.host !== site.host) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function submitToIndexNow(urls: string[]) {
  try {
    const site = new URL(SITE_URL);

    const urlList = Array.from(
      new Set(
        urls
          .map(normalizeUrl)
          .filter((url): url is string => Boolean(url))
      )
    );

    if (urlList.length === 0) {
      return false;
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        host: site.host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(`[IndexNow] Falha ${response.status}: ${text}`);
      return false;
    }

    console.log(`[IndexNow] URL(s) enviada(s):`, urlList);
    return true;
  } catch (error) {
    console.warn("[IndexNow] Erro ao enviar URL(s):", error);
    return false;
  }
}