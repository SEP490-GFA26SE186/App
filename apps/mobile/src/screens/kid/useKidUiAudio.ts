// apps/mobile/src/screens/kid/useKidUiAudio.ts
// Phát âm thanh Kid Mode: câu đọc dùng chung (GET /kid/ui-audio, token kid_session qua `source`) và giọng đọc từng trang.
// - Nạp danh sách câu đọc MỘT lần khi vào Kid Mode; lỗi / rỗng → không có nút nghe câu đó, Kid Mode vẫn dùng bình thường.
// - Có file BE + có expo-audio → phát file; không thì đọc chữ bằng giọng máy (speechTTS). Không gọi AI, không tạo file.
// - MỘT nguồn phát tại một thời điểm: phát câu mới thì dừng câu cũ (không chồng tiếng).
// - Rời Kid Mode (unmount) → dừng và giải phóng player.
// - Hotfix: Expo Go SDK 52 không có native module ExpoAudio; import tĩnh làm sập app khi nạp bundle.
//   Nạp tuỳ chọn: thiếu module → chỉ dùng giọng máy. Build thật vẫn phát file BE.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioPlayer } from 'expo-audio';

let ExpoAudio: typeof import('expo-audio') | null = null;
try {
  ExpoAudio = require('expo-audio');
} catch {
  ExpoAudio = null;
}
import type { KidDataSource } from '../../types/viewModels';
import { speechTTS } from '../../utils/speech-tts';
import { pickSource, type KidUiAudioControls, type PlaySource, type UiAudioAssets } from '../../utils/kidUiAudio';

export const useKidUiAudio = (source: KidDataSource, enabled: boolean): KidUiAudioControls => {
  const [assets, setAssets] = useState<UiAudioAssets | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const player = useRef<AudioPlayer | null>(null);
  const listener = useRef<{ remove: () => void } | null>(null);
  const hasTts = speechTTS.isAvailable();

  useEffect(() => {
    if (!enabled || !source.getUiAudio) return;
    let alive = true;
    source
      .getUiAudio()
      .then((a) => alive && setAssets(a))
      .catch(() => {}); // âm thanh là tùy chọn: lỗi (kể cả 401 — useKidReader / getMe đã xử lý mất phiên) thì chỉ không có nút nghe
    return () => {
      alive = false;
    };
  }, [enabled, source]);

  // Rời Kid Mode: dừng và giải phóng tài nguyên phát
  useEffect(
    () => () => {
      speechTTS.stop();
      listener.current?.remove();
      try {
        player.current?.remove();
      } catch {
        // player đã được giải phóng
      }
      player.current = null;
    },
    []
  );

  const silence = () => {
    speechTTS.stop();
    try {
      player.current?.pause();
    } catch {
      // không có gì để dừng
    }
  };

  const stop = useCallback(() => {
    silence();
    setPlayingKey(null);
  }, []);

  const start = useCallback(
    (key: string, src: PlaySource) => {
      if (!enabled || !src) return;
      silence();
      const done = () => setPlayingKey((k) => (k === key ? null : k));
      try {
        if (src.kind === 'audio' && ExpoAudio) {
          if (!player.current) {
            // iOS: vẫn phát khi gạt im lặng; lỗi thì bỏ qua (không chặn phát)
            ExpoAudio.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
            player.current = ExpoAudio.createAudioPlayer(src.url);
            listener.current = player.current.addListener('playbackStatusUpdate', (s) => {
              if (s.didJustFinish) setPlayingKey(null);
            });
          } else {
            player.current.replace(src.url); // bấm lại / bấm câu khác: thay nguồn, không tạo player thứ hai
          }
          player.current.play();
        } else if (src.kind === 'tts') {
          speechTTS.speak(src.text, {
            rate: 0.85,
            onEnd: done,
            onError: () => {
              done();
              setFailedKey(key);
            },
          });
        }
        setFailedKey(null);
        setPlayingKey(key);
      } catch {
        setPlayingKey(null);
        setFailedKey(key);
      }
    },
    [enabled]
  );

  const sourceOf = useCallback(
    (url: string | null | undefined, text: string | null | undefined) => pickSource(url, text, !!ExpoAudio, hasTts),
    [hasTts]
  );

  const play = useCallback(
    (key: string) => start(key, sourceOf(assets?.[key]?.audioUrl, assets?.[key]?.text)),
    [assets, start, sourceOf]
  );
  const speak = useCallback(
    (key: string, url: string | null | undefined, text: string | null | undefined) => start(key, sourceOf(url, text)),
    [start, sourceOf]
  );
  const canPlay = useCallback(
    (key: string) => enabled && !!sourceOf(assets?.[key]?.audioUrl, assets?.[key]?.text),
    [enabled, assets, sourceOf]
  );
  const canSpeak = useCallback(
    (url: string | null | undefined, text: string | null | undefined) => enabled && !!sourceOf(url, text),
    [enabled, sourceOf]
  );

  return { canPlay, play, speak, canSpeak, stop, playingKey, failedKey };
};
