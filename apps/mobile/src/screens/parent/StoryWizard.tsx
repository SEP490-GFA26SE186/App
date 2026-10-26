// apps/mobile/src/screens/parent/StoryWizard.tsx
// B5 – Xưởng truyện: tạo truyện theo 3 lối vào (Web: CreateStoryPage). Một trang gồm các mục đánh số:
// 1) lối vào  2) nội dung  3) nhân vật (đúng 1 nhân vật chính)  4) độ dài + tên truyện.
// C8: nối BE thật. Lối "Chuyện mẫu": POST /stories → POST /generate → poll /generation.
// Lối "Kể chuyện nhà mình": POST /stories/analyze → xác nhận → POST /stories (analysisToken) → generate → poll.
// Lối "Tự viết": trình soạn trang/điểm dừng chưa có trên Mobile → "Chưa hỗ trợ", không gọi API.
// Credit do BE giữ/hoàn; Mobile chỉ hiển thị giá (GET /stories/ai-pricing) và số dư (GET /auth/me).
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { PedagogicalTemplate } from '../../../../../packages/shared-types';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { StateView } from '../../components/ui/StateView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { CharacterFormSheet } from '../../components/parent/CharacterFormSheet';
import { GenerationRunner } from '../../components/parent/GenerationRunner';
import { storyService } from '../../services';
import type { AiPricingDto, AnalyzeStoryResultDto } from '../../types/api';
import { Colors } from '../../theme/colors';
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

const Section: React.FC<{ step: number; title: string; hint?: string; children: React.ReactNode }> = ({
  step,
  title,
  hint,
  children,
}) => (
  <HeyCard style={styles.section}>
    <View style={styles.sectionHead}>
      <View style={styles.stepDot}>
        <Text style={styles.stepNum}>{step}</Text>
      </View>
      <View style={styles.sectionTitles}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </View>
    {children}
  </HeyCard>
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

  const isAi = entry === 'family' || entry === 'topic';

  const toggleCharacter = (id: string) => {
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    setAnalysis(null);
    // Nhân vật chính bị bỏ chọn (hoặc chưa có) → lấy nhân vật đầu tiên còn lại
    if (!next.includes(mainId ?? '')) setMainId(next[0] ?? null);
  };

  const situationLength = situation.trim().length;
  const cost = isAi ? pricing?.lengths.find((l) => l.length === length)?.credits : undefined;
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

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <ScreenHeader
        title="Sáng tác truyện"
        subtitle="Chọn cách tạo truyện, nhân vật và độ dài."
        onBack={onCancel}
      />

      <Section step={1} title="Chọn cách tạo truyện">
        {STORY_ENTRIES.map((e) => (
          <TouchableOpacity key={e.value} activeOpacity={0.85} onPress={() => { setEntry(e.value); setError(''); }}>
            <View style={[styles.entry, entry === e.value && styles.entrySelected]}>
              <Text style={styles.entryIcon}>{e.icon}</Text>
              <View style={styles.entryText}>
                <Text style={styles.entryTitle}>{e.title}</Text>
                <Text style={styles.entryDesc}>{e.text}</Text>
                <Badge label={e.note} tone="neutral" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </Section>

      {entry === 'family' && (
        <Section step={2} title="Kể chuyện nhà mình" hint="Kể điều bé vừa gặp; AI tìm khoảnh khắc khó để bé tập lại.">
          <HeyInput
            placeholder="Hôm nay ở trường, bé bị bạn giành mất đồ chơi và đã khóc…"
            value={situation}
            onChangeText={(t) => { setSituation(t); setAnalysis(null); setError(''); }}
            multiline
            numberOfLines={5}
            hint={`${situationLength}/${SITUATION_MAX} ký tự (tối thiểu ${SITUATION_MIN})`}
          />
        </Section>
      )}

      {entry === 'topic' && (
        <Section step={2} title="Chọn chuyện mẫu" hint="Mỗi chuyện giúp bé tập một năng lực cảm xúc (CASEL).">
          {templates.length === 0 ? (
            <StateView variant="empty" title="Chưa có chuyện mẫu" description="Danh sách chuyện mẫu chưa tải được hoặc đang trống." />
          ) : (
            templates.map((t) => (
              <TouchableOpacity key={t.id} activeOpacity={0.85} onPress={() => { setTopicId(t.id); setError(''); }}>
                <View style={[styles.entry, topicId === t.id && styles.entrySelected]}>
                  <View style={styles.entryText}>
                    <Text style={styles.entryTitle}>{t.title}</Text>
                    <Text style={styles.entryDesc} numberOfLines={2}>{t.description}</Text>
                    <Badge label={String(t.category)} tone="info" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Section>
      )}

      {entry === 'handwritten' && (
        <Section step={2} title="Tự viết">
          <StateView
            variant="unsupported"
            title="Trình soạn truyện tự viết chưa được hỗ trợ"
            description="Ba mẹ vẫn có thể chọn nhân vật và đặt tên để chuẩn bị; việc viết từng trang sẽ có khi kết nối máy chủ."
          />
        </Section>
      )}

      {!!entry && (
        <>
          <Section step={3} title="Nhân vật trong truyện" hint="Chọn nhân vật, chạm ⭐ để đặt nhân vật chính (đúng 1).">
            {characters.length === 0 ? (
              <StateView variant="empty" title="Chưa có nhân vật" description="Thêm người thân để đưa vào truyện." />
            ) : (
              characters.map((c) => {
                const on = selected.includes(c.id);
                return (
                  <View key={c.id} style={[styles.charRow, on && styles.entrySelected]}>
                    <TouchableOpacity style={styles.charMain} onPress={() => toggleCharacter(c.id)} activeOpacity={0.8}>
                      <Text style={styles.check}>{on ? '☑' : '☐'}</Text>
                      <View style={styles.entryText}>
                        <Text style={styles.entryTitle}>{c.name}</Text>
                        <Text style={styles.entryDesc} numberOfLines={1}>{c.appearanceDescription}</Text>
                      </View>
                    </TouchableOpacity>
                    {on && (
                      <TouchableOpacity onPress={() => setMainId(c.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={styles.star}>{mainId === c.id ? '⭐' : '☆'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
            <HeyButton title="➕ Thêm nhân vật" variant="outline" size="sm" onPress={() => setCharSheet(true)} style={styles.addChar} />
          </Section>

          <Section step={4} title={isAi ? 'Độ dài & tên truyện' : 'Tên truyện'}>
            {isAi && (
              <>
                <View style={styles.chips}>
                  {AI_LENGTHS.map((l) => (
                    <HeyChip key={l.value} label={`${l.label} · ${l.pages} trang`} selected={length === l.value} onPress={() => { setLength(l.value); setAnalysis(null); }} />
                  ))}
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
                <Switch value={useTts} onValueChange={setUseTts} />
              </View>
            )}
          </Section>

          {!!error && <Text style={styles.error}>⚠️ {error}</Text>}

          {entry === 'family' && !!analysis && (
            <HeyCard variant="yellow" style={styles.section}>
              <Text style={styles.sectionTitle}>Bé sẽ tập gì?</Text>
              <Text style={styles.entryDesc}>{analysis.momentSummary}</Text>
              {analysis.subSkills.length > 0 && (
                <View style={styles.chips}>
                  {analysis.subSkills.map((k) => (
                    <Badge key={k.id} label={k.nameVi} tone="info" />
                  ))}
                </View>
              )}
              <HeyButton
                title={busy ? '⏳ Đang tạo...' : `🪄 Tạo truyện${cost ? ` (${cost} credit)` : ''}`}
                onPress={createFamily}
                disabled={busy}
                size="lg"
              />
            </HeyCard>
          )}

          {entry === 'handwritten' ? (
            <HeyButton title="Tạo truyện tự viết (chưa hỗ trợ)" disabled onPress={() => {}} size="lg" style={styles.submit} />
          ) : (
            !(entry === 'family' && analysis) && (
              <HeyButton
                title={busy ? '⏳ Đang xử lý...' : entry === 'family' ? '🔎 Xem bé sẽ tập gì' : '🪄 Tạo truyện'}
                onPress={submit}
                disabled={busy}
                size="lg"
                style={styles.submit}
              />
            )
          )}
        </>
      )}

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 14, gap: 10 },
  sectionHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { fontSize: 13, fontWeight: '900', color: Colors.primaryText },
  sectionTitles: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  hint: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginTop: 2 },
  entry: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  entrySelected: { borderColor: Colors.secondary, backgroundColor: Colors.secondaryLight },
  entryIcon: { fontSize: 26 },
  entryText: { flex: 1, gap: 3 },
  entryTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  entryDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  charMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  check: { fontSize: 20, color: Colors.secondaryDark },
  star: { fontSize: 22 },
  addChar: { alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  error: { color: '#B91C1C', fontWeight: '700', fontSize: 13, marginBottom: 8 },
  submit: { marginTop: 4 },
});
