// apps/mobile/src/screens/auth/RegisterScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Icon } from '../../components/ui/Icon';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { authService } from '../../services';
import { SessionUser } from '../../types/sessionUser';
import { EMAIL_REGEX, MIN_REGISTER_PASSWORD, USERNAME_REGEX } from '../../utils/validation';

interface RegisterScreenProps {
  onRegisterSuccess: (user: SessionUser) => void;
  onGoLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onGoLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  // Rời màn (Back / "Đăng nhập") thì hủy request đang chờ để phản hồi muộn không tự đăng nhập
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Quy tắc kiểm tra khớp Web RegisterPage / BE auth.validation.js
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const u = username.trim();
    if (!u) next.username = 'Ba mẹ nhập tên đăng nhập nhé';
    else if (!USERNAME_REGEX.test(u)) next.username = 'Từ 3–50 ký tự, chỉ gồm chữ không dấu, số và dấu _';
    if (!email.trim()) next.email = 'Ba mẹ nhập email nhé';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Email chưa đúng định dạng';
    if (fullName.trim().length > 150) next.fullName = 'Họ tên tối đa 150 ký tự';
    if (phone.trim().length > 20) next.phone = 'Số điện thoại tối đa 20 ký tự';
    if (password.length < MIN_REGISTER_PASSWORD) next.password = `Mật khẩu có ít nhất ${MIN_REGISTER_PASSWORD} ký tự`;
    if (confirmPassword !== password) next.confirmPassword = 'Mật khẩu nhập lại chưa khớp';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // Gõ vào ô nào thì xóa lỗi của ô đó
  const bind = (key: string, setter: (v: string) => void) => (text: string) => {
    setter(text);
    setErrors((e) => ({ ...e, [key]: undefined }));
    setErrorMsg(null);
  };

  const handleRegister = async () => {
    if (submittingRef.current) return;
    setErrorMsg(null);
    if (!validate()) return;

    submittingRef.current = true;
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const user = await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
        ...(fullName.trim() ? { fullName: fullName.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }, controller.signal);
      if (controller.signal.aborted) return;
      onRegisterSuccess(user);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setErrorMsg(err?.message || 'Đăng ký không thành công. Thử lại sau nhé!');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={onGoLogin}
            accessibilityRole="button"
            accessibilityLabel="Quay lại đăng nhập"
            style={(s) => [styles.backBtn, s.pressed && styles.pressed, focusRing(s)]}
          >
            <Icon name="chevron-back" size={20} color={Colors.text} />
            <Text style={styles.backBtnText}>Đăng nhập</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Icon name="gift-outline" size={24} color={Colors.brandStrong} />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroTitle} accessibilityRole="header">
              Chào mừng ba mẹ gia nhập StoryWeaver!
            </Text>
            <Text style={styles.heroSubtitle}>Gói Miễn phí cấp credit mỗi tháng để AI viết truyện cùng bé.</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng ký tài khoản</Text>

          {!!errorMsg && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Icon name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <HeyInput
            label="Họ và tên phụ huynh"
            placeholder="Mẹ Lan Phương"
            value={fullName}
            onChangeText={bind('fullName', setFullName)}
            error={errors.fullName}
            returnKeyType="next"
          />

          <HeyInput
            label="Tên đăng nhập *"
            placeholder="vd: lanphuong_2024"
            value={username}
            onChangeText={bind('username', setUsername)}
            error={errors.username}
            hint="3–50 ký tự: chữ không dấu, số và dấu _"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <HeyInput
            label="Địa chỉ email *"
            placeholder="lanphuong@gmail.com"
            value={email}
            onChangeText={bind('email', setEmail)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <HeyInput
            label="Số điện thoại (tùy chọn)"
            placeholder="0901234567"
            value={phone}
            onChangeText={bind('phone', setPhone)}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <HeyInput
            label="Mật khẩu (tối thiểu 8 ký tự) *"
            placeholder="••••••••"
            value={password}
            onChangeText={bind('password', setPassword)}
            error={errors.password}
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <HeyInput
            label="Nhập lại mật khẩu *"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={bind('confirmPassword', setConfirmPassword)}
            error={errors.confirmPassword}
            secureTextEntry
            revealable
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleRegister}
          />

          <HeyButton
            title="Hoàn tất đăng ký"
            iconName="checkmark-circle-outline"
            variant="secondary"
            size="lg"
            onPress={handleRegister}
            style={styles.registerBtn}
            loading={loading}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Đã có tài khoản?</Text>
            <Pressable
              onPress={onGoLogin}
              accessibilityRole="button"
              accessibilityLabel="Đăng nhập tài khoản có sẵn"
              style={(s) => [styles.loginBtn, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={styles.loginLink}>Đăng nhập ngay</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.canvas },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.xxxl, alignItems: 'center' },
  topBar: { width: '100%', maxWidth: 440, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backBtn: { minHeight: Touch.min, flexDirection: 'row', alignItems: 'center', gap: 2, paddingRight: Spacing.md, borderRadius: Radius.md },
  backBtnText: { ...Typography.label, color: Colors.text },
  pressed: { opacity: 0.7 },
  heroCard: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.brandTint,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
  },
  heroIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroInfo: { flex: 1, gap: 2 },
  heroTitle: { ...Typography.bodyStrong, color: Colors.text },
  heroSubtitle: { ...Typography.caption, color: Colors.text },
  formCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: Colors.outline,
    ...Elevation.mid,
  },
  formTitle: { ...Typography.title, color: Colors.text, marginBottom: Spacing.md },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.dangerTint, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  errorText: { ...Typography.label, color: Colors.danger, flex: 1 },
  registerBtn: { marginTop: Spacing.xs },
  loginRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.xs },
  loginPrompt: { ...Typography.body, fontSize: 14, color: Colors.textMuted },
  loginBtn: { minHeight: Touch.min, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  // brandStrong trên trắng 5.18:1 (thay teal #00BFA5 ~2.4:1)
  loginLink: { fontFamily: FontFamily.extraBold, fontSize: 15, color: Colors.brandStrong },
});
