// apps/mobile/src/components/kid/KidCheckpointCard.tsx
// Điểm dừng EQ trong lúc bé đọc (5 kiểu theo BE). Component thuần hiển thị: BE chấm đúng/sai, trả gợi ý và đáp án.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../theme/colors';
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
      <Text style={styles.question}>{checkpoint.question || 'Bé nghĩ sao nhỉ? 🌟'}</Text>

      {!!result && !done && !!result.hint && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 {result.hint}</Text>
          <Text style={styles.hintSub}>Bé chọn lại một lần nữa nhé!</Text>
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
          <TouchableOpacity style={styles.primary} onPress={onContinue} activeOpacity={0.85}>
            <Text style={styles.primaryText}>Tiếp tục ➜</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {isEmotion && (
            <View style={styles.emotionRow}>
              {KID_EMOTIONS.map((e) => (
                <TouchableOpacity
                  key={e.value}
                  disabled={submitting}
                  style={[styles.emotionBtn, submitting && styles.disabled]}
                  activeOpacity={0.85}
                  onPress={() => onChoose({ emotion: e.value })}
                >
                  <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                  <Text style={styles.emotionLabel}>{e.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!isEmotion && !isReflection &&
            checkpoint.options.map((o, i) => (
              <TouchableOpacity
                key={o.id}
                disabled={submitting}
                style={[styles.option, i % 2 === 0 ? styles.optionA : styles.optionB, submitting && styles.disabled]}
                activeOpacity={0.85}
                onPress={() => onChoose({ optionId: o.id })}
              >
                <Text style={styles.optionText}>{o.text}</Text>
              </TouchableOpacity>
            ))}

          {isReflection && (
            <TouchableOpacity
              disabled={submitting}
              style={[styles.primary, submitting && styles.disabled]}
              activeOpacity={0.85}
              onPress={() => onChoose({})}
            >
              <Text style={styles.primaryText}>Bé đã nghĩ xong rồi ✔</Text>
            </TouchableOpacity>
          )}

          {!isReflection && !result && (
            <TouchableOpacity disabled={submitting} style={styles.skip} onPress={onSkip}>
              <Text style={styles.skipText}>Bỏ qua câu này</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {submitting && <ActivityIndicator style={styles.spinner} color={Colors.primary} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, marginBottom: 14 },
  question: { fontSize: 18, fontWeight: '800', lineHeight: 26, color: Colors.textPrimary, textAlign: 'center', marginBottom: 14 },
  hintBox: { backgroundColor: '#FFF9E0', borderRadius: 16, padding: 12, marginBottom: 12 },
  hintText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  hintSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  emotionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  emotionBtn: { alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 12, minWidth: 84 },
  emotionEmoji: { fontSize: 34 },
  emotionLabel: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  option: { borderRadius: 18, padding: 14, marginBottom: 10 },
  optionA: { backgroundColor: Colors.lavenderLight },
  optionB: { backgroundColor: Colors.mintLight },
  optionText: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', lineHeight: 21 },
  disabled: { opacity: 0.5 },
  primary: { backgroundColor: Colors.secondary, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  primaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  skip: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 },
  skipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  outcome: { alignItems: 'stretch' },
  outcomeText: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  feedback: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 8 },
  spinner: { marginTop: 8 },
  error: { marginTop: 10, color: '#B91C1C', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
