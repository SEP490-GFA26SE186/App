// apps/mobile/src/screens/auth/LoginScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { MASCOT_IMAGE } from '../../constants/mascot';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyInput } from '../../components/ui/HeyInput';
import { Icon } from '../../components/ui/Icon';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import {
  authService,
  getApiBaseUrl,
  API_NOT_CONFIGURED_MESSAGE,
} from '../../services';
import { SessionUser } from '../../types/sessionUser';
import { isValidIdentity } from '../../utils/validation';
import { ForgotPasswordSheet } from '../../components/auth/ForgotPasswordSheet';


// Công cụ dev trên màn Đăng nhập (UI Preview, địa chỉ máy chủ): mặc định ẩn cả khi chạy dev; bật bằng EXPO_PUBLIC_SHOW_DEV_TOOLS=1.
// Bản phát hành (__DEV__ = false) luôn ẩn.
const SHOW_DEV_TOOLS = __DEV__ && process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === '1';

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
  const [forgotOpen, setForgotOpen] = useState(false);

  // Rời màn (vd. sang Đăng ký) thì hủy request đang chờ để phản hồi muộn không tự đăng nhập
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

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
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const user = await authService.login(email.trim(), password, controller.signal);
      if (controller.signal.aborted) return;
      onLoginSuccess(user);
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin!');
      // Lỗi mạng/máy chủ (status 0 hoặc >= 500): giữ mật khẩu để bấm thử lại
      if (!(err?.status === 0 || err?.status >= 500)) setPassword('');
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
        {/* Thương hiệu: cú + tên + một câu chào (R5: bỏ tagline in hoa 10px và bong bóng thứ hai) */}
        <View style={styles.brandHero}>
          <View style={styles.logoWrap}>
            <Image source={MASCOT_IMAGE} style={styles.logoImage} accessibilityIgnoresInvertColors accessible={false} />
          </View>
          <Text style={styles.brandTitle} accessibilityRole="header">
            StoryWeaver
          </Text>
          <Text style={styles.brandTagline}>Vườn cổ tích diệu kỳ cho bé</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Đăng nhập</Text>
          <Text style={styles.formSubtitle}>Cùng bé bước vào thế giới truyện tranh tương tác EQ</Text>

          {!!errorMsg && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Icon name="alert-circle" size={18} color={Colors.danger} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <HeyInput
            label="Email hoặc Tên đăng nhập"
            placeholder="email@example.com"
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
            returnKeyType="next"
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
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />

          {/* Phase 2: quên mật khẩu = mã khôi phục qua email (ForgotPasswordSheet) */}
          <Pressable
            onPress={() => setForgotOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Quên mật khẩu"
            style={(s) => [styles.registerBtn, styles.forgotBtn, s.pressed && styles.pressed, focusRing(s)]}
          >
            <Text style={styles.registerLink}>Quên mật khẩu?</Text>
          </Pressable>

          <HeyButton title="Đăng nhập" iconName="log-in-outline" onPress={handleLogin} style={styles.loginBtn} size="lg" loading={loading} />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Chưa có tài khoản?</Text>
            <Pressable
              onPress={onGoRegister}
              accessibilityRole="button"
              accessibilityLabel="Đăng ký tài khoản mới"
              style={(s) => [styles.registerBtn, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
            </Pressable>
          </View>

          {SHOW_DEV_TOOLS && !!onOpenPreview && (
            <Pressable
              onPress={onOpenPreview}
              accessibilityRole="button"
              accessibilityLabel="UI Preview (chỉ khi phát triển), dữ liệu mẫu"
              style={(s) => [styles.previewBtn, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={styles.registerText}>🧪 UI Preview (dev) – dữ liệu mẫu</Text>
            </Pressable>
          )}

          {/* J1: địa chỉ máy chủ chỉ hiện khi bật công cụ dev; bản thường chỉ báo khi CHƯA cấu hình (không lộ địa chỉ) */}
          {SHOW_DEV_TOOLS && !!apiBaseUrl && (
            <View style={styles.envBar}>
              <Text style={styles.envText}>Máy chủ (dev): {apiBaseUrl}</Text>
            </View>
          )}
          {!apiBaseUrl && (
            <View style={styles.envBar} accessibilityRole="alert">
              <Text style={styles.envWarn}>{API_NOT_CONFIGURED_MESSAGE}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      <ForgotPasswordSheet visible={forgotOpen} initialEmail={email} onClose={() => setForgotOpen(false)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.canvas },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xxxl, paddingBottom: Spacing.xxxl, alignItems: 'center' },
  brandHero: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.xs },
  logoWrap: { borderRadius: 44, ...Elevation.mid },
  logoImage: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: Colors.surface },
  brandTitle: { ...Typography.display, fontSize: 28, lineHeight: 36, color: Colors.text, marginTop: Spacing.sm },
  brandTagline: { ...Typography.body, fontSize: 14, color: Colors.textMuted },
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
  formTitle: { ...Typography.title, color: Colors.text },
  formSubtitle: { ...Typography.body, fontSize: 14, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.lg },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.dangerTint, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.md },
  // danger #BA1A1A trên dangerTint 5.0:1
  errorText: { ...Typography.label, color: Colors.danger, flex: 1 },
  loginBtn: { marginTop: Spacing.xs },
  forgotBtn: { alignSelf: 'flex-end' },
  registerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg, gap: Spacing.xs },
  registerText: { ...Typography.body, fontSize: 14, color: Colors.textMuted },
  registerBtn: { minHeight: Touch.min, justifyContent: 'center', paddingHorizontal: Spacing.xs },
  pressed: { opacity: 0.7 },
  // Link cam trên nền trắng dùng brandStrong 5.18:1 (QA_R1 HIGH-3)
  registerLink: { fontFamily: FontFamily.extraBold, fontSize: 15, color: Colors.brandStrong },
  previewBtn: { alignSelf: 'center', minHeight: Touch.min, justifyContent: 'center', marginTop: Spacing.xs },
  envBar: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.outline },
  envText: { ...Typography.caption, color: Colors.textMuted },
  envWarn: { ...Typography.label, color: Colors.danger },
});
