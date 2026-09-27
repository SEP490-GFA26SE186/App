// apps/mobile/src/screens/SellerDashboard.tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyCard } from '../components/ui/HeyCard';
import { Story, UserAccount } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface SellerDashboardProps {
  currentUser: UserAccount;
  stories: Story[];
  onOpenStoryWizard: () => void;
  onOpenWallet: () => void;
  onSubmitForReview: (storyId: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  stories,
  onOpenStoryWizard,
  onOpenWallet,
  onSubmitForReview,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Seller Header Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerTag}>
          <Text style={styles.bannerTagText}>✨ Cổng Tác Giả Xuất Bản</Text>
        </View>
        <Text style={styles.bannerTitle}>Tác Giả: {currentUser.fullName}</Text>
        <Text style={styles.bannerSubtitle}>
          Phân chia doanh thu 70% Tác Giả / 30% Nền tảng • Bảo chứng an toàn 7 ngày
        </Text>
        <HeyButton
          title="💸 Ví & Rút Doanh Thu"
          variant="yellow"
          onPress={onOpenWallet}
          style={styles.walletBtn}
        />
      </View>

      {/* KPI Stats */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng truyện</Text>
          <Text style={styles.kpiValue}>{stories.length}</Text>
          <Text style={styles.kpiSub}>Đang phát hành</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Khả dụng (70%)</Text>
          <Text style={[styles.kpiValue, { color: Colors.teal }]}>
            {currentUser?.sellerAvailableBalance?.toLocaleString('vi-VN') || 0} đ
          </Text>
          <Text style={styles.kpiSub}>Sẵn sàng rút</Text>
        </View>
      </View>

      {/* Story Management */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Truyện của tôi</Text>
        <HeyButton
          title="➕ Tạo mới"
          size="sm"
          onPress={onOpenStoryWizard}
        />
      </View>

      {stories.map((s) => (
        <View key={s.id} style={styles.storyRow}>
          <Image
            source={{
              uri:
                s.coverImageUrl ||
                'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300',
            }}
            style={styles.storyThumb}
          />
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle} numberOfLines={1}>
              {s.title}
            </Text>
            <Text style={styles.storyMeta}>
              {s.theme} • {s.priceVnd?.toLocaleString('vi-VN')} đ
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{s.status}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  banner: {
    backgroundColor: Colors.secondary,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  bannerTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  bannerTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 16,
    marginBottom: 12,
  },
  walletBtn: {
    alignSelf: 'flex-start',
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  storyThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
  },
  storyMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginVertical: 2,
  },
  statusBadge: {
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.green,
  },
});
