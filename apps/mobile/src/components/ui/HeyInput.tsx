// apps/mobile/src/components/ui/HeyInput.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';

interface HeyInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  hint?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  // Tùy chọn có kiểm soát (không đặt = giữ mặc định của TextInput, không ảnh hưởng form khác)
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  editable?: boolean;
  /** Hiện nút hiện/ẩn cho ô mật khẩu (secureTextEntry) */
  revealable?: boolean;
}

export const HeyInput: React.FC<HeyInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  error,
  hint,
  style,
  inputStyle,
  keyboardType = 'default',
  autoCapitalize,
  autoCorrect,
  editable,
  revealable = false,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const canReveal = revealable && secureTextEntry;
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label || placeholder}
        accessibilityHint={error || hint}
        placeholder={placeholder}
        placeholderTextColor={Colors.textPlaceholder}
        secureTextEntry={secureTextEntry && !revealed}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        editable={editable}
        style={[
          styles.input,
          multiline && { height: 24 * numberOfLines + 20, textAlignVertical: 'top' },
          editable === false ? { opacity: 0.6 } : null,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          canReveal ? { paddingRight: 48 } : null,
          inputStyle,
        ]}
      />
      {canReveal && (
        <TouchableOpacity
          onPress={() => setRevealed((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          style={styles.reveal}
        >
          <Text style={styles.revealText}>{revealed ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
      </View>
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Vùng chạm 44pt ở mép phải ô nhập
  reveal: {
    position: 'absolute',
    right: 2,
    top: 0,
    bottom: 0,
    width: Touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  revealText: { fontSize: 18 },
  container: {
    marginBottom: 14,
  },
  label: {
    ...Typography.label,
    color: Colors.text,
    marginBottom: 6,
  },
  // Viền outlineStrong >= 3:1 với nền (WCAG 1.4.11), 1.5px để không nặng nề; cỡ chữ 16 để Web/iOS không tự phóng to khi focus
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.outlineStrong,
    borderRadius: Radius.md,
    minHeight: Touch.min + 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FontFamily.regular,
    fontWeight: 'normal',
    fontSize: 16,
    color: Colors.text,
  },
  // Chỉ đổi màu viền (độ dày cố định) để nội dung không xê dịch khi focus/lỗi
  inputFocused: {
    borderColor: Colors.focus,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
  },
  hintText: {
    ...Typography.caption,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
