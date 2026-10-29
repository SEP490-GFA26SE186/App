// apps/mobile/src/screens/kid/KidModeScreen.tsx — R4 Warm Storybook Guardian
// Kid Mode: tủ sách → đọc truyện → điểm dừng EQ. Dữ liệu qua `source` (kidService thật; UI Preview dùng fixture).
// Phase 2: GET /kid/me xác nhận phiên Kid thuộc đúng bé đã chọn (khác bé hoặc 401 → báo phiên mất, ẩn nội dung).
// Màn này giữ STATE + LOGIC thoát bằng PIN (gửi lên BE) và ghép các phần hiển thị: components/kid/{KidShelf,KidReader,KidPinOverlay}.
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { Colors } from '../../theme/colors';
import { Radius, Spacing } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { authService } from '../../services/authService';
import { ApiError } from '../../services/apiClient';
import { childEmoji } from '../../utils/child';
import { HeyButton } from '../../components/ui/HeyButton';
import { KidShelf } from '../../components/kid/KidShelf';
import { KidReader } from '../../components/kid/KidReader';
import { KidPinOverlay } from '../../components/kid/KidPinOverlay';
import type { KidDataSource } from '../../types/viewModels';
import { useKidReader } from './useKidReader';
import { useKidUiAudio } from './useKidUiAudio';

interface KidModeScreenProps {
  child: ChildProfile;
  /** Nguồn dữ liệu: kidService (BE) ở Kid Mode thật; fixture ở UI Preview */
  source: KidDataSource;
  // Reject khi BE từ chối/lỗi; resolve khi BE đã xác minh PIN (màn này sẽ được gỡ)
  onExitKidMode: (pin: string) => Promise<void>;
  // Kid session mất/hết hạn: không thể thoát bằng PIN → App xóa phiên và buộc đăng nhập lại bằng mật khẩu
  onKidSessionLost: () => void;
  /**
   * CHỈ cho UI Preview (dev-only, ADR-020): có giá trị = đây KHÔNG phải Kid Mode thật.
   * Không có PIN, không phiên Kid, không gọi API; nút thoát đóng preview trực tiếp.
   */
  preview?: { onExit: () => void };
}

export const KidModeScreen: React.FC<KidModeScreenProps> = ({
  child,
  source,
  onExitKidMode,
  onKidSessionLost,
  preview: previewProp,
}) => {
  // Phòng thủ chiều sâu: prop preview bỏ qua PIN nên bị vô hiệu hóa hoàn toàn ngoài __DEV__
  const preview = __DEV__ ? previewProp : undefined;
  const reader = useKidReader(source);
  const { play } = reader;
  // Câu đọc dùng chung (GET /kid/ui-audio): chỉ ở Kid Mode thật, chỉ phát khi bé bấm "Nghe"
  const uiAudio = useKidUiAudio(source, !preview);

  // PIN Lock
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const lockedUntilRef = useRef(0);
  const verifyingPinRef = useRef(false);
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);

  // Hồ sơ bé theo token kid_session (không dùng token Parent). Preview không có getMe → bỏ qua.
  const [kidName, setKidName] = useState<string | null>(null);
  const [meLost, setMeLost] = useState(false);
  useEffect(() => {
    if (preview || !source.getMe) return;
    let alive = true;
    source
      .getMe()
      .then((me) => {
        if (!alive) return;
        if (me.child.id !== child?.id) setMeLost(true);
        else setKidName(me.child.name);
      })
      .catch((e) => {
        if (alive && e instanceof ApiError && e.status === 401) setMeLost(true);
      });
    return () => {
      alive = false;
    };
  }, [preview, source, child?.id]);

  const handleVerifyPin = async (pin: string) => {
    if (verifyingPinRef.current) return;
    verifyingPinRef.current = true;
    setVerifyingPin(true);
    setPinMessage(null);
    try {
      await onExitKidMode(pin);
    } catch (err) {
      // BE từ chối hoặc lỗi: không coi PIN là hợp lệ, giữ nguyên Kid Mode
      if (authService.isKidSessionLost(err)) {
        // Không phải PIN sai: kid session không còn hợp lệ → chỉ còn cách đăng nhập lại
        setSessionLost(true);
        setEnteredPin('');
        return;
      }
      // BE trả sẵn thông báo: "Còn N lần thử" (401, kèm attemptsLeft) hoặc khóa tạm (429, kèm retryAfterSeconds)
      if (err instanceof ApiError && err.status === 429) {
        const wait = err.errors?.[0]?.retryAfterSeconds;
        lockedUntilRef.current = Date.now() + (typeof wait === 'number' ? wait : 900) * 1000;
      }
      setPinMessage(err instanceof Error && err.message ? err.message : 'Chưa xác nhận được mã PIN. Ba mẹ thử lại nhé.');
      setPinError(true);
      setTimeout(() => {
        setEnteredPin('');
        setPinError(false);
      }, 900);
    } finally {
      verifyingPinRef.current = false;
      setVerifyingPin(false);
    }
  };

  // BE chấp nhận PIN 4–6 số (auth.validation exitKidMode) → nhập tối đa 6 số rồi bấm "Xác nhận"
  const handlePressPinKey = (num: string) => {
    if (sessionLost || verifyingPinRef.current || Date.now() < lockedUntilRef.current) return;
    if (enteredPin.length < 6) setEnteredPin(enteredPin + num);
  };

  const confirmPin = () => {
    if (sessionLost || enteredPin.length < 4 || Date.now() < lockedUntilRef.current) return;
    void handleVerifyPin(enteredPin);
  };

  const closePinModal = () => {
    setShowPinModal(false);
    setPinMessage(null);
    setEnteredPin('');
  };

  // Back của Android trong Kid Mode: mở/đóng khoá PIN thay vì rời app (chỉ BE xác nhận PIN mới về Parent)
  useEffect(() => {
    if (preview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showPinModal) closePinModal();
      else setShowPinModal(true);
      return true;
    });
    return () => sub.remove();
  }, [preview, showPinModal]);

  // Mở khoá PIN thì dừng âm thanh đang phát
  const stopAudio = uiAudio.stop;
  useEffect(() => {
    if (showPinModal) stopAudio();
  }, [showPinModal, stopAudio]);

  // TalkBack/VoiceOver không được đọc nội dung phía sau khi khoá PIN đang mở
  const hideBehindPin = showPinModal ? 'no-hide-descendants' : 'auto';
  const name = child?.name || 'bé';

  return (
    <View style={styles.container}>
      {preview && (
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>UI Preview – dữ liệu mẫu (không phải Chế độ Trẻ Em thật)</Text>
        </View>
      )}

      {/* ── HEADER ── */}
      <View style={styles.header} importantForAccessibility={hideBehindPin}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji} accessibilityElementsHidden importantForAccessibility="no">
            {childEmoji(child)}
          </Text>
        </View>
        <Text style={styles.greeting} numberOfLines={2} accessibilityRole="header">
          Chào {kidName || child?.name || 'Bé yêu'}!
        </Text>
        <HeyButton
          title={preview ? 'Thoát Preview' : 'Thoát'}
          iconName={preview ? 'arrow-undo' : 'lock-closed'}
          accessibilityLabel={preview ? 'Thoát bản xem thử' : 'Thoát Chế độ Bé, cần mã PIN của ba mẹ'}
          variant="tertiary"
          size="md"
          onPress={() => (preview ? preview.onExit() : setShowPinModal(true))}
        />
      </View>

      {(reader.lost || meLost) && !preview && (
        <View style={styles.lostBanner} importantForAccessibility={hideBehindPin} accessibilityRole="alert">
          <Text style={styles.lostText}>Phiên Chế độ Bé không còn hợp lệ. Ba mẹ đăng nhập lại bằng mật khẩu để tiếp tục.</Text>
          <HeyButton title="Đăng nhập lại" variant="secondary" size="md" onPress={onKidSessionLost} />
        </View>
      )}

      {/* ── NỘI DUNG: tủ sách hoặc trình đọc ── */}
      {meLost && !preview ? null : !play ? (
        <KidShelf reader={reader} childName={kidName || name} hideBehind={hideBehindPin} />
      ) : (
        <KidReader reader={reader} hideBehind={hideBehindPin} audio={uiAudio} />
      )}

      {/* ── Khoá phụ huynh: lớp phủ trong cây (không dùng <Modal>, xem KidPinOverlay) ── */}
      {showPinModal && (
        <KidPinOverlay
          pin={enteredPin}
          error={pinError}
          message={pinMessage}
          verifying={verifyingPin}
          sessionLost={sessionLost}
          onDigit={handlePressPinKey}
          onClear={() => !verifyingPinRef.current && setEnteredPin('')}
          onBackspace={() => !verifyingPinRef.current && setEnteredPin((p) => p.slice(0, -1))}
          onConfirm={confirmPin}
          onCancel={closePinModal}
          onSessionLost={onKidSessionLost}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  // Chỉ hiện ở UI Preview (__DEV__)
  previewBanner: { backgroundColor: Colors.infoText, paddingVertical: 6, alignItems: 'center' },
  previewBannerText: { ...Typography.caption, color: Colors.onStrong },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.page,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.tealTint,
    borderBottomLeftRadius: Radius.xxl,
    borderBottomRightRadius: Radius.xxl,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 2, borderColor: Colors.tealBright },
  avatarEmoji: { fontSize: 28 },
  // navy trên tealTint 13:1
  greeting: { ...Typography.kidHeading, fontFamily: FontFamily.displayBold, color: Colors.text, flex: 1 },
  lostBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.dangerTint },
  lostText: { ...Typography.label, color: Colors.danger, flex: 1 },
});
