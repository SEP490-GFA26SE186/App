// apps/mobile/src/screens/EqReportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { HeyCard } from '../components/ui/HeyCard';
import { HeyChip } from '../components/ui/HeyChip';
import { ChildProfile } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface EqReportScreenProps {
  childrenProfiles: ChildProfile[];
}

export const EqReportScreen: React.FC<EqReportScreenProps> = ({
  childrenProfiles,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenProfiles[0]?.id ?? ''
  );

  const currentChild =
    childrenProfiles.find((c) => c.id === selectedChildId) || childrenProfiles[0];

  // Báo cáo EQ thật (GET /children/:id/overview, /eq-report) chưa được nối: T4.3.
  // Không hiển thị điểm EQ, số sách/phút hay lời khuyên dựng sẵn như thể là phân tích thật.
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerTag}>📊 Phân Tích Tâm Lý & EQ</Text>
        <Text style={styles.bannerTitle}>Báo Cáo Tiến Bộ Của Bé</Text>
        <Text style={styles.bannerSubtitle}>
          {currentChild
            ? `Báo cáo EQ của ${currentChild.name} sẽ hiển thị tại đây khi kết nối với máy chủ.`
            : 'Thêm hồ sơ bé để xem báo cáo EQ.'}
        </Text>
      </View>

      {/* Child Switcher */}
      <View style={styles.chipsRow}>
        {childrenProfiles.map((ch) => (
          <HeyChip
            key={ch.id}
            label={`👶 ${ch.name}`}
            selected={selectedChildId === ch.id}
            onPress={() => setSelectedChildId(ch.id)}
          />
        ))}
      </View>

      <HeyCard variant="yellow" style={styles.insightCard}>
        <Text style={styles.insightHeader}>
          {currentChild ? 'Báo cáo EQ chưa được kết nối' : 'Chưa có hồ sơ bé'}
        </Text>
        <Text style={styles.insightText}>
          {currentChild
            ? 'Chỉ số EQ và lời khuyên sẽ được lấy từ dữ liệu đọc truyện thật của bé. Hiện chưa có số liệu nào để hiển thị.'
            : 'Chưa có dữ liệu để phân tích.'}
        </Text>
      </HeyCard>
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
    backgroundColor: Colors.teal,
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  bannerTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
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
    opacity: 0.95,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
    marginBottom: 12,
  },
  scoreRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textDark,
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  insightCard: {
    marginBottom: 12,
  },
  insightHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textDark,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: Colors.textDark,
    lineHeight: 18,
    opacity: 0.9,
  },
  mt: {
    marginTop: 14,
  },
});
