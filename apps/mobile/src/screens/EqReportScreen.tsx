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
import { HeyProgressBar } from '../components/ui/HeyProgressBar';
import { ChildProfile, EqReport } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';

interface EqReportScreenProps {
  childrenProfiles: ChildProfile[];
}

export const EqReportScreen: React.FC<EqReportScreenProps> = ({
  childrenProfiles,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(
    childrenProfiles[0]?.id || 'ch_01'
  );

  const currentChild =
    childrenProfiles.find((c) => c.id === selectedChildId) ||
    childrenProfiles[0] || { name: 'Bé Bo', age: 4 };

  const eqScores = [
    { label: 'Thấu cảm & Yêu thương (Empathy)', score: 85, color: Colors.primary },
    { label: 'Tự lập & Trách nhiệm (Independence)', score: 78, color: Colors.secondary },
    { label: 'Kiên nhẫn & Cảm xúc (Patience)', score: 90, color: Colors.teal },
    { label: 'Sáng tạo & Tư duy (Creativity)', score: 82, color: Colors.yellow },
    { label: 'Giao tiếp & Ứng xử (Communication)', score: 88, color: Colors.green },
  ];

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
          Dựa trên 14 lựa chọn tương tác rẽ nhánh và thói quen đọc truyện của {currentChild.name}.
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

      {/* EQ Radar Score Bars */}
      <Text style={styles.sectionTitle}>Chỉ số 5 trụ cột EQ của {currentChild.name}</Text>

      {eqScores.map((item, idx) => (
        <View key={idx} style={styles.scoreRow}>
          <View style={styles.scoreHeader}>
            <Text style={styles.scoreLabel}>{item.label}</Text>
            <Text style={[styles.scoreValue, { color: item.color }]}>
              {item.score}/100
            </Text>
          </View>
          <HeyProgressBar progress={item.score} color={item.color} height={10} />
        </View>
      ))}

      {/* Pedagogical Insights */}
      <Text style={[styles.sectionTitle, styles.mt]}>Lời khuyên chuyên gia sư phạm</Text>

      <HeyCard variant="yellow" style={styles.insightCard}>
        <Text style={styles.insightHeader}>🌟 Điểm mạnh nổi bật:</Text>
        <Text style={styles.insightText}>
          Bé có chỉ số Kiên nhẫn & Thấu cảm rất cao (90/100). Trong các tình huống truyện gặp bạn bè khó khăn, bé luôn chọn chia sẻ đồ chơi và lắng nghe trước khi phản ứng.
        </Text>
      </HeyCard>

      <HeyCard variant="purple" style={styles.insightCard}>
        <Text style={styles.insightHeader}>💡 Gợi ý cho ba mẹ:</Text>
        <Text style={styles.insightText}>
          Ba mẹ có thể tạo thêm các câu chuyện chủ đề "Tự lập dọn dẹp phòng ngủ" hoặc "Dũng cảm nói lời xin lỗi" để giúp bé củng cố khả năng tự lập khi ở trường mẫu giáo.
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
