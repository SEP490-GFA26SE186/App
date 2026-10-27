// apps/mobile/src/components/parent/ChildFormSheet.tsx
// Form thêm/sửa hồ sơ bé (POST/PUT /children): name ≤100, birthDate YYYY-MM-DD (nhập chữ, không picker).
// Chỉ báo thành công khi BE lưu xong; lỗi (vd vượt giới hạn hồ sơ của gói) hiện nguyên văn từ BE.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChildProfile } from '../../types/domain';
import { Sheet } from '../ui/Sheet';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { childService } from '../../services';
import { CHILD_NAME_MAX, validateBirthDate } from '../../utils/validation';

interface ChildFormSheetProps {
  visible: boolean;
  /** Có giá trị = sửa hồ sơ này; không có = thêm mới */
  child?: ChildProfile;
  onClose: () => void;
  onSaved: (child: ChildProfile) => void;
}

export const ChildFormSheet: React.FC<ChildFormSheetProps> = ({ visible, child, onClose, onSaved }) => {
  const editing = !!child;
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Mỗi lần mở: nạp giá trị hiện tại (sửa) hoặc để trống (thêm)
  useEffect(() => {
    if (!visible) return;
    setName(child?.name ?? '');
    setBirthDate(child?.birthDate ?? '');
    setErrors({});
    setFormError(null);
  }, [visible, child?.id]);

  const close = () => {
    if (submittingRef.current) return;
    onClose();
  };

  const submit = async () => {
    if (submittingRef.current) return;
    const next: { name?: string; birthDate?: string } = {};
    if (!name.trim()) next.name = 'Ba mẹ nhập tên bé nhé';
    else if (name.trim().length > CHILD_NAME_MAX) next.name = `Tên tối đa ${CHILD_NAME_MAX} ký tự`;
    const dateError = validateBirthDate(birthDate);
    if (dateError) next.birthDate = dateError;
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), birthDate: birthDate.trim() };
      const saved = child ? await childService.updateChild(child.id, payload) : await childService.createChild(payload);
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || (editing ? 'Không thể lưu hồ sơ bé. Vui lòng thử lại.' : 'Không thể tạo hồ sơ bé. Vui lòng thử lại.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title={editing ? 'Sửa hồ sơ bé' : 'Thêm hồ sơ bé'}
      description="Mỗi bé có một hồ sơ riêng để theo dõi tủ sách và tiến độ EQ."
      onClose={close}
    >
      <HeyInput
        label="Tên bé *"
        placeholder="Nhập tên bé"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
      />
      <HeyInput
        label="Ngày sinh * (YYYY-MM-DD)"
        placeholder="vd: 2020-05-01"
        value={birthDate}
        onChangeText={(t) => {
          setBirthDate(t);
          setErrors((e) => ({ ...e, birthDate: undefined }));
        }}
        error={errors.birthDate}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {!!formError && (
        <View style={styles.formErrorBox} accessibilityRole="alert">
          <Icon name="alert-circle" size={18} color={Colors.danger} />
          <Text style={styles.formError}>{formError}</Text>
        </View>
      )}
      <HeyButton
        title={editing ? 'Lưu thay đổi' : 'Tạo hồ sơ'}
        onPress={submit}
        loading={submitting}
        style={styles.btn}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  formErrorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.dangerTint, padding: 12, borderRadius: 12, marginBottom: 8 },
  formError: { ...Typography.label, color: Colors.danger, flex: 1 },
  btn: { marginTop: 4, marginBottom: 8 },
});
