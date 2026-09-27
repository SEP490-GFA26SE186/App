// apps/mobile/src/screens/StoryWizard.tsx — v3.0 Comprehensive Magical Story Creator
// Detailed 5-Step Story Studio with Character Cast, World Setting, EQ Lessons, Family Memory, AI Generation & TTS Voice Preview
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { HeyButton } from '../components/ui/HeyButton';
import { HeyProgressBar } from '../components/ui/HeyProgressBar';
import {
  FamilyCharacter,
  PedagogicalTemplate,
  Story,
  UserAccount,
} from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';
import { speechTTS } from '../../../../src/utils/speech-tts';
import { soundFX } from '../../../../src/utils/sound-fx';

interface StoryWizardProps {
  characters: FamilyCharacter[];
  templates: PedagogicalTemplate[];
  currentUser: UserAccount;
  onStoryCreated: (story: Story) => void;
  onCancel: () => void;
  onUpdateCharacters: (chars: FamilyCharacter[]) => void;
}

// ─── 6 Magical Worlds Settings ────────────────────────────────────────────────
const STORY_WORLDS = [
  {
    id: 'world_forest',
    title: 'Rừng Đom Đóm Diệu Kỳ',
    desc: 'Cây cỏ phát sáng, muông thú biết nói',
    icon: '🌲',
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
    bg: '#E8F5E9',
  },
  {
    id: 'world_ocean',
    title: 'Vương Quốc Dưới Biển',
    desc: 'Rạn san hô, nàng tiên cá & rùa biển',
    icon: '🌊',
    cover: '/s3.jpg',
    bg: '#E0F7FA',
  },
  {
    id: 'world_space',
    title: 'Ngân Hà Ánh Sao',
    desc: 'Phi thuyền mây & các hành tinh kẹo ngọt',
    icon: '🚀',
    cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500',
    bg: '#EDE7F6',
  },
  {
    id: 'world_castle',
    title: 'Lâu Đài Cầu Vồng Trên Mây',
    desc: 'Cầu trượt mây, kỳ lân & chú rồng con',
    icon: '🏰',
    cover: '/s2.jpg',
    bg: '#FFF8E1',
  },
  {
    id: 'world_garden',
    title: 'Khu Vườn Hoa Sau Nhà',
    desc: 'Cây hoa nở rộ, chim sâu & bướm vàng',
    icon: '🏡',
    cover: '/s1.jpg',
    bg: '#F1F8E9',
  },
  {
    id: 'world_camp',
    title: 'Thung Lũng Cắm Trại',
    desc: 'Lều ấm cúng, lửa trại bập bùng & suối reo',
    icon: '⛺',
    cover: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500',
    bg: '#FFF3E0',
  },
];

// ─── Quick Memory Idea Prompts ────────────────────────────────────────────────
const QUICK_IDEAS = [
  '🎈 Hôm nay bé vừa biết nhường đồ chơi cho bạn',
  '🌙 Bé sợ bóng tối và chưa dám ngủ một mình',
  '🚲 Bé đang tập đi xe đạp và sợ bị ngã',
  '🌸 Bé học cách nói lời cảm ơn & xin lỗi chân thành',
  '🎨 Bé vẽ một bức tranh đẹp và muốn tặng mẹ',
  '🐾 Bé giúp bố mẹ chăm sóc và cho cún cưng ăn',
];

export const StoryWizard: React.FC<StoryWizardProps> = ({
  characters,
  templates,
  currentUser,
  onStoryCreated,
  onCancel,
  onUpdateCharacters,
}) => {
  // Wizard step: 1 (Cast) -> 2 (World) -> 3 (EQ Template) -> 4 (Story Details) -> 5 (AI Generating & Preview)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Characters
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([
    characters[0]?.id || 'char_01',
  ]);
  const [showAddCharModal, setShowAddCharModal] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState<'HERO' | 'FATHER' | 'MOTHER' | 'PET'>('HERO');
  const [newCharTrait, setNewCharTrait] = useState('');

  // Step 2: World
  const [selectedWorldId, setSelectedWorldId] = useState<string>('world_forest');

  // Step 3: EQ Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'tpl_01'
  );

  // Step 4: Story Idea & Tone
  const [userPrompt, setUserPrompt] = useState('');
  const [storyTone, setStoryTone] = useState<'BEDTIME' | 'ADVENTURE' | 'GENTLE'>('GENTLE');

  // Step 5: Generation state & Preview
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStageText, setGenerationStageText] = useState('');
  const [createdStory, setCreatedStory] = useState<Story | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const toggleSelectChar = (id: string) => {
    soundFX.playPop();
    if (selectedCharIds.includes(id)) {
      if (selectedCharIds.length > 1) {
        setSelectedCharIds(selectedCharIds.filter((c) => c !== id));
      }
    } else {
      setSelectedCharIds([...selectedCharIds, id]);
    }
  };

  const handleAddNewCharacter = () => {
    if (!newCharName.trim()) return;
    soundFX.playPuppy();
    const created: FamilyCharacter = {
      id: `char_${Date.now()}`,
      parentId: currentUser.id,
      name: newCharName.trim(),
      relationRole: newCharRole,
      appearanceDescription: newCharTrait || 'Nụ cười tươi tắn, trang phục đáng yêu',
      personalityTraits: ['Thân thiện', 'Tốt bụng'],
      avatarPlaceholder: newCharRole === 'HERO' ? '👦' : newCharRole === 'PET' ? '🐶' : '👨‍👩‍👧',
    };
    const updated = [...characters, created];
    onUpdateCharacters(updated);
    setSelectedCharIds([...selectedCharIds, created.id]);
    setNewCharName('');
    setNewCharTrait('');
    setShowAddCharModal(false);
  };

  const handleStartGeneration = async () => {
    soundFX.playSparkle();
    setStep(5);
    setIsGenerating(true);
    setGenerationProgress(15);
    setGenerationStageText('🔒 Đang bảo mật danh tính & mã hoá nhân vật...');

    try {
      setTimeout(() => {
        setGenerationProgress(45);
        setGenerationStageText('🧠 Gemini AI đang sáng tạo cốt truyện & tình huống...');
      }, 1000);

      setTimeout(() => {
        setGenerationProgress(75);
        setGenerationStageText('🎨 Đang phác thảo tranh minh họa từng trang sách...');
      }, 2200);

      const res = await fetch('/api/stories/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: `${userPrompt}. Thế giới: ${selectedWorldId}. Phong cách: ${storyTone}`,
          templateId: selectedTemplateId,
          characterIds: selectedCharIds,
        }),
      });

      let finalStory: Story;

      if (res.ok) {
        const data = await res.json();
        finalStory = data.story || data;
      } else {
        // Fallback local pedagogical generation
        const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
        const selectedChars = characters.filter((c) => selectedCharIds.includes(c.id));
        const hero = selectedChars[0] || { name: 'Bé Bo' };
        const world = STORY_WORLDS.find((w) => w.id === selectedWorldId) || STORY_WORLDS[0];

        finalStory = {
          id: `story_${Date.now()}`,
          creatorId: currentUser.id,
          title: `Chuyến Phiêu Lưu Đến ${world.title} Của ${hero.name}`,
          theme: selectedTemplate?.title || 'Lòng dũng cảm',
          targetAgeGroup: selectedTemplate?.targetAgeGroup || '3-6',
          coverImageUrl: world.cover,
          status: 'PUBLISHED',
          isAnonymized: true,
          priceCredits: 0,
          priceVnd: 49000,
          sellerCommissionRate: 0.7,
          platformCommissionRate: 0.3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ratingsAvg: 5.0,
          reviewsCount: 1,
          charactersUsed: selectedChars.map(c => ({
            characterId: c.id,
            realName: c.name,
            placeholderTag: `[${c.relationRole}_1]`,
            role: c.relationRole,
          })),
          pages: [
            {
              id: 'p_1',
              pageNumber: 1,
              text: `Một buổi sáng trong lành, ${hero.name} cùng các bạn bước vào ${world.title} rộn rã tiếng chim ca.`,
              illustrationUrl: world.cover,
              moderatorApproved: true,
            },
            {
              id: 'p_2',
              pageNumber: 2,
              text: `${hero.name} gặp một bạn nhỏ đang lo lắng tìm lối về. Bé mỉm cười thân thiện và đưa tay giúp đỡ bạn.`,
              illustrationUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
              moderatorApproved: true,
              choices: [
                {
                  id: 'c_1',
                  label: `Cùng bạn vượt qua thử thách và chia sẻ đồ ăn nhẹ`,
                  targetNextPageNumber: 3,
                  eqSignal: 'EMPATHY',
                },
              ],
            },
            {
              id: 'p_3',
              pageNumber: 3,
              text: `Nhờ lòng tốt và sự dũng cảm, ${hero.name} đã làm được một việc thật ý nghĩa và nhận lại những nụ cười rạng rỡ!`,
              illustrationUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
              moderatorApproved: true,
            },
          ],
        };
      }

      setGenerationProgress(100);
      setGenerationStageText('✨ Tác phẩm hoàn thành xuất sắc!');
      soundFX.playSuccess();
      setCreatedStory(finalStory);
      setIsGenerating(false);
    } catch {
      setIsGenerating(false);
    }
  };

  const handlePlayVoice = (text: string) => {
    soundFX.playCoin();
    if (isPlayingAudio) {
      speechTTS.stop();
      setIsPlayingAudio(false);
    } else {
      speechTTS.speak(text, {
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false),
      });
    }
  };

  const handleFinishAndRead = () => {
    soundFX.playSparkle();
    speechTTS.stop();
    if (createdStory) {
      onStoryCreated(createdStory);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── TOP PROGRESS HEADER ────────────────────────────────────────────── */}
      <View style={styles.stepHeader}>
        <View style={styles.stepTitleRow}>
          <Text style={styles.stepNumberBadge}>Bước {step}/5</Text>
          <Text style={styles.stepTitle}>
            {step === 1 && 'Nhân Vật Diễn Viên'}
            {step === 2 && 'Bối Cảnh Thế Giới'}
            {step === 3 && 'Bài Học & EQ'}
            {step === 4 && 'Ý Tưởng & Kỷ Niệm'}
            {step === 5 && (isGenerating ? 'AI Đang Sáng Tác...' : 'Duyệt Tác Phẩm')}
          </Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <HeyProgressBar progress={(step / 5) * 100} color="#2E7D32" height={6} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════
            BƯỚC 1: CHỌN NHÂN VẬT GIA ĐÌNH
            ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <View>
            <Text style={styles.sectionHeading}>Chọn diễn viên xuất hiện trong truyện</Text>
            <Text style={styles.sectionSub}>
              Bé và các thành viên gia đình sẽ được lồng ghép sống động vào cốt truyện:
            </Text>

            <View style={styles.charList}>
              {characters.map((char) => {
                const isSelected = selectedCharIds.includes(char.id);
                return (
                  <TouchableOpacity
                    key={char.id}
                    activeOpacity={0.85}
                    onPress={() => toggleSelectChar(char.id)}
                    style={[styles.charCard, isSelected && styles.charCardSelected]}
                  >
                    <View style={styles.charAvatar}>
                      <Text style={styles.charEmoji}>
                        {char.relationRole === 'HERO' ? '👦' : char.relationRole === 'PET' ? '🐶' : char.relationRole === 'FATHER' ? '👨‍💼' : '👩‍🍳'}
                      </Text>
                    </View>
                    <View style={styles.charInfo}>
                      <View style={styles.charNameRow}>
                        <Text style={styles.charName}>{char.name}</Text>
                        <View style={styles.roleTag}>
                          <Text style={styles.roleTagText}>
                            {char.relationRole === 'HERO' ? 'Nhân vật chính' : char.relationRole}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.charDesc} numberOfLines={1}>
                        {char.appearanceDescription || 'Thành viên yêu thương'}
                      </Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      <Text style={styles.checkText}>{isSelected ? '✓' : ''}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add character button */}
            {!showAddCharModal ? (
              <TouchableOpacity
                onPress={() => setShowAddCharModal(true)}
                style={styles.addCharOutlineBtn}
              >
                <Text style={styles.addCharOutlineText}>+ Thêm thành viên mới</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.addCharBox}>
                <Text style={styles.addCharBoxTitle}>Thêm nhân vật mới vào gia đình</Text>
                <TextInput
                  value={newCharName}
                  onChangeText={setNewCharName}
                  placeholder="Tên nhân vật (vd: Bé Na, Cún Bông...)"
                  style={styles.inputBox}
                />
                <TextInput
                  value={newCharTrait}
                  onChangeText={setNewCharTrait}
                  placeholder="Đặc điểm ngoại hình/tính cách (vd: Mắt to, thích khủng long)"
                  style={styles.inputBox}
                />
                <View style={styles.rolePickerRow}>
                  {(['HERO', 'FATHER', 'MOTHER', 'PET'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setNewCharRole(r)}
                      style={[styles.rolePickBtn, newCharRole === r && styles.rolePickBtnActive]}
                    >
                      <Text style={[styles.rolePickText, newCharRole === r && styles.rolePickTextActive]}>
                        {r === 'HERO' ? 'Bé' : r === 'PET' ? 'Cún/Mèo' : r === 'FATHER' ? 'Bố' : 'Mẹ'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.addCharActionRow}>
                  <TouchableOpacity onPress={() => setShowAddCharModal(false)} style={styles.cancelSmallBtn}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleAddNewCharacter} style={styles.saveSmallBtn}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#FFFFFF' }}>Lưu nhân vật</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <HeyButton
              title="Tiếp tục: Chọn bối cảnh thế giới →"
              onPress={() => {
                soundFX.playPageFlip();
                setStep(2);
              }}
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 2: CHỌN THẾ GIỚI & BỐI CẢNH
            ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <View>
            <Text style={styles.sectionHeading}>Chọn thế giới cổ tích kỳ diệu</Text>
            <Text style={styles.sectionSub}>
              Nơi cuộc phiêu lưu của bé và các bạn sẽ bắt đầu:
            </Text>

            <View style={styles.worldGrid}>
              {STORY_WORLDS.map((w) => {
                const isSelected = selectedWorldId === w.id;
                return (
                  <TouchableOpacity
                    key={w.id}
                    activeOpacity={0.88}
                    onPress={() => {
                      soundFX.playBoing();
                      setSelectedWorldId(w.id);
                    }}
                    style={[
                      styles.worldCard,
                      isSelected && styles.worldCardSelected,
                      { backgroundColor: w.bg },
                    ]}
                  >
                    <Image source={{ uri: w.cover }} style={styles.worldThumb} />
                    <View style={styles.worldInfo}>
                      <View style={styles.worldTitleRow}>
                        <Text style={styles.worldIcon}>{w.icon}</Text>
                        <Text style={styles.worldTitle} numberOfLines={1}>{w.title}</Text>
                      </View>
                      <Text style={styles.worldDesc} numberOfLines={2}>{w.desc}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.worldSelectedBadge}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>✓ ĐÃ CHỌN</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.stepBtnRow}>
              <HeyButton
                title="← Quay lại"
                variant="outline"
                onPress={() => {
                  soundFX.playPageFlip();
                  setStep(1);
                }}
                style={{ flex: 1 }}
              />
              <HeyButton
                title="Tiếp: Chọn bài học EQ →"
                onPress={() => {
                  soundFX.playPageFlip();
                  setStep(3);
                }}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 3: CHỌN BÀI HỌC SƯ PHẠM & EQ
            ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <View>
            <Text style={styles.sectionHeading}>Chọn bài học sư phạm & trí tuệ cảm xúc</Text>
            <Text style={styles.sectionSub}>
              Lồng ghép kỹ năng sống và phẩm chất tích cực vào câu chuyện:
            </Text>

            <View style={styles.templateList}>
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <TouchableOpacity
                    key={tpl.id}
                    activeOpacity={0.88}
                    onPress={() => {
                      soundFX.playHeart();
                      setSelectedTemplateId(tpl.id);
                    }}
                    style={[styles.tplCard, isSelected && styles.tplCardSelected]}
                  >
                    <View style={styles.tplTopRow}>
                      <Text style={styles.tplIcon}>🌸</Text>
                      <View style={styles.tplInfo}>
                        <Text style={styles.tplTitle}>{tpl.title}</Text>
                        <Text style={styles.tplDesc}>{tpl.description}</Text>
                      </View>
                    </View>
                    <View style={styles.tplTagRow}>
                      <View style={styles.tplAgePill}>
                        <Text style={styles.tplAgeText}>Độ tuổi: {tpl.targetAgeGroup} tuổi</Text>
                      </View>
                      {tpl.eqDimensions?.map((eq, i) => (
                        <View key={i} style={styles.tplEqPill}>
                          <Text style={styles.tplEqText}>🌱 {eq}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.stepBtnRow}>
              <HeyButton
                title="← Quay lại"
                variant="outline"
                onPress={() => {
                  soundFX.playPageFlip();
                  setStep(2);
                }}
                style={{ flex: 1 }}
              />
              <HeyButton
                title="Tiếp: Chi tiết cốt truyện →"
                onPress={() => {
                  soundFX.playPageFlip();
                  setStep(4);
                }}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 4: Ý TƯỞNG & KỶ NIỆM RIÊNG CỦA GIA ĐÌNH
            ═══════════════════════════════════════════════════════ */}
        {step === 4 && (
          <View>
            <Text style={styles.sectionHeading}>Kỷ niệm & Lời nhắn gửi riêng cho bé</Text>
            <Text style={styles.sectionSub}>
              Chọn nhanh ý tưởng gợi ý hoặc nhập kỷ niệm đáng nhớ của bé hôm nay:
            </Text>

            {/* Quick Idea Pills */}
            <Text style={styles.subHeadingLabel}>Gợi ý ý tưởng 1 chạm:</Text>
            <View style={styles.quickIdeaWrap}>
              {QUICK_IDEAS.map((idea, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    soundFX.playPop();
                    setUserPrompt(idea);
                  }}
                  style={styles.quickIdeaPill}
                >
                  <Text style={styles.quickIdeaText}>{idea}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Prompt Box */}
            <Text style={styles.subHeadingLabel}>Lời nhắn gửi / Chi tiết muốn xuất hiện:</Text>
            <TextInput
              multiline
              numberOfLines={4}
              value={userPrompt}
              onChangeText={setUserPrompt}
              placeholder="Ví dụ: Hôm nay bé đi học mầm non rất ngoan, biết cất giày dép gọn gàng..."
              style={styles.customPromptInput}
            />

            {/* Story Tone */}
            <Text style={styles.subHeadingLabel}>Tông điệu câu chuyện:</Text>
            <View style={styles.toneRow}>
              {[
                { id: 'BEDTIME', label: '🌙 Ấm áp ru ngủ', desc: 'Dịu êm trước giờ ngủ' },
                { id: 'ADVENTURE', label: '🚀 Hào hứng phiêu lưu', desc: 'Vui vẻ & năng lượng' },
                { id: 'GENTLE', label: '🌸 Nhẹ nhàng thủ thỉ', desc: 'Sâu lắng & tình cảm' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    soundFX.playPop();
                    setStoryTone(t.id as any);
                  }}
                  style={[styles.toneCard, storyTone === t.id && styles.toneCardActive]}
                >
                  <Text style={styles.toneLabel}>{t.label}</Text>
                  <Text style={styles.toneDesc}>{t.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.stepBtnRow}>
              <HeyButton
                title="← Quay lại"
                variant="outline"
                onPress={() => {
                  soundFX.playPageFlip();
                  setStep(3);
                }}
                style={{ flex: 1 }}
              />
              <HeyButton
                title="🪄 Sáng Tác Truyện (Gemini AI)"
                onPress={handleStartGeneration}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        )}

        {/* ═══════════════════════════════════════════════════════
            BƯỚC 5: AI SÁNG TÁC & DUYỆT TỪNG TRANG (KÈM TTS VOICE)
            ═══════════════════════════════════════════════════════ */}
        {step === 5 && (
          <View>
            {isGenerating ? (
              <View style={styles.generatingCard}>
                <ActivityIndicator size="large" color="#2E7D32" style={{ marginBottom: 16 }} />
                <Text style={styles.genTitle}>Gemini AI đang sáng tác tác phẩm...</Text>
                <Text style={styles.genSubtitle}>{generationStageText}</Text>
                <HeyProgressBar progress={generationProgress} height={10} color="#4CAF50" />
                <Text style={styles.percentText}>{generationProgress}%</Text>
              </View>
            ) : createdStory ? (
              <View>
                {/* Success Banner */}
                <View style={styles.storyHeaderCard}>
                  <Text style={styles.successEmoji}>🎉</Text>
                  <Text style={styles.storyTitleResult}>{createdStory.title}</Text>
                  <Text style={styles.storySummaryResult}>{createdStory.summary || 'Tác phẩm thiếu nhi cá nhân hoá độc quyền.'}</Text>
                </View>

                {/* Page by Page Preview Studio */}
                <Text style={styles.subHeadingLabel}>Duyệt trước từng trang sách:</Text>
                <View style={styles.pagePreviewBox}>
                  {/* Page Image */}
                  <Image
                    source={{
                      uri: createdStory.pages[previewPageIndex]?.illustrationUrl || createdStory.coverImageUrl || '/s1.jpg',
                    }}
                    style={styles.pagePreviewImg}
                  />

                  {/* Top Bar on Image */}
                  <View style={styles.pageNumberPill}>
                    <Text style={styles.pageNumberText}>
                      Trang {previewPageIndex + 1}/{createdStory.pages.length}
                    </Text>
                  </View>

                  {/* Audio TTS Button */}
                  <TouchableOpacity
                    onPress={() => handlePlayVoice(createdStory.pages[previewPageIndex]?.text || '')}
                    style={[styles.ttsBtn, isPlayingAudio && styles.ttsBtnActive]}
                  >
                    <Text style={styles.ttsBtnText}>
                      {isPlayingAudio ? '⏹ Dừng đọc' : '🔊 Nghe thử giọng đọc'}
                    </Text>
                  </TouchableOpacity>

                  {/* Page text */}
                  <View style={styles.pageTextCard}>
                    <Text style={styles.pageTextContent}>
                      {createdStory.pages[previewPageIndex]?.text}
                    </Text>
                  </View>

                  {/* Choice interactive if exists */}
                  {createdStory.pages[previewPageIndex]?.choices?.map((c, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.choiceBox}
                      onPress={() => soundFX.playSparkle()}
                    >
                      <Text style={styles.choiceHeader}>🌟 Điểm rẽ nhánh tương tác:</Text>
                      <Text style={styles.choiceText}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}

                  {/* Page Stepper */}
                  <View style={styles.pageStepperRow}>
                    <TouchableOpacity
                      disabled={previewPageIndex === 0}
                      onPress={() => {
                        soundFX.playPageFlip();
                        speechTTS.stop();
                        setIsPlayingAudio(false);
                        setPreviewPageIndex(p => Math.max(0, p - 1));
                      }}
                      style={[styles.stepperBtn, previewPageIndex === 0 && { opacity: 0.3 }]}
                    >
                      <Text style={styles.stepperBtnText}>← Trang trước</Text>
                    </TouchableOpacity>

                    <Text style={styles.stepperIndicator}>
                      {previewPageIndex + 1} / {createdStory.pages.length}
                    </Text>

                    <TouchableOpacity
                      disabled={previewPageIndex === createdStory.pages.length - 1}
                      onPress={() => {
                        soundFX.playPageFlip();
                        speechTTS.stop();
                        setIsPlayingAudio(false);
                        setPreviewPageIndex(p => Math.min(createdStory.pages.length - 1, p + 1));
                      }}
                      style={[styles.stepperBtn, previewPageIndex === createdStory.pages.length - 1 && { opacity: 0.3 }]}
                    >
                      <Text style={styles.stepperBtnText}>Trang sau →</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Final Action Buttons */}
                <HeyButton
                  title="📖 Đọc toàn bộ truyện cùng bé ngay"
                  onPress={handleFinishAndRead}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFE',
  },
  stepHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepNumberBadge: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E293B',
    flex: 1,
    marginLeft: 8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 14,
  },
  subHeadingLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },

  // Characters
  charList: {
    gap: 8,
  },
  charCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  charCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FDF4',
  },
  charAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF9C4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  charEmoji: {
    fontSize: 22,
  },
  charInfo: {
    flex: 1,
  },
  charNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  charName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2E7D32',
  },
  charDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  addCharOutlineBtn: {
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#2E7D32',
    borderRadius: 14,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
  },
  addCharOutlineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
  },
  addCharBox: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addCharBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  inputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 9,
    fontSize: 13,
    marginBottom: 8,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  rolePickBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  rolePickBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  rolePickText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  rolePickTextActive: {
    color: '#2E7D32',
    fontWeight: '900',
  },
  addCharActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelSmallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveSmallBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },

  // World Grid
  worldGrid: {
    gap: 10,
  },
  worldCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  worldCardSelected: {
    borderColor: '#2E7D32',
    boxShadow: '0 4px 14px rgba(46, 125, 50, 0.2)',
  },
  worldThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 10,
  },
  worldInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  worldTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  worldIcon: {
    fontSize: 16,
  },
  worldTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  worldDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  worldSelectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#2E7D32',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Step buttons
  stepBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },

  // Templates
  templateList: {
    gap: 10,
  },
  tplCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  tplCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FDF4',
  },
  tplTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tplIcon: {
    fontSize: 20,
  },
  tplInfo: {
    flex: 1,
  },
  tplTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  tplDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  tplTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tplAgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tplAgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  tplEqPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tplEqText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },

  // Quick ideas
  quickIdeaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  quickIdeaPill: {
    backgroundColor: '#F1F8F2',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickIdeaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2E7D32',
  },
  customPromptInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  toneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toneCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  toneCardActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FDF4',
  },
  toneLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 2,
  },
  toneDesc: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },

  // Generation & Preview
  generatingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    marginTop: 20,
  },
  genTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
  },
  genSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
  },
  percentText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2E7D32',
    marginTop: 8,
  },
  storyHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    marginBottom: 14,
    boxShadow: '0 4px 14px rgba(76,175,80,0.1)',
  },
  successEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  storyTitleResult: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
  },
  storySummaryResult: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  pagePreviewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    position: 'relative',
  },
  pagePreviewImg: {
    width: '100%',
    height: 190,
  },
  pageNumberPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pageNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  ttsBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  ttsBtnActive: {
    backgroundColor: '#4CAF50',
  },
  ttsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E293B',
  },
  pageTextCard: {
    padding: 14,
  },
  pageTextContent: {
    fontSize: 14,
    lineHeight: 21,
    color: '#334155',
    fontWeight: '600',
  },
  choiceBox: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 10,
  },
  choiceHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  choiceText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '700',
    marginTop: 2,
  },
  pageStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFAFA',
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E7D32',
  },
  stepperIndicator: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
});
