import React, { useEffect, useRef } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'banner';
  className?: string;
  style?: React.CSSProperties;
}

const AdSense: React.FC<AdSenseProps> = ({ adSlot, adFormat = 'auto', className = '', style = {} }) => {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    // Initialize AdSense when component mounts
    if (adRef.current && (window as any).adsbygoogle) {
      try {
        (window as any).adsbygoogle.push({});
      } catch (error) {
        console.log('AdSense initialization error:', error);
      }
    }
  }, []);

  return (
    <div className={`ad-container ${className}`} style={style}>
      <div className="ad-label">
        <span className="ad-label-text">Advertisement</span>
      </div>
      <div className="ad-content">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client="ca-pub-2305974348753248" // Replace with your AdSense publisher ID
          data-ad-slot={adSlot}
          data-ad-format={adFormat}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default AdSense; 