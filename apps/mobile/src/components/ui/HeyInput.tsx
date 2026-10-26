// apps/mobile/src/components/ui/HeyInput.tsx
import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../theme/colors';

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
  const canReveal = revealable && secureTextEntry;
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A099B0"
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
          error ? styles.inputError : null,
          canReveal ? { paddingRight: 48 } : null,
          inputStyle,
        ]}
      />
      {canReveal && (
        <TouchableOpacity
          onPress={() => setRevealed((v) => !v)}
          accessibilityLabel={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          style={styles.reveal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.revealText}>{revealed ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  reveal: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  revealText: { fontSize: 18 },
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.textDark,
  },
  inputError: {
    borderColor: Colors.primary,
  },
  errorText: {
    color: Colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  hintText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
