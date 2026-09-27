// apps/mobile/src/components/StoryReaderModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Story, StoryPageBranchChoice } from '../../../../packages/shared-types';
import { Colors } from '../theme/colors';
import { speechTTS } from '../../../../src/utils/speech-tts';
import { soundFX } from '../../../../src/utils/sound-fx';

interface StoryReaderModalProps {
  story: Story | null;
  visible: boolean;
  onClose: () => void;
}

export const StoryReaderModal: React.FC<StoryReaderModalProps> = ({
  story,
  visible,
  onClose,
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  React.useEffect(() => {
    if (story) {
      setCurrentPage(0);
      setIsPlayingAudio(false);
    }
  }, [story?.id]);

  if (!story) return null;

  const isVisible = visible !== undefined ? visible : Boolean(story);

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

  const handleClose = () => {
    soundFX.playPop();
    speechTTS.stop();
    setIsPlayingAudio(false);
    onClose();
  };

  const page = story.pages && story.pages[currentPage] ? story.pages[currentPage] : story.pages?.[0];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header Row with Close Button */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.themeTag}>
                {story.theme} • {story.targetAgeGroup} tuổi
              </Text>
              <Text style={styles.storyTitle} numberOfLines={1}>
                {story.title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Page Illustration */}
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    page?.illustrationUrl ||
                    story.coverImageUrl ||
                    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
                }}
                style={styles.illustration}
                resizeMode="cover"
              />
              <View style={styles.pageBadge}>
                <Text style={styles.pageBadgeText}>
                  Trang {currentPage + 1}/{story.pages.length}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handlePlayVoice(page?.text || '')}
                style={[
                  styles.audioBtn,
                  isPlayingAudio && styles.audioBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.audioBtnText,
                    isPlayingAudio && styles.audioBtnTextActive,
                  ]}
                >
                  {isPlayingAudio ? '⏹ Dừng đọc' : '🔊 Nghe đọc'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Page Text */}
            <View style={styles.storyTextCard}>
              <Text style={styles.storyText}>{page?.text}</Text>
            </View>

            {/* Branch Choice */}
            {page?.choices?.map((ch: StoryPageBranchChoice) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.choiceCard}
                activeOpacity={0.8}
                onPress={() => soundFX.playSparkle()}
              >
                <Text style={styles.choiceHeader}>
                  🌟 Rẽ nhánh tương tác ({ch.eqSignal})
                </Text>
                <Text style={styles.choiceLabel}>{ch.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pagination Controls */}
          <View style={styles.footer}>
            <TouchableOpacity
              disabled={currentPage === 0}
              onPress={() => {
                soundFX.playPageFlip();
                setIsPlayingAudio(false);
                setCurrentPage((p) => Math.max(0, p - 1));
              }}
              style={[
                styles.navBtn,
                currentPage === 0 && styles.navBtnDisabled,
              ]}
            >
              <Text style={styles.navBtnText}>← Trước</Text>
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
              {story.pages.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    idx === currentPage ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              disabled={currentPage === story.pages.length - 1}
              onPress={() => {
                soundFX.playPageFlip();
                setIsPlayingAudio(false);
                setCurrentPage((p) =>
                  Math.min(story.pages.length - 1, p + 1)
                );
              }}
              style={[
                styles.navBtn,
                styles.navBtnNext,
                currentPage === story.pages.length - 1 && styles.navBtnDisabled,
              ]}
            >
              <Text style={styles.navBtnNextText}>Sau →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: height * 0.88,
    backgroundColor: '#FFF8EB',
    borderRadius: 28,
    borderWidth: 3,
    borderColor: Colors.textDark,
    padding: 18,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.20)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  themeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textDark,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.textDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textDark,
  },
  scrollContent: {
    paddingBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.textDark,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    marginBottom: 12,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  pageBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(43, 33, 64, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  audioBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.textDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  audioBtnActive: {
    backgroundColor: Colors.primary,
  },
  audioBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
  },
  audioBtnTextActive: {
    color: '#FFFFFF',
  },
  storyTextCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textDark,
    fontWeight: '500',
  },
  choiceCard: {
    backgroundColor: '#F3EFFF',
    borderColor: Colors.secondary,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  choiceHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondary,
  },
  choiceLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textDark,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.textDark,
    backgroundColor: '#FFFFFF',
  },
  navBtnNext: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textDark,
  },
  navBtnNextText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.border,
  },
});
