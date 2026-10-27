// apps/mobile/src/components/IntroScreen.tsx
// Video intro khi mở app (một lần mỗi lần khởi động; App.tsx giữ trạng thái).
// Web: thẻ <video> phát /intro.mp4 (public/). Native: expo-video phát asset được bundle.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { MASCOT_IMAGE } from '../constants/mascot';

interface IntroScreenProps {
  onFinish: () => void;
}

// Video dài ~10 giây; quá thời gian này mà chưa xong (kẹt tải/phát) thì tự chuyển tiếp
const FALLBACK_MS = 14000;
const WEB_FADE_MS = 700;
const NATIVE_FADE_MS = 600;

// Asset native do Metro bundle; Web dùng file tĩnh /intro.mp4 nên không require ở Web
const NATIVE_SOURCE = Platform.OS === 'web' ? null : require('../../public/intro.mp4');

/** Kết thúc intro đúng một lần (Bỏ qua / hết video / lỗi / Back / quá giờ), dọn timer khi unmount. */
function useFinishOnce(onFinish: () => void, fadeMs: number) {
  const [fading, setFading] = useState(false);
  const doneRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const finish = useCallback(
    (immediate = false) => {
      if (doneRef.current) return;
      doneRef.current = true;
      if (immediate) {
        onFinishRef.current();
        return;
      }
      setFading(true);
      timerRef.current = setTimeout(() => onFinishRef.current(), fadeMs);
    },
    [fadeMs]
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return { fading, finish };
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onFinish }) =>
  Platform.OS === 'web' ? <WebIntro onFinish={onFinish} /> : <NativeIntro onFinish={onFinish} />;

const WebIntro: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const { fading, finish } = useFinishOnce(onFinish, WEB_FADE_MS);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    const handleEnd = () => finish();
    const handleError = () => finish(true);
    const fallback = setTimeout(() => finish(), FALLBACK_MS);

    vid.addEventListener('ended', handleEnd);
    vid.addEventListener('error', handleError);

    // Trình duyệt có thể chặn autoplay có tiếng → thử lại khi tắt tiếng; vẫn bị chặn thì vào app
    vid.muted = false;
    vid.play().catch(() => {
      if (!videoRef.current) return;
      vid.muted = true;
      vid.play().catch(() => finish(true));
    });

    return () => {
      vid.removeEventListener('ended', handleEnd);
      vid.removeEventListener('error', handleError);
      clearTimeout(fallback);
      vid.pause();
      videoRef.current = null;
    };
  }, [finish]);

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
          videoRef.current?.pause();
          finish();
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
};

const NativeIntro: React.FC<IntroScreenProps> = ({ onFinish }) => {
  const { fading, finish } = useFinishOnce(onFinish, NATIVE_FADE_MS);
  const [ready, setReady] = useState(false);
  // useVideoPlayer tự release player khi component unmount
  const player = useVideoPlayer(NATIVE_SOURCE, (p) => {
    p.loop = false;
    p.play();
  });

  const skip = useCallback(() => {
    try {
      player.pause();
    } catch {
      // player có thể đã được release
    }
    finish();
  }, [player, finish]);

  useEffect(() => {
    const endSub = player.addListener('playToEnd', () => finish());
    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') setReady(true);
      if (status === 'error') finish(true);
    });
    const fallback = setTimeout(() => finish(), FALLBACK_MS);
    return () => {
      endSub.remove();
      statusSub.remove();
      clearTimeout(fallback);
    };
  }, [player, finish]);

  // Back của Android bỏ qua intro thay vì thoát app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      skip();
      return true;
    });
    return () => sub.remove();
  }, [skip]);

  return (
    <View style={[styles.nativeContainer, fading && styles.fading]}>
      {/* Splash chữ hiện trong lúc video đang tải */}
      {!ready && (
        <View style={styles.placeholder}>
          <Image source={MASCOT_IMAGE} style={styles.nativeMascot} accessibilityLabel="Mascot cú StoryWeaver" />
          <Text style={styles.nativeTitle}>StoryWeaver</Text>
          <Text style={styles.nativeSubtitle}>Cổ tích diệu kỳ của bé 🌸</Text>
        </View>
      )}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      <TouchableOpacity
        onPress={skip}
        style={styles.nativeSkipBtn}
        accessibilityRole="button"
        accessibilityLabel="Bỏ qua video giới thiệu"
      >
        <Text style={styles.nativeSkipText}>Bỏ qua ›</Text>
      </TouchableOpacity>
    </View>
  );
};

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
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeMascot: {
    width: 120,
    height: 120,
    borderRadius: 60,
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
