// apps/mobile/src/screens/parent/SettingsScreen.tsx
// B11/C3/C4 – Cài đặt (Web: SettingsPage). Thông tin tài khoản chỉ xem (BE chưa có API cập nhật hồ sơ – U8),
// đổi mật khẩu, đặt/đổi mã PIN Kid Mode qua BE, địa chỉ máy chủ, đăng xuất.
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyInput } from '../../components/ui/HeyInput';
import { HeyButton } from '../../components/ui/HeyButton';
import { Badge } from '../../components/ui/Badge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Colors } from '../../theme/colors';
import { SessionUser } from '../../types/sessionUser';
import {
  authService,
  getApiBaseUrl,
  setDevApiBaseUrl,
  API_NOT_CONFIGURED_MESSAGE,
} from '../../services';

// BE trả message tiếng Anh → dịch lỗi PIN hay gặp (Web VI_MESSAGES)
const PIN_VI_MESSAGES: Record<string, string> = {
  'Current PIN is incorrect': 'Mã PIN hiện tại chưa đúng',
  'Account password is incorrect': 'Mật khẩu tài khoản chưa đúng',
  'Kid Exit PIN is already set. Use change-pin endpoint to change it.':
    'Tài khoản đã có mã PIN, vui lòng dùng chức năng đổi PIN',
};

interface SettingsScreenProps {
  currentUser: SessionUser;
  onUserUpdate: (user: SessionUser) => void;
  onLogout: () => void;
  onBack: () => void;
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue} numberOfLines={1}>
      {value || '—'}
    </Text>
  </View>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onUserUpdate, onLogout, onBack }) => {
  const hasKidPin = !!currentUser.kidModePinHash;
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinNotice, setPinNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwNotice, setPwNotice] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const pwSavingRef = useRef(false);

  const savePassword = async () => {
    if (pwSavingRef.current) return;
    setPwError(null);
    setPwNotice(null);
    if (!curPw) {
      setPwError('Ba mẹ nhập mật khẩu hiện tại nhé.');
      return;
    }
    if (newPw.length < 8 || newPw.length > 100) {
      setPwError('Mật khẩu mới có từ 8 đến 100 ký tự.');
      return;
    }
    pwSavingRef.current = true;
    setPwSaving(true);
    try {
      await authService.changePassword(curPw, newPw);
      setCurPw('');
      setNewPw('');
      setPwNotice('Đã đổi mật khẩu.');
    } catch (err: any) {
      setPwError(err?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      pwSavingRef.current = false;
      setPwSaving(false);
    }
  };

  const [apiBaseUrl, setApiBaseUrlState] = useState<string | null>(getApiBaseUrl());
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // PIN do BE xác minh/lưu; client KHÔNG lưu PIN, chỉ giữ cờ "đã có PIN" ('****').
  // BE chấp nhận PIN 4–6 số; bàn phím Kid Mode nhập tối đa 6 số rồi xác nhận.
  const savePin = async () => {
    if (savingRef.current) return;
    setPinError(null);
    setPinNotice(null);
    if (!/^\d{4,6}$/.test(newPin)) {
      setPinError('Mã PIN gồm 4 đến 6 chữ số.');
      return;
    }
    if (hasKidPin && !/^\d{4,6}$/.test(currentPin)) {
      setPinError('Vui lòng nhập mã PIN hiện tại (4–6 chữ số).');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      if (hasKidPin) await authService.changeKidPin({ newPin, currentPin });
      else await authService.setKidPin(newPin);
      onUserUpdate({ ...currentUser, kidModePinHash: '****' });
      setNewPin('');
      setCurrentPin('');
      setPinNotice(hasKidPin ? 'Đã đổi mã PIN.' : 'Đã đặt mã PIN.');
    } catch (err: any) {
      setPinError(PIN_VI_MESSAGES[err?.message] ?? err?.message ?? 'Không thể lưu mã PIN. Vui lòng thử lại.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const applyUrl = (value: string | null) => {
    if (!setDevApiBaseUrl(value)) {
      setUrlError('Địa chỉ máy chủ không hợp lệ (cần dạng http://host:port).');
      return;
    }
    setUrlError(null);
    setApiBaseUrlState(getApiBaseUrl());
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Cài đặt" onBack={onBack} />

      <HeyCard style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
        <Row label="Họ và tên" value={currentUser.fullName} />
        <Row label="Email" value={currentUser.email} />
        <Row label="Số điện thoại" value={currentUser.phone ?? ''} />
        <Text style={styles.hint}>Chỉnh sửa thông tin tài khoản chưa được hỗ trợ (máy chủ chưa cung cấp chức năng này).</Text>
      </HeyCard>

      <HeyCard style={styles.card}>
        <Text style={styles.cardTitle}>Đổi mật khẩu</Text>
        <HeyInput label="Mật khẩu hiện tại" value={curPw} onChangeText={setCurPw} secureTextEntry revealable autoCapitalize="none" autoCorrect={false} />
        <HeyInput label="Mật khẩu mới (ít nhất 8 ký tự)" value={newPw} onChangeText={setNewPw} secureTextEntry revealable autoCapitalize="none" autoCorrect={false} />
        {!!pwError && <Text style={styles.error}>⚠️ {pwError}</Text>}
        {!!pwNotice && <Text style={styles.success}>✓ {pwNotice}</Text>}
        <HeyButton title={pwSaving ? '⏳ Đang lưu...' : '🔑 Đổi mật khẩu'} variant="secondary" onPress={savePassword} disabled={pwSaving} />
      </HeyCard>

      <HeyCard style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>Mã PIN Chế độ Trẻ Em</Text>
          <Badge label={hasKidPin ? 'Đã đặt' : 'Chưa đặt'} tone={hasKidPin ? 'success' : 'warning'} />
        </View>
        <Text style={styles.hint}>
          Mã PIN 4–6 số giúp bé không tự thoát khỏi Chế độ Trẻ Em. Máy chủ lưu và kiểm tra mã PIN; ứng dụng không lưu mã PIN.
        </Text>
        {hasKidPin && (
          <HeyInput
            label="Mã PIN hiện tại"
            value={currentPin}
            onChangeText={setCurrentPin}
            keyboardType="numeric"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
        <HeyInput
          label={hasKidPin ? 'Mã PIN mới (4–6 số)' : 'Mã PIN (4–6 số)'}
          value={newPin}
          onChangeText={setNewPin}
          keyboardType="numeric"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!!pinError && <Text style={styles.error}>⚠️ {pinError}</Text>}
        {!!pinNotice && <Text style={styles.success}>✓ {pinNotice}</Text>}
        <HeyButton
          title={saving ? '⏳ Đang lưu...' : hasKidPin ? '🔒 Đổi mã PIN' : '🔒 Đặt mã PIN'}
          variant="secondary"
          onPress={savePin}
          disabled={saving}
        />
      </HeyCard>

      <HeyCard style={styles.card}>
        <Text style={styles.cardTitle}>Máy chủ</Text>
        <Text style={styles.hint}>
          {apiBaseUrl
            ? `Địa chỉ hiện tại: ${apiBaseUrl}. Địa chỉ đặt bằng biến môi trường EXPO_PUBLIC_API_URL khi chạy ứng dụng.`
            : API_NOT_CONFIGURED_MESSAGE}
        </Text>
        {__DEV__ && (
          <>
            <HeyInput
              label="Địa chỉ tạm thời (chỉ khi phát triển)"
              placeholder="http://<địa-chỉ-máy-chủ>:<cổng>"
              value={customUrl}
              onChangeText={setCustomUrl}
              error={urlError ?? undefined}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.btnRow}>
              <HeyButton title="Áp dụng" variant="secondary" size="sm" onPress={() => applyUrl(customUrl)} />
              <HeyButton
                title="Dùng cấu hình"
                variant="outline"
                size="sm"
                onPress={() => {
                  setCustomUrl('');
                  applyUrl(null);
                }}
              />
            </View>
          </>
        )}
      </HeyCard>

      <HeyButton title="🚪 Đăng xuất" variant="outline" onPress={onLogout} style={styles.logout} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 14, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 12, color: Colors.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flexShrink: 1 },
  hint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  error: { fontSize: 13, color: '#B91C1C', fontWeight: '700' },
  success: { fontSize: 13, color: Colors.textOnGreen, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 8 },
  logout: { marginTop: 4 },
});
