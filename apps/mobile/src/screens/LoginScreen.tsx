// apps/mobile/src/screens/LoginScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyInput } from '../components/ui/HeyInput';
import { Colors } from '../theme/colors';
import {
  authService,
  getApiEnvironment,
  setApiEnvironment,
  getApiBaseUrl,
  ApiEnvironment,
} from '../services';
import { SessionUser } from '../types/sessionUser';

interface LoginScreenProps {
  onLoginSuccess: (user: SessionUser) => void;
  onGoRegister: () => void;
  // Thông báo hiển thị khi vào màn (vd phiên hết hạn)
  initialMessage?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoRegister,
  initialMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialMessage ?? null);
  const [currentEnv, setCurrentEnv] = useState<ApiEnvironment>(getApiEnvironment());
  const [showEnvOptions, setShowEnvOptions] = useState(false);

  const handleLogin = async () => {
    if (submittingRef.current) return;
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập email/tên đăng nhập và mật khẩu');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleSelectEnv = (env: ApiEnvironment) => {
    setApiEnvironment(env);
    setCurrentEnv(env);
    setShowEnvOptions(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyInput
          label="Mật khẩu"
          placeholder="••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
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

        {/* Server Environment Bar */}
        <View style={styles.envBar}>
          <TouchableOpacity
            style={styles.envTrigger}
            onPress={() => setShowEnvOptions(!showEnvOptions)}
          >
            <Text style={styles.envTriggerText}>
              ⚙️ Máy chủ: <Text style={{ fontWeight: '800', color: Colors.primary }}>{currentEnv.toUpperCase()}</Text> ({getApiBaseUrl()})
            </Text>
            <Text style={styles.envTriggerArrow}>{showEnvOptions ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showEnvOptions && (
            <View style={styles.envDropdown}>
              <TouchableOpacity
                style={[styles.envChoice, currentEnv === 'dev' && styles.envChoiceActive]}
                onPress={() => handleSelectEnv('dev')}
              >
                <Text style={styles.envChoiceText}>🖥️ Dev (Local: localhost:3000)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.envChoice, currentEnv === 'prod' && styles.envChoiceActive]}
                onPress={() => handleSelectEnv('prod')}
              >
                <Text style={styles.envChoiceText}>🌐 Prod (api.storyweaver.id.vn)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
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
