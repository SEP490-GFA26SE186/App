// apps/mobile/src/navigation/ManagementShell.tsx
// Khung chung cho Admin và Chuyên gia sư phạm: header thương hiệu + nhãn vai trò, nội dung theo route, thanh tab 4 mục
// có badge số việc đang chờ (thay sidebar của Web). Dùng token R1 và kiểu thanh tab nổi như Parent nhưng không có nút Sáng tác.
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { Elevation } from '../theme/shadows';
import { Layout, Radius, Touch } from '../theme/spacing';
import { FontFamily, Typography } from '../theme/typography';
import { focusRing } from '../theme/focus';
import { MASCOT_IMAGE } from '../constants/mascot';
import { Icon } from '../components/ui/Icon';
import { useToastBottomInset } from '../components/ui/Toast';
import { SessionUser } from '../types/sessionUser';
import {
  MANAGEMENT_TABS,
  ManagementNavState,
  ManagementParams,
  ManagementRole,
  ManagementRoute,
  backManagement,
  homeRouteFor,
  navigateManagement,
} from './managementRoutes';

export const ROLE_TITLES: Record<ManagementRole, string> = { ADMIN: 'Quản trị', SPECIALIST: 'Chuyên gia sư phạm' };

export const useManagementNavigation = (role: ManagementRole) => {
  const [stack, setStack] = useState<ManagementNavState[]>([{ route: homeRouteFor(role) }]);
  const navigate = useCallback((route: ManagementRoute, params?: ManagementParams) => setStack((s) => navigateManagement(role, s, route, params)), [role]);
  const goBack = useCallback(() => setStack((s) => backManagement(role, s) ?? s), [role]);
  const handlesBack = backManagement(role, stack) !== null;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!handlesBack) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [handlesBack, goBack]);

  return { current: stack[stack.length - 1], rootTab: stack[0].route, navigate, goBack };
};

export type ManagementNavigation = ReturnType<typeof useManagementNavigation>;

interface ShellProps {
  role: ManagementRole;
  user: SessionUser;
  nav: ManagementNavigation;
  /** Số việc đang chờ hiển thị trên tab (từ BE; không có số thì không hiện) */
  badges?: Partial<Record<ManagementRoute, number>>;
  children: React.ReactNode;
}

const MAX_SCALE = 1.3;

export const ManagementShell: React.FC<ShellProps> = ({ role, user, nav, badges, children }) => {
  const [tabBarHeight, setTabBarHeight] = useState(0);
  useToastBottomInset(tabBarHeight);
  const tabs = MANAGEMENT_TABS[role];
  const name = (user.fullName || '').trim();
  const menuRoute = tabs[tabs.length - 1].route;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => nav.navigate(homeRouteFor(role))}
            accessibilityRole="button"
            accessibilityLabel={`StoryWeaver ${ROLE_TITLES[role]}, về ${tabs[0].label}`}
            style={(s) => [styles.logoBtn, s.pressed && styles.pressed, focusRing(s)]}
          >
            <Image source={MASCOT_IMAGE} style={styles.logo} accessibilityIgnoresInvertColors />
          </Pressable>
          <View style={styles.brand} accessibilityRole="header">
            <Text style={styles.brandTitle} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE}>
              StoryWeaver
            </Text>
            <Text style={styles.brandRole} numberOfLines={1} maxFontSizeMultiplier={MAX_SCALE}>
              {ROLE_TITLES[role]}
            </Text>
          </View>
          <Pressable
            onPress={() => nav.navigate(menuRoute)}
            accessibilityRole="button"
            accessibilityLabel={name ? `Tài khoản của ${name}` : 'Tài khoản'}
            style={(s) => [styles.avatar, s.pressed && styles.pressed, focusRing(s)]}
          >
            <Text style={styles.avatarText} maxFontSizeMultiplier={MAX_SCALE}>
              {(name || '?').charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.main}>{children}</View>

      <View style={styles.tabOuter} onLayout={(e: LayoutChangeEvent) => setTabBarHeight(e.nativeEvent.layout.height)}>
        <View role="navigation" aria-label={`Điều hướng ${ROLE_TITLES[role]}`} style={styles.tabBar}>
          {tabs.map((tab) => {
            const active = nav.rootTab === tab.route;
            const count = badges?.[tab.route];
            return (
              <Pressable
                key={tab.route}
                onPress={() => nav.navigate(tab.route)}
                accessibilityRole="button"
                accessibilityLabel={count ? `${tab.label}, ${count} việc đang chờ` : tab.label}
                accessibilityState={{ selected: active }}
                aria-current={active ? 'page' : undefined}
                style={(s) => [styles.tabItem, s.pressed && styles.pressed, focusRing(s)]}
              >
                <View style={[styles.tabPill, active && styles.tabPillActive]}>
                  <Icon name={active ? tab.iconActive : tab.icon} size={24} color={active ? Colors.brandStrong : Colors.textMuted} />
                  {!!count && (
                    <View style={styles.countDot}>
                      <Text style={styles.countText} maxFontSizeMultiplier={1.2}>
                        {count > 99 ? '99+' : count}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : styles.tabLabelInactive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const BTN = Touch.min;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.canvas },
  header: { backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.outline, paddingVertical: 8, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.7 },
  logoBtn: { width: BTN, height: BTN, borderRadius: BTN / 2 },
  logo: { width: BTN, height: BTN, borderRadius: BTN / 2 },
  brand: { flex: 1, minWidth: 0 },
  brandTitle: { ...Typography.heading, fontFamily: FontFamily.displayBold, fontSize: 17, lineHeight: 22, color: Colors.text },
  brandRole: { ...Typography.caption, color: Colors.tealDeep },
  avatar: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brandTint,
    borderWidth: 2,
    borderColor: Colors.outline,
  },
  avatarText: { fontFamily: FontFamily.displayBold, fontSize: 17, color: Colors.brandInk },
  main: { flex: 1, width: '100%', maxWidth: Layout.maxContentWidth, alignSelf: 'center' },
  tabOuter: { paddingHorizontal: 12, paddingBottom: 10, alignItems: 'center' },
  tabBar: {
    width: '100%',
    maxWidth: Layout.maxContentWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxxl,
    borderWidth: 1,
    borderColor: Colors.outline,
    paddingVertical: 6,
    paddingHorizontal: 4,
    ...Elevation.mid,
  },
  tabItem: { flex: 1, minHeight: Touch.min + 8, alignItems: 'center', justifyContent: 'flex-end', borderRadius: Radius.md, gap: 2 },
  tabPill: { minWidth: 56, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  tabPillActive: { backgroundColor: Colors.brandTint },
  countDot: {
    position: 'absolute',
    top: -4,
    right: 4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontFamily: FontFamily.extraBold, fontSize: 11, lineHeight: 14, color: Colors.onStrong },
  tabLabel: { ...Typography.caption, fontSize: 12, lineHeight: 16 },
  tabLabelInactive: { color: Colors.textMuted },
  tabLabelActive: { color: Colors.brandInk, fontFamily: FontFamily.extraBold },
});
