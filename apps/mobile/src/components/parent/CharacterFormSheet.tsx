// apps/mobile/src/components/parent/CharacterFormSheet.tsx
// Form thêm/sửa nhân vật gia đình (POST/PUT /characters): name ≤100, appearance 3–1000, KHÔNG có role (rev8).
// Nhân vật đại diện của bé (có childId): BE không cho đổi tên ở đây → chỉ sửa mô tả.
import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Sheet } from '../ui/Sheet';
import { HeyInput } from '../ui/HeyInput';
import { HeyButton } from '../ui/HeyButton';
import { characterService } from '../../services';
import { CharacterView } from '../../types/viewModels';
import { APPEARANCE_MAX, APPEARANCE_MIN, CHARACTER_NAME_MAX } from '../../utils/validation';

interface CharacterFormSheetProps {
  visible: boolean;
  /** Có giá trị = sửa nhân vật này; không có = thêm mới */
  character?: CharacterView;
  onClose: () => void;
  onSaved: (character: CharacterView) => void;
}

export const CharacterFormSheet: React.FC<CharacterFormSheetProps> = ({ visible, character, onClose, onSaved }) => {
  const editing = !!character;
  const nameLocked = !!character?.childId;
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [errors, setErrors] = useState<{ name?: string; appearance?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    setName(character?.name ?? '');
    setAppearance(character?.appearanceDescription ?? '');
    setErrors({});
    setFormError(null);
  }, [visible, character?.id]);

  const close = () => {
    if (submittingRef.current) return;
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
      const saved = character
        ? await characterService.updateCharacter(character.id, {
            // Nhân vật của bé: không gửi `name` (BE trả 422 nếu đổi tên)
            ...(nameLocked ? {} : { name: name.trim() }),
            appearance: appearance.trim(),
          })
        : await characterService.createCharacter({ name: name.trim(), appearance: appearance.trim() });
      onSaved(saved);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || (editing ? 'Không thể lưu nhân vật. Vui lòng thử lại.' : 'Không thể thêm nhân vật. Vui lòng thử lại.'));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      title={editing ? 'Sửa nhân vật' : 'Thêm nhân vật gia đình'}
      description="Ông bà, anh chị em, bạn bè, thú cưng… Tên thật không gửi cho AI, chỉ mô tả ngoại hình."
      onClose={close}
    >
      <HeyInput
        label="Tên gọi trong truyện *"
        placeholder="Nhập tên nhân vật"
        value={name}
        editable={!nameLocked}
        onChangeText={(t) => {
          setName(t);
          setErrors((e) => ({ ...e, name: undefined }));
        }}
        error={errors.name}
        hint={nameLocked ? 'Nhân vật của bé: đổi tên ở mục “Bé nhà mình”.' : undefined}
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
        title={submitting ? '⏳ Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm nhân vật'}
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
