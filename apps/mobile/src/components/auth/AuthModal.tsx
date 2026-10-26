// apps/mobile/src/components/AuthModal.tsx
// DEPRECATED (Phase B): không còn được mount. Chức năng đã chuyển sang SettingsScreen (PIN, tài khoản, máy chủ),
// ChildrenScreen (thêm bé) và MoreScreen (đăng xuất). Giữ file, chưa xóa khi chưa được duyệt.
import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { HeyButton } from '../ui/HeyButton';
import { HeyInput } from '../ui/HeyInput';
import { ChildProfile } from '../../../../../packages/shared-types';
import { SessionUser } from '../../types/sessionUser';
import { Colors } from '../../theme/colors';
import {
  authService,
  childService,
  getApiBaseUrl,
  setDevApiBaseUrl,
  API_NOT_CONFIGURED_MESSAGE,
} from '../../services';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionUser | null;
  onUserUpdate: (user: SessionUser | null) => void;
  childrenProfiles: ChildProfile[];
  onAddChild: (child: Partial<ChildProfile>) => void;
  initialTab?: 'LOGIN' | 'REGISTER' | 'PROFILE' | 'CHILDREN' | 'KID_PIN' | 'SERVER';
  onLogout?: () => void;
  onRefreshData?: () => void;
  onReplayIntro?: () => void;
}

// BE trả message tiếng Anh → dịch lỗi PIN hay gặp (đối chiếu auth.service.js / Web VI_MESSAGES)
const PIN_VI_MESSAGES: Record<string, string> = {
  'Current PIN is incorrect': 'Mã PIN hiện tại chưa đúng',
  'Account password is incorrect': 'Mật khẩu tài khoản chưa đúng',
  'Kid Exit PIN is already set. Use change-pin endpoint to change it.':
    'Tài khoản đã có mã PIN, vui lòng dùng chức năng đổi PIN',
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  childrenProfiles,
  onAddChild,
  initialTab = 'LOGIN',
  onLogout,
  onRefreshData,
  onReplayIntro,
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'PROFILE' | 'CHILDREN' | 'KID_PIN' | 'SERVER'>(
    currentUser ? 'PROFILE' : initialTab
  );

  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [kidPin, setKidPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthDate, setNewChildBirthDate] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);
  const writingRef = useRef(false);
  const [isWriting, setIsWriting] = useState(false);

  // Server Environment State
  const [apiBaseUrl, setApiBaseUrlState] = useState<string | null>(getApiBaseUrl());
  const [customUrl, setCustomUrl] = useState('');

  // PIN do BE xác minh/lưu (POST /auth/kid-pin/set, PUT /auth/kid-pin/change).
  // Client KHÔNG lưu PIN; chỉ giữ cờ "đã có PIN" ('****') để UI biết dùng set hay change.
  // Chỉ nhận 4 số vì bàn phím PIN của Kid Mode hiện cố định 4 số (BE chấp nhận 4–6 → T3.3).
  const hasKidPin = !!currentUser?.kidModePinHash;

  const handleSavePin = async () => {
    if (!currentUser || writingRef.current) return;
    setErrorMsg(null);
    if (!/^\d{4}$/.test(kidPin)) {
      setErrorMsg('Mã PIN gồm đúng 4 chữ số.');
      return;
    }
    if (hasKidPin && !/^\d{4,6}$/.test(currentPin)) {
      setErrorMsg('Vui lòng nhập mã PIN hiện tại (4–6 chữ số).');
      return;
    }
    writingRef.current = true;
    setIsWriting(true);
    try {
      if (hasKidPin) {
        await authService.changeKidPin({ newPin: kidPin, currentPin });
      } else {
        await authService.setKidPin(kidPin);
      }
      onUserUpdate({ ...currentUser, kidModePinHash: '****' });
      setKidPin('');
      setCurrentPin('');
      setNotice(hasKidPin ? 'Đã đổi mã PIN.' : 'Đã đặt mã PIN.');
      setTimeout(() => setNotice(null), 1500);
    } catch (err: any) {
      setErrorMsg(PIN_VI_MESSAGES[err?.message] ?? err?.message ?? 'Không thể lưu mã PIN. Vui lòng thử lại.');
    } finally {
      writingRef.current = false;
      setIsWriting(false);
    }
  };

  const handleLogoutAction = () => {
    // App.handleLogout xóa phiên cục bộ ngay và báo BE; không chờ mạng
    onUserUpdate(null);
    if (onLogout) onLogout();
    setTab('LOGIN');
    onClose();
  };

  const handleLoginSubmit = async () => {
    if (submittingRef.current) return;
    setErrorMsg(null);
    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email/tên đăng nhập và mật khẩu');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const user = await authService.login(email.trim(), password);
      setPassword('');
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      onUserUpdate(user);
      setNotice(`Đăng nhập thành công! Chào ${user.fullName}`);
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        setNotice(null);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin hoặc chuyển môi trường.');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (submittingRef.current) return;
    setErrorMsg(null);
    if (!email.trim() || !password || !fullName.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ tên, email và mật khẩu');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Mật khẩu tối thiểu 8 ký tự (yêu cầu bảo mật)');
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    try {
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      const user = await authService.register({
        username: username.length >= 3 ? username : `${username}_usr`,
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      onUserUpdate(user);
      setNotice('Đăng ký tài khoản thành công!');
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        setNotice(null);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Đăng ký thất bại');
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const handleAddNewChild = async () => {
    if (writingRef.current) return;
    setErrorMsg(null);
    const name = newChildName.trim();
    const birthDate = newChildBirthDate.trim();
    if (!name) {
      setErrorMsg('Vui lòng nhập tên bé.');
      return;
    }
    // BE: birthDate dạng YYYY-MM-DD; gửi đúng giá trị người dùng nhập
    const parsed = new Date(birthDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      setErrorMsg('Ngày sinh cần đúng dạng YYYY-MM-DD (ví dụ 2020-05-01) và không ở tương lai.');
      return;
    }
    writingRef.current = true;
    setIsWriting(true);
    try {
      const created = await childService.createChild({ name, birthDate });
      onAddChild(created);
      setNewChildName('');
      setNewChildBirthDate('');
      setNotice(`Đã thêm bé ${created.name}.`);
      setTimeout(() => setNotice(null), 1500);
    } catch (err: any) {
      // Không tạo bé giả: hiển thị lỗi thật từ BE (vd vượt giới hạn hồ sơ bé)
      setErrorMsg(err?.message || 'Không thể thêm hồ sơ bé. Vui lòng thử lại.');
    } finally {
      writingRef.current = false;
      setIsWriting(false);
    }
  };

  // Chỉ __DEV__: nhập địa chỉ máy chủ (vd IP LAN) lúc chạy thử; production dùng EXPO_PUBLIC_API_URL
  const handleApplyUrl = (value: string | null) => {
    if (!setDevApiBaseUrl(value)) {
      setErrorMsg('Địa chỉ máy chủ không hợp lệ (cần dạng http://host:port).');
      return;
    }
    setErrorMsg(null);
    setApiBaseUrlState(getApiBaseUrl());
    setNotice(value ? 'Đã áp dụng địa chỉ máy chủ tạm thời.' : 'Đã quay lại địa chỉ máy chủ trong cấu hình.');
    setTimeout(() => setNotice(null), 2000);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {tab === 'PROFILE'
                  ? 'Hồ sơ tài khoản'
                  : tab === 'CHILDREN'
                  ? 'Quản lý bé yêu'
                  : tab === 'KID_PIN'
                  ? 'Mã PIN Kid Mode'
                  : tab === 'REGISTER'
                  ? 'Tạo tài khoản mới'
                  : tab === 'SERVER'
                  ? 'Máy chủ API'
                  : 'Đăng nhập StoryWeaver'}
              </Text>
              <Text style={styles.envSubText}>
                API: <Text style={{ fontWeight: '700', color: Colors.primary }}>{apiBaseUrl ?? 'Chưa cấu hình'}</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.tabRow}>
            {currentUser ? (
              <>
                <TouchableOpacity
                  onPress={() => { setTab('PROFILE'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'PROFILE' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'PROFILE' && styles.tabChipTextActive]}>
                    Hồ sơ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTab('CHILDREN'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'CHILDREN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'CHILDREN' && styles.tabChipTextActive]}>
                    Bé ({childrenProfiles.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTab('KID_PIN'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'KID_PIN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'KID_PIN' && styles.tabChipTextActive]}>
                    PIN Bé
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTab('SERVER'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'SERVER' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'SERVER' && styles.tabChipTextActive]}>
                    ⚙️ API
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => { setTab('LOGIN'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'LOGIN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'LOGIN' && styles.tabChipTextActive]}>
                    Đăng nhập
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTab('REGISTER'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'REGISTER' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'REGISTER' && styles.tabChipTextActive]}>
                    Đăng ký
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setTab('SERVER'); setErrorMsg(null); }}
                  style={[styles.tabChip, tab === 'SERVER' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'SERVER' && styles.tabChipTextActive]}>
                    ⚙️ Môi trường
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {notice && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>✨ {notice}</Text>
            </View>
          )}

          {errorMsg && (
            <View style={[styles.noticeBox, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Text style={[styles.noticeText, { color: '#DC2626' }]}>⚠️ {errorMsg}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {tab === 'PROFILE' && (
              <View>
                {/* BE chưa có API cập nhật hồ sơ phụ huynh (BLOCKED U8) → chỉ xem, không "lưu" giả */}
                <HeyInput label="Họ và tên" value={currentUser?.fullName ?? ''} onChangeText={() => {}} editable={false} />
                <HeyInput label="Email" value={currentUser?.email ?? ''} onChangeText={() => {}} editable={false} autoCapitalize="none" autoCorrect={false} />
                <HeyInput label="Số điện thoại" value={currentUser?.phone ?? ''} onChangeText={() => {}} keyboardType="phone-pad" editable={false} />
                <Text style={styles.descText}>
                  Chỉnh sửa hồ sơ chưa được hỗ trợ (máy chủ chưa cung cấp chức năng cập nhật).
                </Text>
                {onReplayIntro && (
                  <HeyButton
                    title="🎬 Xem lại Video Intro"
                    variant="teal"
                    onPress={() => {
                      onReplayIntro();
                      onClose();
                    }}
                    style={styles.mtSm}
                  />
                )}
                <HeyButton
                  title="🚪 Đăng xuất"
                  variant="outline"
                  onPress={handleLogoutAction}
                  style={styles.mtSm}
                />
              </View>
            )}

            {tab === 'CHILDREN' && (
              <View>
                <Text style={styles.sectionTitle}>Danh sách hồ sơ bé:</Text>
                {childrenProfiles.map((ch) => (
                  <View key={ch.id} style={styles.childItem}>
                    <Text style={styles.childEmoji}>
                      {ch.gender === 'FEMALE' ? '👧' : '👦'}
                    </Text>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{ch.name}</Text>
                      <Text style={styles.childMeta}>
                        {ch.age} tuổi{ch.birthDate ? ` • ${ch.birthDate}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}

                <Text style={[styles.sectionTitle, styles.mt]}>Thêm hồ sơ bé mới:</Text>
                <HeyInput label="Tên bé" placeholder="vd: Bé Bin" value={newChildName} onChangeText={setNewChildName} />
                <HeyInput
                  label="Ngày sinh (YYYY-MM-DD)"
                  placeholder="vd: 2020-05-01"
                  value={newChildBirthDate}
                  onChangeText={setNewChildBirthDate}
                  keyboardType="numeric"
                  autoCorrect={false}
                />
                <HeyButton
                  title={isWriting ? '⏳ Đang thêm...' : '➕ Thêm hồ sơ bé'}
                  variant="teal"
                  onPress={handleAddNewChild}
                  style={styles.mtSm}
                  disabled={isWriting}
                />
              </View>
            )}

            {tab === 'KID_PIN' && (
              <View>
                <Text style={styles.descText}>
                  Mã PIN 4 số giúp ngăn bé vô tình thoát khỏi giao diện Chế độ Trẻ Em (Kid Mode).
                  Mã PIN được máy chủ lưu và kiểm tra; ứng dụng không lưu mã PIN.
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
                  label={hasKidPin ? 'Mã PIN mới (4 số)' : 'Mã PIN Kid Mode (4 số)'}
                  value={kidPin}
                  onChangeText={setKidPin}
                  keyboardType="numeric"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <HeyButton
                  title={isWriting ? '⏳ Đang lưu...' : hasKidPin ? '🔒 Đổi mã PIN' : '🔒 Đặt mã PIN'}
                  variant="secondary"
                  onPress={handleSavePin}
                  style={styles.mt}
                  disabled={isWriting}
                />
              </View>
            )}

            {tab === 'LOGIN' && (
              <View>
                <HeyInput label="Email / Tên đăng nhập" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <HeyInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />

                <HeyButton
                  title={loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập ngay'}
                  onPress={handleLoginSubmit}
                  style={styles.mt}
                  disabled={loading}
                />
              </View>
            )}

            {tab === 'REGISTER' && (
              <View>
                <HeyInput label="Họ tên phụ huynh" value={fullName} onChangeText={setFullName} />
                <HeyInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <HeyInput label="Số điện thoại (tùy chọn)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <HeyInput label="Mật khẩu (tối thiểu 8 ký tự)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />
                <HeyButton
                  title={loading ? '⏳ Đang tạo tài khoản...' : '✨ Hoàn tất đăng ký'}
                  variant="teal"
                  onPress={handleRegisterSubmit}
                  style={styles.mt}
                  disabled={loading}
                />
              </View>
            )}

            {tab === 'SERVER' && (
              <View>
                <Text style={styles.descText}>
                  {apiBaseUrl
                    ? `Địa chỉ máy chủ hiện tại: ${apiBaseUrl}. Địa chỉ được đặt bằng biến môi trường EXPO_PUBLIC_API_URL khi chạy ứng dụng.`
                    : API_NOT_CONFIGURED_MESSAGE}
                </Text>

                {__DEV__ && (
                  <>
                    <Text style={[styles.sectionTitle, styles.mt]}>Địa chỉ tạm thời (chỉ khi phát triển):</Text>
                    <HeyInput
                      label="Base URL"
                      placeholder="http://<địa-chỉ-máy-chủ>:<cổng>"
                      value={customUrl}
                      onChangeText={setCustomUrl}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <HeyButton
                      title="Áp dụng địa chỉ"
                      variant="secondary"
                      onPress={() => handleApplyUrl(customUrl)}
                      style={styles.mtSm}
                    />
                    <HeyButton
                      title="Dùng lại địa chỉ trong cấu hình"
                      variant="outline"
                      onPress={() => {
                        setCustomUrl('');
                        handleApplyUrl(null);
                      }}
                      style={styles.mtSm}
                    />
                  </>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: height * 0.88,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textDark,
  },
  envSubText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textDark,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 8,
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  tabChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabChipTextActive: {
    color: Colors.primary,
  },
  noticeBox: {
    backgroundColor: Colors.greenLight,
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  noticeText: {
    color: Colors.green,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 8,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBF7',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 6,
  },
  childEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  childMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  descText: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  envOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  envOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  envOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1F2937',
  },
  envOptionDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  mt: {
    marginTop: 14,
  },
  mtSm: {
    marginTop: 8,
  },
});
