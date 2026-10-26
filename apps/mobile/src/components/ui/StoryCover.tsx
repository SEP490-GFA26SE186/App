// apps/mobile/src/components/ui/StoryCover.tsx
// Ảnh bìa truyện từ BE; BE chưa có ảnh (null) thì hiện khung giữ chỗ, không dùng ảnh mạng giả.
import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View } from 'react-native';

export const StoryCover: React.FC<{ uri?: string | null; style?: StyleProp<ImageStyle> }> = ({ uri, style }) =>
  uri ? (
    <Image source={{ uri }} style={style} />
  ) : (
    <View style={[styles.placeholder, style as any]}>
      <Text style={styles.emoji}>📖</Text>
    </View>
  );

const styles = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9E0' },
  emoji: { fontSize: 36 },
});
