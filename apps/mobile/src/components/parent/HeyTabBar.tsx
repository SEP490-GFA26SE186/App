// apps/mobile/src/components/parent/HeyTabBar.tsx — R3: thanh tab nổi dạng pill, icon vector (UI kit R2).
// 5 mục: Trang chủ · Tủ truyện · [Sáng tác] · Tiến độ · Hồ sơ. Credit đã chuyển lên pill ở header và vào Hồ sơ.
// Mỗi mục là một nút (role=button) có trạng thái chọn: Enter/Space hoạt động trên Web, vùng chạm >= 44pt,
// viền focus chỉ khi dùng bàn phím. Không còn animation lò xo (trạng thái nhấn tức thời) nên không phụ thuộc Reduce Motion.
import React from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Colors } from '../../theme/colors';
import { Elevation } from '../../theme/shadows';
import { Layout, Radius, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { soundFX } from '../../utils/sound-fx';
import { ROUTES, RouteKey } from '../../navigation/routes';
import { Icon, IconName } from '../ui/Icon';

interface HeyTabBarProps {
  currentTab: RouteKey;
  onSelectTab: (tab: RouteKey) => void;
  /** Đo chiều cao thực của thanh tab (để Toast nằm phía trên, không che thanh tab) */
  onLayoutHeight?: (height: number) => void;
}

interface TabDef {
  id: RouteKey;
  label: string;
  icon: IconName;
  iconActive: IconName;
  highlight?: boolean;
}

const TABS: TabDef[] = [
  { id: ROUTES.HOME, label: 'Trang chủ', icon: 'home-outline', iconActive: 'home' },
  { id: ROUTES.LIBRARY, label: 'Tủ truyện', icon: 'library-outline', iconActive: 'library' },
  { id: ROUTES.CREATE, label: 'Sáng tác', icon: 'sparkles-outline', iconActive: 'sparkles', highlight: true },
  { id: ROUTES.EQ, label: 'Tiến độ', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  { id: ROUTES.MORE, label: 'Hồ sơ', icon: 'person-circle-outline', iconActive: 'person-circle' },
];

/** Phần nút Sáng tác nhô lên trên mép thanh tab (px) — Toast cần chừa thêm khoảng này */
export const TAB_BAR_FAB_OVERHANG = 22;

const TabItem: React.FC<{ tab: TabDef; active: boolean; onPress: () => void }> = ({ tab, active, onPress }) => {
  const handlePress = () => {
    soundFX.playPop();
    onPress();
  };
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      aria-current={active ? 'page' : undefined}
      style={(state) => [styles.item, state.pressed && styles.pressed, focusRing(state)]}
    >
      <View style={[styles.pill, active && styles.pillActive]}>
        <Icon name={active ? tab.iconActive : tab.icon} size={24} color={active ? Colors.brandStrong : Colors.textMuted} />
      </View>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
};

const CreateButton: React.FC<{ tab: TabDef; active: boolean; onPress: () => void }> = ({ tab, active, onPress }) => {
  const handlePress = () => {
    soundFX.playSparkle();
    onPress();
  };
  // Cả nút tròn lẫn nhãn nằm trong cùng một vùng chạm (trước đây nhãn "Sáng tác" không nhận chạm)
  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected: active }}
      aria-current={active ? 'page' : undefined}
      style={(state) => [styles.item, styles.createItem, state.pressed && styles.pressed, focusRing(state)]}
    >
      <View style={[styles.fab, active && styles.fabActive]}>
        <Icon name={active ? tab.iconActive : tab.icon} size={28} color={Colors.onBrand} />
      </View>
      <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
        {tab.label}
      </Text>
    </Pressable>
  );
};

export const HeyTabBar: React.FC<HeyTabBarProps> = ({ currentTab, onSelectTab, onLayoutHeight }) => (
  <View
    style={styles.outer}
    onLayout={onLayoutHeight ? (e: LayoutChangeEvent) => onLayoutHeight(e.nativeEvent.layout.height) : undefined}
  >
    <View role="navigation" aria-label="Điều hướng chính" style={styles.bar}>
      {TABS.map((tab) =>
        tab.highlight ? (
          <CreateButton key={tab.id} tab={tab} active={currentTab === tab.id} onPress={() => onSelectTab(tab.id)} />
        ) : (
          <TabItem key={tab.id} tab={tab} active={currentTab === tab.id} onPress={() => onSelectTab(tab.id)} />
        )
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  // Padding để thanh nổi không chạm sát mép màn hình; trên màn rộng thì thu gọn và căn giữa
  outer: { paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    borderColor: Colors.outline,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 4,
    ...Elevation.mid,
  },
  item: {
    flex: 1,
    minHeight: Touch.min + 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderRadius: Radius.md,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  pill: {
    minWidth: 56,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: Colors.brandTint },
  label: { ...Typography.caption, fontSize: 12, lineHeight: 16 },
  // textMuted 6.3:1; brandInk trên nền kem/trắng > 12:1
  labelInactive: { color: Colors.textMuted },
  labelActive: { color: Colors.brandInk, fontFamily: FontFamily.extraBold },

  createItem: { marginTop: -TAB_BAR_FAB_OVERHANG },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brand,
    borderWidth: 3,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.high,
  },
  // Đang ở màn Sáng tác: viền đậm quanh nút (chữ/icon navy trên nền cam giữ 5.6:1; không đổi nền sang cam đậm)
  fabActive: { borderColor: Colors.brandStrong },
});
