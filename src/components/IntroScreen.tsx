/* src/components/IntroScreen.tsx
   Video splash with unmuted auto-play audio + clean Skip button
*/
import React, { useEffect, useRef, useState } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleEnd = () => {
      setFading(true);
      setTimeout(onFinish, 700);
    };

    // Fallback: skip after 12s nếu video kết thúc
    const fallback = setTimeout(() => {
      setFading(true);
      setTimeout(onFinish, 700);
    }, 14000);

    vid.addEventListener('ended', handleEnd);

    // Tự động bật tiếng (unmuted)
    vid.muted = false;
    vid.play().catch(() => {
      // Fallback nếu trình duyệt chưa cho phép audio autoplay trước tương tác
      vid.muted = true;
      vid.play().catch(() => {
        clearTimeout(fallback);
        onFinish();
      });
    });

    return () => {
      vid.removeEventListener('ended', handleEnd);
      clearTimeout(fallback);
    };
  }, [onFinish]);

  const handleScreenClick = () => {
    const vid = videoRef.current;
    if (vid) {
      vid.muted = false;
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFading(true);
    setTimeout(onFinish, 700);
  };

  return (
    <div
      onClick={handleScreenClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.7s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <video
        ref={videoRef}
        src="/intro.mp4"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
        playsInline
        autoPlay
      />

      {/* Clean Skip button only */}
      <button
        type="button"
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 20,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 9999,
          color: '#fff',
          fontSize: 13,
          fontWeight: 800,
          padding: '8px 18px',
          cursor: 'pointer',
          letterSpacing: 0.3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        Bỏ qua ›
      </button>
    </div>
  );
};
