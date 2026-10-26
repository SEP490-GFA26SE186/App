// apps/mobile/src/components/ui/HeyInput.tsx
import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
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
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A099B0"
        secureTextEntry={secureTextEntry}
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
          inputStyle,
        ]}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
