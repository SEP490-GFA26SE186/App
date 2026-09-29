// apps/mobile/src/components/AuthModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { HeyButton } from './ui/HeyButton';
import { HeyInput } from './ui/HeyInput';
import { UserAccount, ChildProfile } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserUpdate: (user: UserAccount | null) => void;
  childrenProfiles: ChildProfile[];
  onAddChild: (child: Partial<ChildProfile>) => void;
  initialTab?: 'LOGIN' | 'REGISTER' | 'PROFILE' | 'CHILDREN' | 'KID_PIN';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  childrenProfiles,
  onAddChild,
  initialTab = 'LOGIN',
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER' | 'PROFILE' | 'CHILDREN' | 'KID_PIN'>(
    currentUser ? 'PROFILE' : initialTab
  );

  const [email, setEmail] = useState(currentUser?.email || 'me.lan@gmail.com');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState(currentUser?.fullName || 'Mẹ Lan Phương');
  const [phone, setPhone] = useState(currentUser?.phone || '0901234567');
  const [kidPin, setKidPin] = useState(currentUser?.kidModePinHash || '1234');
  const [newChildName, setNewChildName] = useState('');
  const [newChildAge, setNewChildAge] = useState('4');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSaveProfile = () => {
    if (currentUser) {
      const updated: UserAccount = {
        ...currentUser,
        fullName,
        phone,
        kidModePinHash: kidPin,
      };
      onUserUpdate(updated);
      setNotice('Đã cập nhật thông tin thành công!');
      setTimeout(() => {
        setNotice(null);
        onClose();
      }, 1000);
    }
  };

  const handleAddNewChild = () => {
    if (!newChildName.trim()) return;
    onAddChild({
      name: newChildName,
      age: parseInt(newChildAge, 10) || 4,
      readingLevel: 'BEGINNER',
    });
    setNewChildName('');
    setNotice(`Đã thêm bé ${newChildName} thành công!`);
    setTimeout(() => setNotice(null), 1500);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {tab === 'PROFILE'
                ? 'Hồ sơ tài khoản'
                : tab === 'CHILDREN'
                  ? 'Quản lý bé yêu'
                  : tab === 'KID_PIN'
                    ? 'Mã PIN Kid Mode'
                    : tab === 'REGISTER'
                      ? 'Tạo tài khoản mới'
                      : 'Đăng nhập StoryWeaver'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={styles.tabRow}>
            {currentUser ? (
              <>
                <TouchableOpacity
                  onPress={() => setTab('PROFILE')}
                  style={[styles.tabChip, tab === 'PROFILE' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'PROFILE' && styles.tabChipTextActive]}>
                    Hồ sơ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab('CHILDREN')}
                  style={[styles.tabChip, tab === 'CHILDREN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'CHILDREN' && styles.tabChipTextActive]}>
                    Bé ({childrenProfiles.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab('KID_PIN')}
                  style={[styles.tabChip, tab === 'KID_PIN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'KID_PIN' && styles.tabChipTextActive]}>
                    PIN Bé
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setTab('LOGIN')}
                  style={[styles.tabChip, tab === 'LOGIN' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'LOGIN' && styles.tabChipTextActive]}>
                    Đăng nhập
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab('REGISTER')}
                  style={[styles.tabChip, tab === 'REGISTER' && styles.tabChipActive]}
                >
                  <Text style={[styles.tabChipText, tab === 'REGISTER' && styles.tabChipTextActive]}>
                    Đăng ký
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {tab === 'PROFILE' && (
              <View>
                <HeyInput label="Họ và tên" value={fullName} onChangeText={setFullName} />
                <HeyInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <HeyInput label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <HeyButton title="💾 Lưu thay đổi" onPress={handleSaveProfile} style={styles.mt} />
                <HeyButton
                  title="🚪 Đăng xuất"
                  variant="outline"
                  onPress={() => {
                    onUserUpdate(null);
                    setTab('LOGIN');
                  }}
                  style={styles.mtSm}
                />
              </View>
            )}

            {tab === 'CHILDREN' && (
              <View>
                <Text style={styles.sectionTitle}>Danh sách hồ sơ bé:</Text>
                {childrenProfiles.map((ch) => (
                  <View key={ch.id} style={styles.childItem}>
                    <Text style={styles.childEmoji}>👶</Text>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{ch.name}</Text>
                      <Text style={styles.childMeta}>{ch.age} tuổi • {ch.readingLevel}</Text>
                    </View>
                  </View>
                ))}

                <Text style={[styles.sectionTitle, styles.mt]}>Thêm hồ sơ bé mới:</Text>
                <HeyInput label="Tên bé" placeholder="vd: Bé Bắp" value={newChildName} onChangeText={setNewChildName} />
                <HeyInput label="Tuổi của bé" placeholder="vd: 4" value={newChildAge} onChangeText={setNewChildAge} keyboardType="numeric" />
                <HeyButton title="➕ Thêm hồ sơ bé" variant="teal" onPress={handleAddNewChild} style={styles.mtSm} />
              </View>
            )}

            {tab === 'KID_PIN' && (
              <View>
                <Text style={styles.descText}>
                  Mã PIN 4 số giúp ngăn bé vô tình thoát khỏi giao diện Kid Mode hoặc bấm sang chợ truyện.
                </Text>
                <HeyInput
                  label="Mã PIN 4 số hiện tại"
                  value={kidPin}
                  onChangeText={setKidPin}
                  keyboardType="numeric"
                  placeholder="1234"
                />
                <HeyButton title="🔒 Lưu mã PIN" variant="secondary" onPress={handleSaveProfile} style={styles.mt} />
              </View>
            )}

            {tab === 'LOGIN' && (
              <View>
                <HeyInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <HeyInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
                <HeyButton
                  title="🚀 Đăng nhập ngay"
                  onPress={() => {
                    onUserUpdate({
                      id: 'usr_parent_01',
                      email,
                      fullName: 'Mẹ Lan Phương',
                      role: 'PARENT',
                      creditBalance: 85,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    onClose();
                  }}
                  style={styles.mt}
                />
              </View>
            )}

            {tab === 'REGISTER' && (
              <View>
                <HeyInput label="Họ tên phụ huynh" value={fullName} onChangeText={setFullName} />
                <HeyInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <HeyInput label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry />
                <HeyButton
                  title="✨ Hoàn tất đăng ký"
                  variant="teal"
                  onPress={() => {
                    onUserUpdate({
                      id: 'usr_new',
                      email,
                      fullName,
                      role: 'PARENT',
                      creditBalance: 50,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    onClose();
                  }}
                  style={styles.mt}
                />
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
    maxHeight: height * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
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
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: 8,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
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
  mt: {
    marginTop: 14,
  },
  mtSm: {
    marginTop: 8,
  },
});
