import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

export default function ScrollToTop() {
    const [location] = useLocation();

    useLayoutEffect(() => {
        if (location.includes("#")) return;

        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "auto",
        });
    }, [location]);

    return null;
}