// apps/mobile/src/screens/auth/LoginScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Colors } from '../../theme/colors';
import {
  authService,
  getApiBaseUrl,
  API_NOT_CONFIGURED_MESSAGE,
} from '../../services';
import { SessionUser } from '../../types/sessionUser';
import { isValidIdentity } from '../../utils/validation';

interface LoginScreenProps {
  onLoginSuccess: (user: SessionUser) => void;
  onGoRegister: () => void;
  // Thông báo hiển thị khi vào màn (vd phiên hết hạn)
  initialMessage?: string | null;
  /** Chỉ truyền khi __DEV__: mở Kid UI Preview (ADR-020). Không có prop = không có lối vào. */
  onOpenPreview?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoRegister,
  initialMessage,
  onOpenPreview,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialMessage ?? null);
  const apiBaseUrl = getApiBaseUrl();

  const [fieldErrors, setFieldErrors] = useState<{ identity?: string; password?: string }>({});

  // Quy tắc kiểm tra khớp Web LoginPage
  const validate = (): boolean => {
    const next: { identity?: string; password?: string } = {};
    const identity = email.trim();
    if (!identity) next.identity = 'Ba mẹ nhập email hoặc tên đăng nhập nhé';
    else if (!isValidIdentity(identity)) next.identity = 'Email hoặc tên đăng nhập chưa đúng định dạng';
    if (!password) next.password = 'Ba mẹ nhập mật khẩu nhé';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (submittingRef.current) return;
    setErrorMsg(null);
    if (!validate()) return;

    submittingRef.current = true;
    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
      setPassword('');
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
      {/* Brand Header */}
      <View style={styles.brandHero}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>🐶</Text>
        </View>

        <Text style={styles.brandTitle}>StoryWeaver</Text>
        <View style={styles.taglinePill}>
          <Text style={styles.taglineText}>🌸 VƯỜN CỔ TÍCH DIỆU KỲ CHO BÉ 🌸</Text>
        </View>

        {/* Mascot Speech Bubble */}
        <View style={styles.mascotSpeech}>
          <Text style={styles.speechText}>Gâu gâu! Chào mừng ba mẹ và bé yêu nhé! 👋</Text>
        </View>
      </View>

      {/* Main Login Card */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Đăng nhập tài khoản</Text>
        <Text style={styles.formSubtitle}>Cùng bé bước vào thế giới truyện tranh tương tác EQ</Text>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <HeyInput
          label="Email hoặc Tên đăng nhập"
          placeholder="email@example.com hoặc tên đăng nhập"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setFieldErrors((e) => ({ ...e, identity: undefined }));
            setErrorMsg(null);
          }}
          error={fieldErrors.identity}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyInput
          label="Mật khẩu"
          placeholder="••••••"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setFieldErrors((e) => ({ ...e, password: undefined }));
            setErrorMsg(null);
          }}
          error={fieldErrors.password}
          secureTextEntry
          revealable
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyButton
          title={loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập ngay'}
          onPress={handleLogin}
          style={styles.loginBtn}
          size="lg"
          disabled={loading}
        />

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onGoRegister}>
            <Text style={styles.registerLink}>Đăng ký ngay ➔</Text>
          </TouchableOpacity>
        </View>

        {__DEV__ && !!onOpenPreview && (
          <TouchableOpacity onPress={onOpenPreview} style={{ alignSelf: 'center', marginTop: 14 }}>
            <Text style={styles.registerText}>🧪 UI Preview (dev) – dữ liệu mẫu</Text>
          </TouchableOpacity>
        )}

        {/* Địa chỉ máy chủ lấy từ cấu hình (EXPO_PUBLIC_API_URL), chỉ hiển thị */}
        <View style={styles.envBar}>
          <Text style={styles.envTriggerText}>
            {apiBaseUrl
              ? `⚙️ Máy chủ: ${apiBaseUrl}`
              : `⚠️ ${API_NOT_CONFIGURED_MESSAGE}`}
          </Text>
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
    paddingTop: 36,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE57F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD54F',
    boxShadow: '0 4px 12px rgba(255, 213, 79, 0.4)',
    marginBottom: 10,
  },
  logoEmoji: {
    fontSize: 34,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.textDark,
    letterSpacing: 0.5,
  },
  taglinePill: {
    backgroundColor: '#FFF9C4',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FFF59D',
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F57F17',
    letterSpacing: 0.5,
  },
  mascotSpeech: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  speechText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
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
  formTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
  },
  formSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
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
  loginBtn: {
    marginTop: 4,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  envBar: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  envTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  envTriggerText: {
    fontSize: 10.5,
    color: '#6B7280',
    flex: 1,
  },
  envTriggerArrow: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  envDropdown: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  envChoice: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  envChoiceActive: {
    backgroundColor: '#EFF6FF',
  },
  envChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
});
