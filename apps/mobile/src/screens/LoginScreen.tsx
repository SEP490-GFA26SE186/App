// apps/mobile/src/screens/LoginScreen.tsx
import React, { useState } from 'react';
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
  DEMO_CREDENTIALS,
  getApiEnvironment,
  setApiEnvironment,
  getApiBaseUrl,
  ApiEnvironment,
} from '../services';
import { UserAccount } from '../../../../packages/shared-types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
  onGoRegister: () => void;
  onSkip?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onGoRegister,
  onSkip,
}) => {
  const [email, setEmail] = useState('me.lanhuong@storyweaver.vn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentEnv, setCurrentEnv] = useState<ApiEnvironment>(getApiEnvironment());
  const [showEnvOptions, setShowEnvOptions] = useState(false);

  const handleLogin = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập email/tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (cred: { email: string; password: string }) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setErrorMsg(null);
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
          placeholder="me.lanhuong@storyweaver.vn"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <HeyInput
          label="Mật khẩu"
          placeholder="••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Quick Demo Accounts Fill */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>⚡ Điền nhanh tài khoản demo (Mật khẩu: 123456):</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={[styles.demoChip, email === DEMO_CREDENTIALS.parent.email && styles.demoChipActive]}
              onPress={() => fillDemo(DEMO_CREDENTIALS.parent)}
            >
              <Text style={styles.demoChipText}>👩 Phụ huynh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, email === DEMO_CREDENTIALS.specialist.email && styles.demoChipActive]}
              onPress={() => fillDemo(DEMO_CREDENTIALS.specialist)}
            >
              <Text style={styles.demoChipText}>🎓 Chuyên gia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoChip, email === DEMO_CREDENTIALS.admin.email && styles.demoChipActive]}
              onPress={() => fillDemo(DEMO_CREDENTIALS.admin)}
            >
              <Text style={styles.demoChipText}>🛡️ Admin</Text>
            </TouchableOpacity>
          </View>
        </View>

        <HeyButton
          title={loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập ngay'}
          onPress={handleLogin}
          style={styles.loginBtn}
          size="lg"
        />

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={onGoRegister}>
            <Text style={styles.registerLink}>Đăng ký ngay ➔</Text>
          </TouchableOpacity>
        </View>

        {/* Skip / Direct Explore */}
        {onSkip && (
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn} activeOpacity={0.8}>
            <Text style={styles.skipBtnText}>✨ Hoặc trải nghiệm nhanh (Offline Demo) ➔</Text>
          </TouchableOpacity>
        )}

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
              <TouchableOpacity
                style={[styles.envChoice, currentEnv === 'mock' && styles.envChoiceActive]}
                onPress={() => handleSelectEnv('mock')}
              >
                <Text style={styles.envChoiceText}>📦 Mock Demo (Offline)</Text>
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
  demoSection: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 8,
    marginBottom: 14,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  demoChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  demoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
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
  skipBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
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
