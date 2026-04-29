import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const GA_MEASUREMENT_ID = "G-ZCNKGMJ6EV";

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
    }
}

export default function GoogleAnalyticsPageViews() {
    const [location] = useLocation();
    const lastTrackedUrl = useRef("");

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (typeof window.gtag !== "function") return;

        const pagePath = `${window.location.pathname}${window.location.search}`;
        const pageUrl = window.location.href;

        // Não conta painel admin no Analytics público
        if (pagePath.startsWith("/admin")) return;

        // Evita page_view duplicado da mesma URL
        if (lastTrackedUrl.current === pageUrl) return;
        lastTrackedUrl.current = pageUrl;

        // Pequeno delay para dar tempo do React atualizar title/conteúdo do artigo
        const timeout = window.setTimeout(() => {
            const h1Title = document.querySelector("h1")?.textContent?.trim();

            const pageTitle =
                document.title && document.title !== "Cenas de Combate - História Militar"
                    ? document.title
                    : h1Title
                        ? `${h1Title} | Cenas de Combate`
                        : document.title;

            window.gtag?.("event", "page_view", {
                send_to: GA_MEASUREMENT_ID,
                page_location: window.location.href,
                page_path: `${window.location.pathname}${window.location.search}`,
                page_title: pageTitle,
            });
        }, 1500);

        return () => window.clearTimeout(timeout);
    }, [location]);

    return null;
}