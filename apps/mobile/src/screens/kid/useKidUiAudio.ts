// apps/mobile/src/screens/kid/useKidUiAudio.ts
// Phát câu đọc dùng chung của Kid Mode từ GET /kid/ui-audio (token kid_session qua `source`).
// - Nạp danh sách MỘT lần khi vào Kid Mode; lỗi / rỗng → không có nút nghe, Kid Mode vẫn dùng bình thường.
// - Chỉ phát khi bé bấm (không tự phát). MỘT player dùng chung: bấm câu mới thì dừng câu cũ (không chồng tiếng).
// - Rời Kid Mode (unmount) → giải phóng player. Không tạo âm thanh mới, không gọi AI/TTS.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { KidDataSource } from '../../types/viewModels';
import { playableUrl, type KidUiAudioControls, type UiAudioAssets } from '../../utils/kidUiAudio';

export const useKidUiAudio = (source: KidDataSource, enabled: boolean): KidUiAudioControls => {
  const [assets, setAssets] = useState<UiAudioAssets | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const player = useRef<AudioPlayer | null>(null);
  const listener = useRef<{ remove: () => void } | null>(null);

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

  const stop = useCallback(() => {
    try {
      player.current?.pause();
    } catch {
      // không có gì để dừng
    }
    setPlayingKey(null);
  }, []);

  const play = useCallback(
    (key: string) => {
      const url = playableUrl(assets, key);
      if (!url) return;
      try {
        if (!player.current) {
          // iOS: vẫn phát khi gạt im lặng; lỗi thì bỏ qua (không chặn phát)
          setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
          player.current = createAudioPlayer(url);
          listener.current = player.current.addListener('playbackStatusUpdate', (s) => {
            if (s.didJustFinish) setPlayingKey(null);
          });
        } else {
          player.current.pause();
          player.current.replace(url); // bấm lại / bấm câu khác: thay nguồn, không tạo player thứ hai
        }
        player.current.play();
        setFailedKey(null);
        setPlayingKey(key);
      } catch {
        setPlayingKey(null);
        setFailedKey(key);
      }
    },
    [assets]
  );

  const canPlay = useCallback((key: string) => !!playableUrl(assets, key), [assets]);

  return { canPlay, play, stop, playingKey, failedKey };
};
