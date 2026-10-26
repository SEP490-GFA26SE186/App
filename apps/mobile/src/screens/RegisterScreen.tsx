// apps/mobile/src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyInput } from '../components/ui/HeyInput';
import { Colors } from '../theme/colors';
import { authService } from '../services';
import { SessionUser } from '../types/sessionUser';

interface RegisterScreenProps {
  onRegisterSuccess: (user: SessionUser) => void;
  onGoLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onGoLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    setErrorMsg(null);
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên của ba mẹ');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Mật khẩu tối thiểu 8 ký tự (yêu cầu an toàn)');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const cleanUsername = username.length >= 3 ? username : `${username}_usr`;

      const user = await authService.register({
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });

      onRegisterSuccess(user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng ký không thành công. Thử lại sau nhé!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
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
          <Text style={styles.heroSubtitle}>Tặng ngay 50 💎 Credits sáng tác truyện AI miễn phí cho tài khoản mới.</Text>
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
          label="Họ và tên phụ huynh *"
          placeholder="Mẹ Lan Phương"
          value={fullName}
          onChangeText={setFullName}
        />

        <HeyInput
          label="Địa chỉ email *"
          placeholder="lanphuong@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyInput
          label="Số điện thoại (tùy chọn)"
          placeholder="0901234567"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <HeyInput
          label="Mật khẩu (tối thiểu 8 ký tự) *"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyInput
          label="Nhập lại mật khẩu *"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <HeyButton
          title={loading ? '⏳ Đang đăng ký...' : '✨ Hoàn tất đăng ký'}
          variant="teal"
          size="lg"
          onPress={handleRegister}
          style={styles.registerBtn}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Đã có tài khoản rồi? </Text>
          <TouchableOpacity onPress={onGoLogin}>
            <Text style={styles.loginLink}>Đăng nhập ngay ➔</Text>
          </TouchableOpacity>
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
