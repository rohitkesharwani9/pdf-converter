import React, { useEffect, useRef, useState } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'banner';
  className?: string;
  style?: React.CSSProperties;
}

const AdSense: React.FC<AdSenseProps> = ({ adSlot, adFormat = 'auto', className = '', style = {} }) => {
  const adRef = useRef<HTMLModElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for page to be fully loaded
    const initAdSense = () => {
      if ((window as any).adsbygoogle && adRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
          setIsReady(true);
        }
      }
    };

    // Try to initialize immediately
    initAdSense();

    // If not ready, wait for window load event
    if (!isReady) {
      if (document.readyState === 'complete') {
        // Page already loaded, try again after a short delay
        const timer = setTimeout(initAdSense, 500);
        return () => clearTimeout(timer);
      } else {
        // Wait for page to load
        window.addEventListener('load', initAdSense);
        return () => window.removeEventListener('load', initAdSense);
      }
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && adRef.current && (window as any).adsbygoogle) {
      const loadAd = () => {
        try {
          // Ensure the ad slot is not already filled
          if (adRef.current && !adRef.current.hasAttribute('data-ad-status')) {
            (window as any).adsbygoogle.push({});
          }
        } catch (error) {
          console.log('AdSense initialization error:', error);
          // Retry after 2 seconds if failed
          setTimeout(loadAd, 2000);
        }
      };
      
      loadAd();
    }
  }, [isReady]);

  return (
    <div 
      ref={containerRef}
      className={`ad-container ${className}`} 
      style={{
        minHeight: '250px',
        width: '100%',
        maxWidth: '728px',
        margin: '0 auto',
        ...style
      }}
    >
      <div className="ad-label">
        <span className="ad-label-text">Advertisement</span>
      </div>
      <div className="ad-content">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ 
            display: 'block',
            textAlign: 'center',
            minHeight: '250px',
            width: '100%'
          }}
          data-ad-client="ca-pub-2305974348753248"
          data-ad-slot={adSlot}
          data-ad-format="rectangle"
          data-ad-layout="in-article"
        />
      </div>
    </div>
  );
};

export default AdSense; 