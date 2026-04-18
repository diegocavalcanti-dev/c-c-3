import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { X } from "lucide-react";

export default function AdPopup() {
  const [location] = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // Mostrar popup após 20 segundos em cada página
  useEffect(() => {
    // Resetar quando a rota muda
    setIsVisible(false);

    // Timer para mostrar popup após 20 segundos
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Recarregar anúncio com delay para garantir que o DOM está pronto
      setTimeout(() => {
        try {
          if (typeof window !== "undefined" && window.adsbygoogle) {
            window.adsbygoogle.push({});
          }
        } catch (e) {
          // Silencia erros
        }
      }, 100);
    }, 20000); // 20 segundos

    return () => clearTimeout(timer);
  }, [location]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsVisible(false)}
      />

      {/* Modal popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full relative">
          {/* Botão de fechar */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
            aria-label="Fechar anúncio"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Conteúdo do popup */}
          <div className="p-6 pt-12">
            {/* Anúncio */}
            <div className="mb-4 bg-gray-100 rounded-lg p-4 min-h-[250px] flex items-center justify-center">
              <ins
                className="adsbygoogle"
                style={{
                  display: "block",
                  width: "100%",
                  minHeight: "250px",
                }}
                data-ad-client="ca-pub-9394428727340956"
                data-ad-slot="5479994367"
                data-ad-format="auto"
                data-full-width-responsive="true"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
