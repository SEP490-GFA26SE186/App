// apps/mobile/src/screens/parent/StoryWizard.tsx
// B5 – Xưởng truyện: tạo truyện theo 3 lối vào (Web: CreateStoryPage). R6: stepper 3 bước có thanh tiến độ, nút hành động cố định ở đáy:
// 1) Cách tạo (lối vào + nội dung)  2) Nhân vật (đúng 1 nhân vật chính)  3) Độ dài + tên truyện (+ "Bé sẽ tập gì?" với lối nhà mình).
// C8: nối BE thật. Lối "Chuyện mẫu": POST /stories → POST /generate → poll /generation.
// Lối "Kể chuyện nhà mình": POST /stories/analyze → xác nhận → POST /stories (analysisToken) → generate → poll.
// Lối "Tự viết": trình soạn trang/điểm dừng chưa có trên Mobile → "Chưa hỗ trợ", không gọi API.
// Credit do BE giữ/hoàn; Mobile chỉ hiển thị giá (GET /stories/ai-pricing) và số dư (GET /auth/me). R6 chỉ đổi phần hiển thị:
// toàn bộ state, quy tắc kiểm tra (`missing`), thứ tự nhân vật, gọi API và xử lý lỗi giữ nguyên như trước.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, KeyboardAvoidingView, Platform, BackHandler, StyleSheet } from 'react-native';
import { PedagogicalTemplate } from '../../types/domain';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyInput } from '../../components/ui/HeyInput';
import { HeyProgressBar } from '../../components/ui/HeyProgressBar';
import { Badge } from '../../components/ui/Badge';
import { Icon } from '../../components/ui/Icon';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CharacterFormSheet } from '../../components/parent/CharacterFormSheet';
import { GenerationRunner } from '../../components/parent/GenerationRunner';
import { storyService } from '../../services';
import type { AiPricingDto, AnalyzeStoryResultDto } from '../../types/api';
import { Colors } from '../../theme/colors';
import { Radius, Spacing, Touch } from '../../theme/spacing';
import { FontFamily, Typography } from '../../theme/typography';
import { focusRing } from '../../theme/focus';
import { CharacterView, StoryView } from '../../types/viewModels';
import {
  AI_LENGTHS,
  SITUATION_MAX,
  SITUATION_MIN,
  STORY_ENTRIES,
  StoryEntry,
  StoryLength,
} from '../../constants/story';

interface StoryWizardProps {
  characters: CharacterView[];
  templates: PedagogicalTemplate[];
  /** Số dư credit từ BE (null = chưa biết) */
  creditBalance: number | null;
  onCharacterCreated: (character: CharacterView) => void;
  /** BE đã tạo truyện (bản nháp) */
  onStoryCreated: (story: StoryView) => void;
  /** AI viết xong: mở truyện */
  onOpenStory: (storyId: string) => void;
  /** Số dư credit có thể đã đổi (giữ/hoàn) */
  onCreditsChanged: () => void;
  onCancel: () => void;
}

const STEPS = ['Cách tạo', 'Nhân vật', 'Hoàn tất'] as const;

/** Một lựa chọn trong nhóm chọn-một: có icon radio (không chỉ dựa vào màu), cả hàng là nút ≥ 44pt. */
const Choice: React.FC<{
  selected: boolean;
  onPress: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ selected, onPress, label, children }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ checked: selected }}
    aria-checked={selected}
    accessibilityLabel={label}
    style={(s) => [styles.choice, selected && styles.choiceSelected, s.pressed && styles.pressed, focusRing(s)]}
  >
    <Icon name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? Colors.brandStrong : Colors.textMuted} />
    <View style={styles.choiceBody}>{children}</View>
  </Pressable>
);

export const StoryWizard: React.FC<StoryWizardProps> = ({
  characters,
  templates,
  creditBalance,
  onCharacterCreated,
  onStoryCreated,
  onOpenStory,
  onCreditsChanged,
  onCancel,
}) => {
  const [step, setStep] = useState(0);
  const [entry, setEntry] = useState<StoryEntry | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [situation, setSituation] = useState('');
  const [selected, setSelected] = useState<string[]>([]); // characterId theo thứ tự chọn
  const [mainId, setMainId] = useState<string | null>(null);
  const [length, setLength] = useState<StoryLength>('medium');
  const [title, setTitle] = useState('');
  const [useTts, setUseTts] = useState(true);
  const [charSheet, setCharSheet] = useState(false);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState<AiPricingDto | null>(null);
  const [pricingError, setPricingError] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeStoryResultDto | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  // Truyện đã tạo ở BE đang được AI viết (hoặc chờ thử lại)
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    storyService
      .getAiPricing()
      .then((p) => alive && setPricing(p))
      .catch(() => alive && setPricingError(true));
    return () => {
      alive = false;
    };
  }, []);

  // Android Back ở bước 2–3 quay về bước trước (giữ dữ liệu đã nhập); bước 1 / đang viết truyện để điều hướng chung xử lý như cũ
  useEffect(() => {
    if (step === 0 || generating) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setError('');
      setStep((s) => Math.max(0, s - 1));
      return true;
    });
    return () => sub.remove();
  }, [step, generating]);

  const isAi = entry === 'family' || entry === 'topic';

  const toggleCharacter = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    setAnalysis(null);
    // Nhân vật chính bị bỏ chọn (hoặc chưa có) → lấy nhân vật đầu tiên còn lại
    if (!next.includes(mainId ?? '')) setMainId(next[0] ?? null);
  };

  const situationLength = situation.trim().length;
  const costOf = (l: StoryLength) => (isAi ? pricing?.lengths.find((p) => p.length === l)?.credits : undefined);
  const cost = costOf(length);
  const notEnough = cost != null && creditBalance != null && creditBalance < cost;
  // Cùng quy tắc với Web (`missing`)
  const missing = useMemo(() => {
    if (!entry) return 'Ba mẹ chọn một lối vào nhé';
    if (entry === 'topic' && !templates.some((t) => t.id === topicId)) return 'Ba mẹ chọn một chuyện mẫu nhé';
    if (entry === 'family' && situationLength < SITUATION_MIN)
      return `Ba mẹ kể chuyện dài thêm một chút nhé (ít nhất ${SITUATION_MIN} ký tự)`;
    if (entry === 'family' && situationLength > SITUATION_MAX) return `Lời kể tối đa ${SITUATION_MAX} ký tự`;
    if (selected.length === 0) return 'Ba mẹ chọn ít nhất một nhân vật nhé';
    if (!title.trim()) return 'Ba mẹ đặt tên cho truyện nhé';
    if (title.trim().length > 200) return 'Tên truyện tối đa 200 ký tự';
    if (notEnough) return `Truyện này cần ${cost} credit, ba mẹ còn ${creditBalance} credit`;
    return '';
  }, [entry, topicId, templates, situationLength, selected, title, notEnough, cost, creditBalance]);

  // Điều kiện để sang bước kế tiếp: đúng các câu `missing` của những mục thuộc bước đó (bước 3 dùng `missing` đầy đủ khi gửi)
  const stepMissing = (s: number): string => {
    if (s === 0) {
      if (!entry) return 'Ba mẹ chọn một lối vào nhé';
      if (entry === 'topic' && !templates.some((t) => t.id === topicId)) return 'Ba mẹ chọn một chuyện mẫu nhé';
      if (entry === 'family' && situationLength < SITUATION_MIN)
        return `Ba mẹ kể chuyện dài thêm một chút nhé (ít nhất ${SITUATION_MIN} ký tự)`;
      if (entry === 'family' && situationLength > SITUATION_MAX) return `Lời kể tối đa ${SITUATION_MAX} ký tự`;
    }
    if (s === 1 && selected.length === 0) return 'Ba mẹ chọn ít nhất một nhân vật nhé';
    return '';
  };

  const goNext = () => {
    const m = stepMissing(step);
    if (m) {
      setError(m);
      return;
    }
    setError('');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => {
    setError('');
    if (step === 0) onCancel();
    else setStep((s) => s - 1);
  };

  // Nhân vật chính đứng đầu (→ token {NV1}); analyze và tạo truyện phải gửi cùng thứ tự
  const orderedCharacters = () =>
    [mainId as string, ...selected.filter((id) => id !== mainId)].map((characterId) => ({ characterId, isMain: characterId === mainId }));

  const familyMessage = (err: any): string => {
    if (err?.status === 429) return err.message || 'Hôm nay ba mẹ đã phân tích nhiều lần rồi, mai thử lại nhé';
    if (err?.status >= 500) return 'Chưa phân tích được, ba mẹ thử lại nhé';
    return err?.errors?.[0]?.message || err?.message || 'Có lỗi xảy ra, ba mẹ thử lại nhé';
  };

  // Chạy một thao tác ghi: chặn bấm đúp, hiện lỗi BE nguyên văn
  const run = async (task: () => Promise<void>, onError: (e: any) => string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (e: any) {
      setError(onError(e));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const createAndGenerate = (payload: Parameters<typeof storyService.createStory>[0]) =>
    run(async () => {
      const story = await storyService.createStory(payload);
      onStoryCreated(story);
      setGenerating(story.id);
    }, (e) => e?.errors?.[0]?.message || e?.message || 'Chưa tạo được truyện.');

  const submit = () => {
    if (missing) {
      setError(missing);
      return;
    }
    if (entry === 'topic') {
      void createAndGenerate({
        entry: 'topic',
        topicId: topicId as string,
        length,
        title: title.trim(),
        characters: orderedCharacters(),
        useTts,
      });
    } else if (entry === 'family') {
      void run(async () => {
        setAnalysis(
          await storyService.analyze({ situation: situation.trim(), characters: orderedCharacters(), length })
        );
      }, familyMessage);
    }
  };

  const createFamily = () => {
    if (!analysis) return;
    if (analysis.expiresAt && new Date(analysis.expiresAt) <= new Date()) {
      setAnalysis(null);
      setError('Bản phân tích đã hết hạn, ba mẹ bấm “Xem bé sẽ tập gì” lại nhé');
      return;
    }
    void createAndGenerate({
      entry: 'family',
      length,
      title: title.trim(),
      characters: orderedCharacters(),
      useTts,
      situation: situation.trim(),
      analysisToken: analysis.analysisToken,
      scored: true,
    });
  };

  if (generating) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="AI đang viết truyện" subtitle={title.trim() || undefined} onBack={onCancel} />
        <GenerationRunner
          storyId={generating}
          start
          onSucceeded={() => onOpenStory(generating)}
          onCreditsChanged={onCreditsChanged}
          onBack={onCancel}
        />
        <Text style={styles.hint}>Truyện đã được lưu ở “Tủ truyện”. Ba mẹ có thể thoát, AI vẫn tiếp tục viết.</Text>
      </ScrollView>
    );
  }

  const last = step === STEPS.length - 1;
  const costText = cost == null ? '' : cost === 0 ? ' · miễn phí' : ` · ${cost} credit`;
  const familyConfirm = entry === 'family' && !!analysis;

  // Nút chính của chân trang (đổi theo bước)
  let primary: { title: string; icon: 'arrow-forward' | 'search' | 'sparkles'; onPress: () => void; disabled?: boolean };
  if (!last) primary = { title: 'Tiếp tục', icon: 'arrow-forward', onPress: goNext };
  else if (entry === 'handwritten') primary = { title: 'Tạo truyện tự viết (chưa hỗ trợ)', icon: 'sparkles', onPress: () => {}, disabled: true };
  else if (familyConfirm) primary = { title: `Tạo truyện${costText}`, icon: 'sparkles', onPress: createFamily };
  else if (entry === 'family') primary = { title: 'Xem bé sẽ tập gì', icon: 'search', onPress: submit };
  else primary = { title: `Tạo truyện${costText}`, icon: 'sparkles', onPress: submit };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Sáng tác truyện" onBack={goBack} />

        {/* Tiến độ: thanh + tên các bước (bước đã qua có dấu ✓, bước hiện tại được đọc là "Bước n/3") */}
        <View
          style={styles.progress}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Bước ${step + 1} trên ${STEPS.length}: ${STEPS[step]}`}
          accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}
        >
          <HeyProgressBar progress={((step + 1) / STEPS.length) * 100} color={Colors.brandStrong} height={8} />
          <View style={styles.stepRow}>
            {STEPS.map((name, i) => (
              <View key={name} style={styles.stepItem}>
                <View style={[styles.stepDot, i <= step && styles.stepDotOn]}>
                  {i < step ? <Icon name="checkmark" size={14} color={Colors.onStrong} /> : <Text style={[styles.stepNum, i <= step && styles.stepNumOn]}>{i + 1}</Text>}
                </View>
                <Text style={[styles.stepName, i === step && styles.stepNameOn]} numberOfLines={1}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {step === 0 && (
          <>
            <Text style={styles.stepTitle} accessibilityRole="header">
              Ba mẹ muốn tạo truyện thế nào?
            </Text>
            <View accessibilityRole="radiogroup" style={styles.list}>
              {STORY_ENTRIES.map((e) => (
                <Choice key={e.value} selected={entry === e.value} label={`${e.title}. ${e.text}`} onPress={() => { setEntry(e.value); setError(''); }}>
                  <Text style={styles.choiceTitle}>
                    {e.icon} {e.title}
                  </Text>
                  <Text style={styles.choiceDesc}>{e.text}</Text>
                  <Badge label={e.note} tone="neutral" />
                </Choice>
              ))}
            </View>

            {entry === 'family' && (
              <HeyCard style={styles.block}>
                <Text style={styles.blockTitle}>Kể chuyện nhà mình</Text>
                <Text style={styles.hint}>Kể điều bé vừa gặp; AI tìm khoảnh khắc khó để bé tập lại.</Text>
                <HeyInput
                  placeholder="Hôm nay ở trường, bé bị bạn giành mất đồ chơi và đã khóc…"
                  value={situation}
                  onChangeText={(t) => { setSituation(t); setAnalysis(null); setError(''); }}
                  multiline
                  numberOfLines={5}
                  hint={`${situationLength}/${SITUATION_MAX} ký tự (tối thiểu ${SITUATION_MIN})`}
                />
              </HeyCard>
            )}

            {entry === 'topic' && (
              <HeyCard style={styles.block}>
                <Text style={styles.blockTitle}>Chọn chuyện mẫu</Text>
                <Text style={styles.hint}>Mỗi chuyện giúp bé tập một năng lực cảm xúc (CASEL).</Text>
                {templates.length === 0 ? (
                  <StateView variant="empty" title="Chưa có chuyện mẫu" description="Danh sách chuyện mẫu chưa tải được hoặc đang trống." />
                ) : (
                  <View accessibilityRole="radiogroup" style={styles.list}>
                    {templates.map((t) => (
                      <Choice key={t.id} selected={topicId === t.id} label={`${t.title}. ${t.description}`} onPress={() => { setTopicId(t.id); setError(''); }}>
                        <Text style={styles.choiceTitle}>{t.title}</Text>
                        <Text style={styles.choiceDesc} numberOfLines={2}>
                          {t.description}
                        </Text>
                        <Badge label={String(t.category)} tone="info" />
                      </Choice>
                    ))}
                  </View>
                )}
              </HeyCard>
            )}

            {entry === 'handwritten' && (
              <HeyCard style={styles.block}>
                <StateView
                  variant="unsupported"
                  title="Trình soạn truyện tự viết chưa được hỗ trợ"
                  description="Ba mẹ vẫn có thể chọn nhân vật và đặt tên để chuẩn bị; việc viết từng trang sẽ có khi kết nối máy chủ."
                />
              </HeyCard>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.stepTitle} accessibilityRole="header">
              Ai xuất hiện trong truyện?
            </Text>
            <Text style={styles.hint}>Chọn nhân vật, chạm ngôi sao để đặt nhân vật chính (đúng 1).</Text>
            {characters.length === 0 ? (
              <StateView variant="empty" title="Chưa có nhân vật" description="Thêm người thân để đưa vào truyện." />
            ) : (
              <View style={styles.list}>
                {characters.map((c) => {
                  const on = selected.includes(c.id);
                  const isMain = mainId === c.id;
                  return (
                    <View key={c.id} style={[styles.charRow, on && styles.choiceSelected]}>
                      <Pressable
                        onPress={() => toggleCharacter(c.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                        aria-checked={on}
                        accessibilityLabel={`${c.name}. ${c.appearanceDescription}`}
                        style={(s) => [styles.charMain, s.pressed && styles.pressed, focusRing(s)]}
                      >
                        <Icon name={on ? 'checkbox' : 'square-outline'} size={24} color={on ? Colors.brandStrong : Colors.textMuted} />
                        <View style={styles.choiceBody}>
                          <Text style={styles.choiceTitle}>{c.name}</Text>
                          <Text style={styles.choiceDesc} numberOfLines={1}>
                            {c.appearanceDescription}
                          </Text>
                        </View>
                      </Pressable>
                      {on && (
                        <Pressable
                          onPress={() => setMainId(c.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: isMain }}
                          aria-checked={isMain}
                          accessibilityLabel={isMain ? `${c.name} là nhân vật chính` : `Đặt ${c.name} làm nhân vật chính`}
                          style={(s) => [styles.star, s.pressed && styles.pressed, focusRing(s)]}
                        >
                          <Icon name={isMain ? 'star' : 'star-outline'} size={24} color={isMain ? Colors.brandStrong : Colors.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
            <HeyButton title="Thêm nhân vật" iconName="add" variant="tertiary" size="sm" onPress={() => setCharSheet(true)} style={styles.addChar} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.stepTitle} accessibilityRole="header">
              {isAi ? 'Độ dài và tên truyện' : 'Tên truyện'}
            </Text>
            {isAi && (
              <>
                {/* Segmented: mỗi lựa chọn kèm số trang và giá credit THẬT từ BE (không có giá thì không ghi số) */}
                <View accessibilityRole="radiogroup" style={styles.segment}>
                  {AI_LENGTHS.map((l) => {
                    const on = length === l.value;
                    const c = costOf(l.value);
                    return (
                      <Pressable
                        key={l.value}
                        onPress={() => { setLength(l.value); setAnalysis(null); }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        aria-checked={on}
                        accessibilityLabel={`${l.label}, ${l.pages} trang${c != null ? (c === 0 ? ', miễn phí' : `, ${c} credit`) : ''}`}
                        style={(s) => [styles.segItem, on && styles.segItemOn, s.pressed && styles.pressed, focusRing(s)]}
                      >
                        <Text style={[styles.segLabel, on && styles.segLabelOn]}>{l.label}</Text>
                        <Text style={[styles.segSub, on && styles.segSubOn]}>{l.pages} trang</Text>
                        {c != null && <Text style={[styles.segSub, on && styles.segSubOn]}>{c === 0 ? 'Miễn phí' : `${c} credit`}</Text>}
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.hint}>
                  {pricingError
                    ? 'Chưa tải được bảng giá credit; máy chủ vẫn kiểm tra credit khi viết.'
                    : cost == null
                      ? 'Đang tải giá...'
                      : cost === 0
                        ? 'Lần viết này miễn phí.'
                        : `AI viết truyện này dùng ${cost} credit${creditBalance != null ? ` (ba mẹ đang có ${creditBalance})` : ''}. Nếu AI viết lỗi, credit được hoàn lại.`}
                </Text>
              </>
            )}
            <HeyInput
              label="Tên truyện *"
              placeholder="Đặt tên cho truyện"
              value={title}
              onChangeText={(t) => { setTitle(t); setError(''); }}
            />
            {isAi && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Có giọng đọc kể truyện</Text>
                <Switch
                  value={useTts}
                  onValueChange={setUseTts}
                  accessibilityLabel="Có giọng đọc kể truyện"
                  trackColor={{ true: Colors.tealStrong, false: Colors.outline }}
                  thumbColor={Colors.surface}
                />
              </View>
            )}

            {familyConfirm && analysis && (
              <HeyCard variant="brand" style={styles.block}>
                <Text style={styles.blockTitle}>Bé sẽ tập gì?</Text>
                <Text style={styles.choiceDesc}>{analysis.momentSummary}</Text>
                {analysis.subSkills.length > 0 && (
                  <View style={styles.badges}>
                    {analysis.subSkills.map((k) => (
                      <Badge key={k.id} label={k.nameVi} tone="info" />
                    ))}
                  </View>
                )}
              </HeyCard>
            )}
          </>
        )}

        {!!error && (
          <View style={styles.errorBox} accessibilityRole="alert">
            <Icon name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Chân trang cố định: số dư + (Quay lại) + hành động chính. Chi phí nằm ngay trên nút (số từ BE). */}
      <View style={styles.footer}>
        {last && isAi && creditBalance != null && <Text style={styles.balance}>Số dư hiện tại: {creditBalance} credit</Text>}
        <View style={styles.footerRow}>
          {step > 0 && (
            <Pressable
              onPress={goBack}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Quay lại bước trước"
              style={(st) => [styles.footerBack, st.pressed && styles.pressed, focusRing(st)]}
            >
              <Icon name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
          )}
          <View style={styles.footerPrimary}>
            <HeyButton
              title={busy ? 'Đang xử lý...' : primary.title}
              iconName={primary.icon}
              size="lg"
              onPress={primary.onPress}
              loading={busy}
              disabled={primary.disabled}
            />
          </View>
        </View>
      </View>

      <CharacterFormSheet
        visible={charSheet}
        onClose={() => setCharSheet(false)}
        onSaved={(c) => {
          onCharacterCreated(c);
          setAnalysis(null);
          setSelected((prev) => [...prev, c.id]);
          setMainId((prev) => prev ?? c.id);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: Spacing.page, paddingBottom: Spacing.xxl, gap: Spacing.md },
  pressed: { opacity: 0.8 },
  progress: { gap: Spacing.sm },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.outline },
  stepDotOn: { backgroundColor: Colors.brandStrong, borderColor: Colors.brandStrong },
  stepNum: { ...Typography.caption, fontFamily: FontFamily.extraBold, color: Colors.textMuted },
  stepNumOn: { color: Colors.onStrong },
  stepName: { ...Typography.caption, color: Colors.textMuted, flexShrink: 1 },
  stepNameOn: { fontFamily: FontFamily.extraBold, color: Colors.text },
  stepTitle: { ...Typography.title, color: Colors.text },
  hint: { ...Typography.caption, color: Colors.textMuted },
  list: { gap: Spacing.sm },
  block: { gap: Spacing.sm },
  blockTitle: { ...Typography.heading, color: Colors.text },
  choice: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, minHeight: Touch.min, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  choiceSelected: { borderColor: Colors.brandStrong, backgroundColor: Colors.brandTint },
  choiceBody: { flex: 1, gap: 4 },
  choiceTitle: { ...Typography.bodyStrong, color: Colors.text },
  choiceDesc: { ...Typography.caption, color: Colors.text },
  charRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  charMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, minHeight: 56, padding: Spacing.md },
  star: { width: Touch.min, height: Touch.min, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.xs },
  addChar: { alignSelf: 'flex-start' },
  segment: { flexDirection: 'row', gap: Spacing.sm },
  segItem: { flex: 1, minHeight: 72, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  segItemOn: { borderColor: Colors.brandStrong, backgroundColor: Colors.brandTint },
  segLabel: { ...Typography.bodyStrong, color: Colors.text },
  segLabelOn: { color: Colors.brandInk },
  segSub: { ...Typography.caption, color: Colors.textMuted },
  segSubOn: { color: Colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: Touch.min },
  switchLabel: { ...Typography.label, color: Colors.text, flex: 1, paddingRight: Spacing.md },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, backgroundColor: Colors.dangerTint, padding: Spacing.md, borderRadius: Radius.md },
  errorText: { ...Typography.label, color: Colors.danger, flex: 1 },
  footer: { padding: Spacing.page, paddingTop: Spacing.sm, gap: Spacing.xs, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.outline },
  balance: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  footerBack: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.outline, backgroundColor: Colors.surface },
  footerPrimary: { flex: 1, minWidth: 0 },
});
