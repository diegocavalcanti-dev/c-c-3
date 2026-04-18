import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    adsbygoogle: any[];
    gtag?: (...args: any[]) => void;
  }
}

export default function AdBanner() {
  const [location] = useLocation();

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, [location]);

  return (
    <div
      key={location}
      className="w-full flex flex-col items-center justify-center my-6 bg-[#f7f7f7cb] md:bg-transparent py-4 md:py-0"
    >
      <div className="w-full max-w-[1200px] flex justify-center">
        <ins
          className="adsbygoogle"
          style={{
            display: "block",
            width: "100%",
            maxHeight: "300px",
          }}
          data-ad-client="ca-pub-9394428727340956"
          data-ad-slot="5479994367"
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}