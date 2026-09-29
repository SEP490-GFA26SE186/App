/**
 * src/shims/vector-icons-stub.tsx
 * 
 * High-performance Web SVG shim for @expo/vector-icons.
 * Maps Feather, MaterialCommunityIcons, Ionicons, etc. to Lucide React SVG stroke icons on Web.
 */
import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

// Name mapping dictionary to Lucide Stroke Icons
const ICON_NAME_MAP: Record<string, keyof typeof LucideIcons> = {
  // Common / Navigation
  'x': 'X',
  'close': 'X',
  'home': 'Home',
  'book': 'Book',
  'book-open': 'BookOpen',
  'calendar': 'Calendar',
  'file-text': 'FileText',
  'chevron-left': 'ChevronLeft',
  'chevron-right': 'ChevronRight',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'play': 'Play',
  'square': 'Square',
  'pause': 'Pause',
  'volume-2': 'Volume2',
  'volume-x': 'VolumeX',
  'check': 'Check',
  'check-circle': 'CheckCircle',
  'plus': 'Plus',
  'plus-circle': 'PlusCircle',
  'star': 'Star',
  'heart': 'Heart',
  'award': 'Award',
  'shield': 'Shield',
  'zap': 'Zap',
  'sparkles': 'Sparkles',
  'compass': 'Compass',
  'moon': 'Moon',
  'sun': 'Sun',
  'users': 'Users',
  'user': 'User',
  'user-check': 'UserCheck',
  'smile': 'Smile',
  'edit-3': 'Edit3',
  'lock': 'Lock',
  'cpu': 'Cpu',
  'image': 'Image',
  'git-branch': 'GitBranch',
  'credit-card': 'CreditCard',
  'trending-up': 'TrendingUp',

  // MaterialCommunityIcons & Ionicons aliases
  'dog': 'PawPrint',
  'human-female': 'User',
  'creation-outline': 'Sparkles',
  'castle': 'Castle',
  'waves': 'Waves',
  'tent': 'Tent',
  'flower-tulip-outline': 'Flower2',
  'planet-outline': 'Globe',
  'wallet-outline': 'Wallet',
  'party-popper': 'PartyPopper',
};

const createIconComponent = () => {
  return ({ name, size = 20, color = 'currentColor', style }: IconProps) => {
    const lucideName = ICON_NAME_MAP[name] || 'Sparkles';
    const LucideComponent = (LucideIcons as any)[lucideName] || LucideIcons.Sparkles;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          color,
          verticalAlign: 'middle',
          ...style,
        }}
      >
        <LucideComponent size={size} color={color} strokeWidth={2} />
      </span>
    );
  };
};

export const Feather = createIconComponent();
export const MaterialCommunityIcons = createIconComponent();
export const Ionicons = createIconComponent();
export const MaterialIcons = createIconComponent();
export const FontAwesome = createIconComponent();
export const FontAwesome5 = createIconComponent();
export const AntDesign = createIconComponent();
export const Octicons = createIconComponent();
export const SimpleLineIcons = createIconComponent();
export const Entypo = createIconComponent();
export const EvilIcons = createIconComponent();
export const Foundation = createIconComponent();
export const Zocial = createIconComponent();

export default {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  AntDesign,
  Octicons,
  SimpleLineIcons,
  Entypo,
  EvilIcons,
  Foundation,
  Zocial,
};
