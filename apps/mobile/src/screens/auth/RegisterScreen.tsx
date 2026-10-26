// apps/mobile/src/screens/auth/RegisterScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Colors } from '../../theme/colors';
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onGoLogin} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Đăng nhập</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Đăng ký tài khoản</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Hero Welcome Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroEmoji}>🎁</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.heroTitle}>Chào mừng ba mẹ gia nhập StoryWeaver!</Text>
          <Text style={styles.heroSubtitle}>Gói Miễn phí cấp credit mỗi tháng để AI viết truyện cùng bé.</Text>
        </View>
      </View>

      {/* Main Register Form */}
      <View style={styles.formCard}>
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <HeyInput
          label="Họ và tên phụ huynh"
          placeholder="Mẹ Lan Phương"
          value={fullName}
          onChangeText={bind('fullName', setFullName)}
          error={errors.fullName}
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
        />

        <HeyButton
          title={loading ? '⏳ Đang đăng ký...' : '✨ Hoàn tất đăng ký'}
          variant="teal"
          size="lg"
          onPress={handleRegister}
          style={styles.registerBtn}
          disabled={loading}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Đã có tài khoản rồi? </Text>
          <TouchableOpacity onPress={onGoLogin}>
            <Text style={styles.loginLink}>Đăng nhập ngay ➔</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFE',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
  },
  heroCard: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFF59D',
    marginBottom: 16,
  },
  heroEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  heroInfo: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F57F17',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
    lineHeight: 15,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1.5,
    borderColor: Colors.border,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  registerBtn: {
    marginTop: 6,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginPrompt: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.teal,
  },
});
