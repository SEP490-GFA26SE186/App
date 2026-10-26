// apps/mobile/src/components/parent/CharacterFormSheet.tsx
// Form thêm nhân vật gia đình (POST /characters): name ≤100, appearance 3–1000, KHÔNG có role (rev8).
import React, { useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { characterService } from '../../services';
import { CharacterView } from '../../types/viewModels';
import { APPEARANCE_MAX, APPEARANCE_MIN, CHARACTER_NAME_MAX } from '../../utils/validation';

interface CharacterFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: (character: CharacterView) => void;
}

export const CharacterFormSheet: React.FC<CharacterFormSheetProps> = ({ visible, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [errors, setErrors] = useState<{ name?: string; appearance?: string }>({});
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
    const next: { name?: string; appearance?: string } = {};
    if (!name.trim()) next.name = 'Ba mẹ nhập tên nhân vật nhé';
    else if (name.trim().length > CHARACTER_NAME_MAX) next.name = `Tên tối đa ${CHARACTER_NAME_MAX} ký tự`;
    const len = appearance.trim().length;
    if (len < APPEARANCE_MIN) next.appearance = `Mô tả tối thiểu ${APPEARANCE_MIN} ký tự`;
    else if (len > APPEARANCE_MAX) next.appearance = `Mô tả tối đa ${APPEARANCE_MAX} ký tự`;
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      const created = await characterService.createCharacter({ name: name.trim(), appearance: appearance.trim() });
      setName('');
      setAppearance('');
      onCreated(created);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Không thể thêm nhân vật. Vui lòng thử lại.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title="Thêm nhân vật gia đình"
      description="Ông bà, anh chị em, bạn bè, thú cưng… Tên thật không gửi cho AI, chỉ mô tả ngoại hình."
      onClose={close}
    >
      <HeyInput
        label="Tên gọi trong truyện *"
        placeholder="Nhập tên nhân vật"
        value={name}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
      />
      <HeyInput
        label="Mô tả ngoại hình, tính cách *"
        placeholder="Tóc, dáng người, trang phục, điều bé thích…"
        value={appearance}
        onChangeText={(t) => {
          setAppearance(t);
          setErrors((e) => ({ ...e, appearance: undefined }));
        }}
        error={errors.appearance}
        hint={`${appearance.trim().length}/${APPEARANCE_MAX} ký tự`}
        multiline
        numberOfLines={4}
      />
      {!!formError && <Text style={styles.formError}>⚠️ {formError}</Text>}
      <HeyButton
        title={submitting ? '⏳ Đang thêm...' : 'Thêm nhân vật'}
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
