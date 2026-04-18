import { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Hook customizado para gerenciar anúncios Google Publisher Tag (GPT) em SPAs
 * Recarrega os anúncios toda vez que a rota muda
 */
export const useGPTAds = () => {
  const [location] = useLocation();

  useEffect(() => {
    // Aguarda o GPT estar disponível
    if (typeof window !== 'undefined' && window.googletag) {
      window.googletag.cmd.push(function() {
        // Destroi todos os slots anteriores
        googletag.destroySlots();
        
        // Redefine os slots
        googletag.defineSlot('/9394428727340956/cenas-de-combate-banner', [728, 90], 'div-gpt-ad-1')
          .addService(googletag.pubads());
        googletag.defineSlot('/9394428727340956/cenas-de-combate-rectangle', [300, 250], 'div-gpt-ad-2')
          .addService(googletag.pubads());
        
        // Recarrega os anúncios
        googletag.pubads().refresh();
      });
    }
  }, [location]); // Recarrega quando a rota muda
};

export default useGPTAds;
