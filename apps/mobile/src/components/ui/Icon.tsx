// apps/mobile/src/components/ui/Icon.tsx — R2: icon vector dùng chung (Ionicons của @expo/vector-icons, đã cài sẵn).
// Icon chức năng thay emoji (audit D1); emoji chỉ còn là nội dung cảm xúc.
// Không có `label` = icon trang trí → ẩn khỏi trình đọc màn hình. Icon mang nghĩa riêng (không kèm chữ) phải có `label`.
import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../../theme/colors';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  label?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({ name, size = 22, color = Colors.text, label, style }) => (
  <Ionicons
    name={name}
    size={size}
    color={color}
    style={style}
    accessible={!!label}
    accessibilityLabel={label}
    accessibilityRole={label ? 'image' : undefined}
    importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    accessibilityElementsHidden={!label}
    aria-hidden={label ? undefined : true}
  />
);

/** Font icon nạp cùng font chữ ở App.tsx để icon không "nhảy" khi mở màn đầu tiên. */
export const ICON_FONTS = Ionicons.font;
