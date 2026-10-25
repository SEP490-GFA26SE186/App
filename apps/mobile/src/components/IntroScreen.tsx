// apps/mobile/src/components/IntroScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';

interface IntroScreenProps {
  onFinish: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const vid = videoRef.current;
      if (!vid) return;

      const handleEnd = () => {
        setFading(true);
        setTimeout(onFinish, 700);
      };

      const fallback = setTimeout(() => {
        setFading(true);
        setTimeout(onFinish, 700);
      }, 14000);

      vid.addEventListener('ended', handleEnd);

      vid.muted = false;
      vid.play().catch(() => {
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
    } else {
      // Native auto-skip fallback timer
      const timer = setTimeout(() => {
        setFading(true);
        setTimeout(onFinish, 600);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [onFinish]);

  const handleSkip = () => {
    setFading(true);
    setTimeout(onFinish, 600);
  };

  if (Platform.OS === 'web') {
    return (
      <div
        onClick={() => {
          if (videoRef.current) videoRef.current.muted = false;
        }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
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

        {/* Clean Skip button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          style={{
            position: 'absolute',
            bottom: 32,
            right: 24,
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 9999,
            color: '#fff',
            fontSize: 14,
            fontWeight: 800,
            padding: '10px 22px',
            cursor: 'pointer',
            letterSpacing: 0.5,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 100000,
          }}
        >
          Bỏ qua ›
        </button>
      </div>
    );
  }

  // Native fallback splash
  return (
    <View style={[styles.nativeContainer, fading && styles.fading]}>
      <Text style={styles.nativeEmoji}>✨📖✨</Text>
      <Text style={styles.nativeTitle}>StoryWeaver</Text>
      <Text style={styles.nativeSubtitle}>Cổ tích diệu kỳ của bé 🌸</Text>

      <TouchableOpacity onPress={handleSkip} style={styles.nativeSkipBtn}>
        <Text style={styles.nativeSkipText}>Bỏ qua ›</Text>
      </TouchableOpacity>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  nativeContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fading: {
    opacity: 0,
  },
  nativeEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  nativeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nativeSubtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginTop: 8,
  },
  nativeSkipBtn: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  nativeSkipText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
