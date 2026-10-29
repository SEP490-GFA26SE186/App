// apps/mobile/src/components/auth/ForgotPasswordSheet.tsx
// Phase 2 – Quên mật khẩu (mở từ màn Đăng nhập). BE gửi MÃ khôi phục qua email (không có link/deep link):
// bước 1 POST /auth/forgot-password { email } → BE luôn trả cùng một câu (không lộ email nào đã đăng ký);
// bước 2 POST /auth/reset-password { token, newPassword } → BE thu hồi mọi phiên cũ, người dùng đăng nhập lại.
// Mã chỉ nằm trong ô nhập, không lưu, không log. Gửi email do BE thực hiện (có thể tốn phí nhà cung cấp email).
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { authService } from '../../services';
import { EMAIL_REGEX, MIN_REGISTER_PASSWORD } from '../../utils/validation';

type Step = 'request' | 'reset' | 'done';

interface ForgotPasswordSheetProps {
  visible: boolean;
  /** Email/tên đăng nhập đang gõ ở màn Đăng nhập (chỉ điền sẵn nếu là email) */
  initialEmail?: string;
  onClose: () => void;
}

const Note: React.FC<{ tone: 'error' | 'info'; text: string }> = ({ tone, text }) => (
  <View style={styles.note} accessibilityRole={tone === 'error' ? 'alert' : undefined} accessibilityLiveRegion="polite">
    <Icon name={tone === 'error' ? 'alert-circle' : 'information-circle-outline'} size={18} color={tone === 'error' ? Colors.danger : Colors.tealStrong} />
    <Text style={tone === 'error' ? styles.error : styles.info}>{text}</Text>
  </View>
);

export const ForgotPasswordSheet: React.FC<ForgotPasswordSheetProps> = ({ visible, initialEmail, onClose }) => {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  // Mỗi lần mở lại: bắt đầu từ bước 1, xóa mã/mật khẩu cũ
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setStep('request');
      setEmail(initialEmail && EMAIL_REGEX.test(initialEmail.trim()) ? initialEmail.trim() : '');
      setCode('');
      setPassword('');
      setConfirm('');
      setError(null);
      setInfo(null);
    }
  }

  const run = async (task: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e: any) {
      setError(e?.message || 'Có lỗi xảy ra, ba mẹ thử lại sau nhé.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const requestCode = () => {
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ba mẹ nhập đúng email đã đăng ký nhé.');
      return;
    }
    void run(async () => {
      setInfo(await authService.forgotPassword(email));
      setStep('reset');
    });
  };

  const reset = () => {
    if (!code.trim()) return setError('Ba mẹ dán mã khôi phục trong email nhé.');
    if (password.length < MIN_REGISTER_PASSWORD || password.length > 100) return setError(`Mật khẩu mới có từ ${MIN_REGISTER_PASSWORD} đến 100 ký tự.`);
    if (password !== confirm) return setError('Mật khẩu nhập lại chưa khớp.');
    void run(async () => {
      setInfo(await authService.resetPassword(code, password));
      setCode('');
      setPassword('');
      setConfirm('');
      setStep('done');
    });
  };

  return (
    <Sheet
      visible={visible}
      title="Quên mật khẩu"
      description={
        step === 'request'
          ? 'Nhập email tài khoản. Nếu email đã đăng ký, máy chủ sẽ gửi mã khôi phục (hiệu lực 1 giờ).'
          : step === 'reset'
            ? 'Dán mã khôi phục trong email và đặt mật khẩu mới.'
            : undefined
      }
      onClose={onClose}
    >
      <View style={styles.body}>
        {!!info && <Note tone="info" text={info} />}

        {step === 'request' && (
          <>
            <HeyInput
              label="Email"
              placeholder="email@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {!!error && <Note tone="error" text={error} />}
            <HeyButton title="Gửi mã khôi phục" iconName="mail-outline" onPress={requestCode} loading={busy} />
            <HeyButton
              title="Tôi đã có mã"
              variant="tertiary"
              disabled={busy}
              onPress={() => {
                setError(null);
                setStep('reset');
              }}
            />
          </>
        )}

        {step === 'reset' && (
          <>
            <HeyInput label="Mã khôi phục" value={code} onChangeText={(t) => { setCode(t); setError(null); }} autoCapitalize="none" autoCorrect={false} />
            <HeyInput
              label={`Mật khẩu mới (ít nhất ${MIN_REGISTER_PASSWORD} ký tự)`}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              secureTextEntry
              revealable
              autoCapitalize="none"
              autoCorrect={false}
            />
            <HeyInput label="Nhập lại mật khẩu mới" value={confirm} onChangeText={(t) => { setConfirm(t); setError(null); }} secureTextEntry revealable autoCapitalize="none" autoCorrect={false} />
            {!!error && <Note tone="error" text={error} />}
            <HeyButton title="Đặt lại mật khẩu" iconName="key-outline" onPress={reset} loading={busy} />
            <HeyButton
              title="Gửi lại mã"
              variant="tertiary"
              disabled={busy}
              onPress={() => {
                setError(null);
                setInfo(null);
                setStep('request');
              }}
            />
          </>
        )}

        {step === 'done' && <HeyButton title="Về đăng nhập" iconName="log-in-outline" onPress={onClose} />}
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  body: { gap: Spacing.sm, paddingBottom: Spacing.md },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  error: { ...Typography.label, color: Colors.danger, flex: 1 },
  info: { ...Typography.label, color: Colors.text, flex: 1 },
});
