// apps/mobile/src/components/kid/KidCheckpointCard.tsx
// Điểm dừng EQ trong lúc bé đọc (5 kiểu theo BE). Component thuần hiển thị: BE chấm đúng/sai, trả gợi ý và đáp án.
// R4: nút cảm xúc/đáp án lớn (>= 56pt, có nhãn trợ năng), "Bỏ qua" là nút thật rõ ràng, màu theo token.
import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { HeyButton } from '../ui/HeyButton';
import { Icon } from '../ui/Icon';
import { KID_EMOTIONS, emotionLabel } from '../../constants/kid';
import type { KidAnswerResultDto, KidCheckpointDto } from '../../types/api';

interface Props {
  checkpoint: KidCheckpointDto;
  result: KidAnswerResultDto | null;
  submitting: boolean;
  error: string | null;
  onChoose: (choice: { emotion?: string; optionId?: string }) => void;
  onSkip: () => void;
  onContinue: () => void;
}

export const KidCheckpointCard: React.FC<Props> = ({ checkpoint, result, submitting, error, onChoose, onSkip, onContinue }) => {
  const isEmotion = checkpoint.type === 'emotion_self' || checkpoint.type === 'emotion_other';
  const isReflection = checkpoint.type === 'reflection';
  const done = !!result?.done;
  const revealedOption = result?.answer?.optionId
    ? checkpoint.options.find((o) => o.id === result.answer?.optionId)?.text
    : undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.question} accessibilityRole="header">
        {checkpoint.question || 'Bé nghĩ sao nhỉ? 🌟'}
      </Text>

      {!!result && !done && !!result.hint && (
        <View style={styles.hintBox} accessibilityLiveRegion="polite">
          <Icon name="bulb" size={22} color={Colors.brandStrong} />
          <View style={styles.hintTexts}>
            <Text style={styles.hintText}>{result.hint}</Text>
            <Text style={styles.hintSub}>Bé chọn lại một lần nữa nhé!</Text>
          </View>
        </View>
      )}

      {done ? (
        <View style={styles.outcome}>
          {result?.skipped ? (
            <Text style={styles.outcomeText}>Không sao đâu, mình đọc tiếp nhé 🌈</Text>
          ) : isReflection ? (
            <Text style={styles.outcomeText}>Cảm ơn bé đã chia sẻ 💛</Text>
          ) : result?.correct === true ? (
            <Text style={styles.outcomeText}>Giỏi quá! 🎉</Text>
          ) : result?.correct === false ? (
            <Text style={styles.outcomeText}>
              Cùng xem đáp án nhé: {result.answer?.emotion ? emotionLabel(result.answer.emotion) : revealedOption || ''}
            </Text>
          ) : (
            <Text style={styles.outcomeText}>Bé đã trả lời xong 💛</Text>
          )}
          {!!result?.feedback && <Text style={styles.feedback}>{result.feedback}</Text>}
          <HeyButton title="Tiếp tục" iconName="arrow-forward" variant="kid" size="xl" onPress={onContinue} />
        </View>
      ) : (
        <View style={styles.choices}>
          {isEmotion && (
            <View style={styles.emotionRow}>
              {KID_EMOTIONS.map((e) => (
                <Pressable
                  key={e.value}
                  disabled={submitting}
                  onPress={() => onChoose({ emotion: e.value })}
                  accessibilityRole="button"
                  accessibilityLabel={`Cảm xúc ${e.label}`}
                  accessibilityState={{ disabled: submitting }}
                  style={(s) => [styles.emotionBtn, submitting && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
                >
                  <Text style={styles.emotionEmoji} accessibilityElementsHidden importantForAccessibility="no">
                    {e.emoji}
                  </Text>
                  <Text style={styles.emotionLabel}>{e.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {!isEmotion &&
            !isReflection &&
            checkpoint.options.map((o, i) => (
              <Pressable
                key={o.id}
                disabled={submitting}
                onPress={() => onChoose({ optionId: o.id })}
                accessibilityRole="button"
                accessibilityState={{ disabled: submitting }}
                style={(s) => [styles.option, i % 2 === 0 ? styles.optionA : styles.optionB, submitting && styles.disabled, s.pressed && styles.pressed, focusRing(s)]}
              >
                <Text style={styles.optionText}>{o.text}</Text>
              </Pressable>
            ))}

          {isReflection && (
            <HeyButton title="Bé đã nghĩ xong rồi" iconName="checkmark-circle" variant="kid" size="xl" disabled={submitting} onPress={() => onChoose({})} />
          )}

          {!isReflection && !result && (
            <Pressable
              disabled={submitting}
              onPress={onSkip}
              accessibilityRole="button"
              accessibilityLabel="Bỏ qua câu này"
              style={(s) => [styles.skip, s.pressed && styles.pressed, focusRing(s)]}
            >
              <Text style={styles.skipText}>Bỏ qua câu này</Text>
            </Pressable>
          )}
        </View>
      )}

      {submitting && <ActivityIndicator style={styles.spinner} color={Colors.brandStrong} accessibilityLabel="Đang gửi" />}
      {!!error && (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xxl, borderWidth: 1.5, borderColor: Colors.borderSunshine, padding: Spacing.xl, gap: Spacing.md },
  question: { ...Typography.kidHeading, color: Colors.text, textAlign: 'center' },
  hintBox: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', backgroundColor: Colors.brandTint, borderRadius: Radius.lg, padding: Spacing.md },
  hintTexts: { flex: 1, gap: 2 },
  hintText: { ...Typography.bodyStrong, color: Colors.text },
  hintSub: { ...Typography.caption, color: Colors.textMuted },
  choices: { gap: Spacing.sm },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm },
  emotionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 92,
    minHeight: 88,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    backgroundColor: Colors.tealTint,
    borderWidth: 1.5,
    borderColor: Colors.outline,
  },
  emotionEmoji: { fontSize: 36, lineHeight: 44 },
  emotionLabel: { fontFamily: FontFamily.extraBold, fontSize: 15, color: Colors.text, marginTop: 2 },
  option: { minHeight: Touch.kid, justifyContent: 'center', borderRadius: Radius.xl, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderWidth: 1.5, borderColor: Colors.outline },
  optionA: { backgroundColor: Colors.lavenderLight },
  optionB: { backgroundColor: Colors.tealTint },
  optionText: { ...Typography.kidBody, fontSize: 17, lineHeight: 24, color: Colors.text, textAlign: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { transform: [{ scale: 0.97 }] },
  // Nút thật, rõ ràng (trước: chữ xám 12px): viền + chữ navy, cao >= 56pt
  skip: { alignSelf: 'center', minHeight: Touch.kid, justifyContent: 'center', paddingHorizontal: Spacing.xl, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.outlineStrong, marginTop: Spacing.xs },
  skipText: { fontFamily: FontFamily.extraBold, fontSize: 16, color: Colors.text },
  outcome: { gap: Spacing.sm },
  outcomeText: { ...Typography.kidHeading, color: Colors.text, textAlign: 'center' },
  feedback: { ...Typography.body, color: Colors.textMuted, textAlign: 'center' },
  spinner: { marginTop: Spacing.sm },
  error: { ...Typography.label, color: Colors.danger, textAlign: 'center' },
});
