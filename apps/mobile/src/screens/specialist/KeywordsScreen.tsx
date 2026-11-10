// apps/mobile/src/screens/specialist/KeywordsScreen.tsx
// GĐ E2b – Từ khoá chặn (Web KeywordsPage): thêm (mỗi dòng một từ; 1 từ → POST, nhiều từ → /bulk), tìm, lọc mức độ, đổi mức độ,
// bật / tắt, xoá. BE không cho sửa chữ của từ khoá. Mọi thao tác ghi qua Dialog xác nhận, chống bấm đúp, lỗi BE hiện câu đã dịch.
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { HeyCard } from '../../components/ui/HeyCard';
import { HeyButton } from '../../components/ui/HeyButton';
import { HeyChip } from '../../components/ui/HeyChip';
import { HeyInput } from '../../components/ui/HeyInput';
import { Badge } from '../../components/ui/Badge';
import { useDialog } from '../../components/ui/Dialog';
import { FilterChips, ManagementPage, ResourceBody, SectionTitle, useManagementResource, useMutationRunner } from '../../components/management/ManagementUi';
import { Colors } from '../../theme/colors';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { pedagogyService } from '../../services/pedagogyService';
import { formatDate } from '../../utils/format';
import {
  SEVERITY,
  SEVERITY_FILTERS,
  addKeywordsConfirm,
  keywordDeleteConfirm,
  keywordToggleConfirm,
  keywordsError,
  parseKeywords,
  severityConfirm,
} from '../../utils/pedagogy';
import type { BlockedKeyword, KeywordSeverity } from '../../types/pedagogy';

const SEARCH_DELAY_MS = 400;

export const KeywordsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const dialog = useDialog();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('all');
  const [text, setText] = useState('');
  const [addSeverity, setAddSeverity] = useState<KeywordSeverity>('block');
  const [addError, setAddError] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText), SEARCH_DELAY_MS);
    return () => clearTimeout(t);
  }, [searchText]);
  const list = useManagementResource(() => pedagogyService.getKeywords({ search, severity }), [search, severity]);
  const { run, busy, busyKey } = useMutationRunner(list.reload);
  const keywords = parseKeywords(text);

  const add = async () => {
    if (busy) return;
    const e = keywordsError(keywords);
    setAddError(e);
    if (e) return;
    if (!(await dialog.confirm(addKeywordsConfirm(keywords, addSeverity)))) return;
    if (await run('add', () => pedagogyService.addKeywords(keywords, addSeverity), ({ count }) => (count === 1 ? 'Đã thêm từ khoá' : `Đã thêm / cập nhật ${count} từ khoá`))) {
      setText('');
      void list.reload();
    }
  };
  const changeSeverity = async (k: BlockedKeyword) => {
    if (busy) return;
    if (!(await dialog.confirm(severityConfirm(k)))) return;
    if (await run(`sev:${k.id}`, () => pedagogyService.updateKeyword(k.id, { severity: k.severity === 'block' ? 'warn' : 'block' }), 'Đã đổi mức độ')) void list.reload();
  };
  const toggle = async (k: BlockedKeyword) => {
    if (busy) return;
    if (!(await dialog.confirm(keywordToggleConfirm(k)))) return;
    if (await run(`toggle:${k.id}`, () => pedagogyService.updateKeyword(k.id, { isActive: !k.isActive }), k.isActive ? 'Đã tắt từ khoá' : 'Đã bật lại từ khoá')) void list.reload();
  };
  const remove = async (k: BlockedKeyword) => {
    if (busy) return;
    if (!(await dialog.confirm(keywordDeleteConfirm(k)))) return;
    if (await run(`delete:${k.id}`, () => pedagogyService.deleteKeyword(k.id), 'Đã xoá từ khoá')) void list.reload();
  };

  return (
    <ManagementPage
      title="Từ khoá chặn"
      subtitle="Áp dụng cho cả truyện AI viết và chữ phụ huynh tự viết / sửa. Chặn hẳn: không lưu được. Cảnh báo: vẫn lưu được nhưng phụ huynh thấy nhắc nhở."
      onBack={onBack}
      onRefresh={list.reload}
    >
      <SectionTitle>Thêm từ khoá</SectionTitle>
      <HeyCard style={styles.card}>
        <HeyInput
          value={text}
          onChangeText={(t) => {
            setText(t);
            setAddError(null);
          }}
          placeholder="Mỗi dòng một từ hoặc cụm từ"
          multiline
          numberOfLines={3}
          autoCapitalize="none"
          error={addError ?? undefined}
          hint={'Khớp nguyên tiếng, không phân biệt hoa thường, giữ dấu ("ngu" không khớp "ngủ"). Thêm nhiều từ: từ đã có được cập nhật mức độ và bật lại.'}
        />
        <View accessibilityRole="radiogroup" accessibilityLabel="Mức độ" style={styles.chips}>
          {(Object.keys(SEVERITY) as KeywordSeverity[]).map((s) => (
            <HeyChip key={s} label={SEVERITY[s].label} selected={addSeverity === s} onPress={() => setAddSeverity(s)} />
          ))}
        </View>
        <Text style={styles.muted}>{SEVERITY[addSeverity].hint}.</Text>
        <HeyButton title={keywords.length > 1 ? `Thêm ${keywords.length} từ` : 'Thêm'} iconName="add" onPress={() => void add()} loading={busyKey === 'add'} disabled={busy || !keywords.length} />
      </HeyCard>

      <SectionTitle>Danh sách</SectionTitle>
      <HeyInput placeholder="Tìm từ khoá..." value={searchText} onChangeText={setSearchText} autoCapitalize="none" />
      <FilterChips label="Mức độ" options={SEVERITY_FILTERS} value={severity} onChange={setSeverity} />
      <ResourceBody status={list.status} error={list.error} empty={!list.data?.length} emptyTitle="Chưa có từ khoá phù hợp" onRetry={list.reload}>
        {list.data?.map((k) => (
          <HeyCard key={k.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={[styles.strong, styles.flex1, !k.isActive && styles.off]}>{k.keyword}</Text>
              <Badge label={SEVERITY[k.severity].label} tone={SEVERITY[k.severity].tone} />
              {!k.isActive && <Badge label="Đã tắt" tone="neutral" />}
            </View>
            <Text style={styles.muted}>
              {formatDate(k.createdAt)}
              {k.creator ? ` · ${k.creator}` : ''}
            </Text>
            <View style={styles.actions}>
              <HeyButton
                title={k.severity === 'block' ? 'Chuyển sang Cảnh báo' : 'Chuyển sang Chặn hẳn'}
                iconName="swap-horizontal"
                variant="tertiary"
                size="sm"
                onPress={() => void changeSeverity(k)}
                loading={busyKey === `sev:${k.id}`}
                disabled={busy}
                accessibilityLabel={`Đổi mức độ từ khoá ${k.keyword}`}
              />
              <HeyButton
                title={k.isActive ? 'Tắt' : 'Bật lại'}
                iconName={k.isActive ? 'pause-outline' : 'play-outline'}
                variant="tertiary"
                size="sm"
                onPress={() => void toggle(k)}
                loading={busyKey === `toggle:${k.id}`}
                disabled={busy}
                accessibilityLabel={`${k.isActive ? 'Tắt' : 'Bật lại'} từ khoá ${k.keyword}`}
              />
              <HeyButton title="Xoá" iconName="trash-outline" variant="ghost" size="sm" onPress={() => void remove(k)} loading={busyKey === `delete:${k.id}`} disabled={busy} accessibilityLabel={`Xoá từ khoá ${k.keyword}`} />
            </View>
          </HeyCard>
        ))}
      </ResourceBody>
    </ManagementPage>
  );
};

const styles = StyleSheet.create({
  card: { gap: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  flex1: { flex: 1 },
  strong: { ...Typography.bodyStrong, color: Colors.text },
  off: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  muted: { ...Typography.caption, color: Colors.textMuted },
});
