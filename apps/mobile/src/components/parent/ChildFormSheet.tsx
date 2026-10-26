// apps/mobile/src/components/parent/ChildFormSheet.tsx
// Form thêm hồ sơ bé (POST /children): name ≤100, birthDate YYYY-MM-DD (nhập chữ, không picker).
// Chỉ báo thành công khi BE tạo xong; lỗi (vd vượt giới hạn hồ sơ của gói) hiện nguyên văn từ BE.
import React, { useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { ChildProfile } from '../../../../../packages/shared-types';
import { Sheet } from '../ui/Sheet';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { childService } from '../../services';
import { CHILD_NAME_MAX, validateBirthDate } from '../../utils/validation';

interface ChildFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (child: ChildProfile) => void;
}

export const ChildFormSheet: React.FC<ChildFormSheetProps> = ({ visible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; birthDate?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const close = () => {
    if (submittingRef.current) return;
    setFormError(null);
    setErrors({});
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
      const created = await childService.createChild({ name: name.trim(), birthDate: birthDate.trim() });
      setName('');
      setBirthDate('');
      onCreated(created);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể tạo hồ sơ bé. Vui lòng thử lại.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Thêm hồ sơ bé"
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
      {!!formError && <Text style={styles.formError}>⚠️ {formError}</Text>}
      <HeyButton
        title={submitting ? '⏳ Đang tạo...' : 'Tạo hồ sơ'}
        onPress={submit}
        disabled={submitting}
        style={styles.btn}
      />
    </Sheet>
  );
};

const styles = StyleSheet.create({
  formError: { color: '#B91C1C', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  btn: { marginTop: 4, marginBottom: 8 },
});
