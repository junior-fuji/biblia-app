import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ProjectorSlide = {
  id: string;
  title?: string;
  content: string;
  kind?: 'verse' | 'stanza' | 'chorus' | 'custom';
};

type Props = {
  title?: string;
  subtitle?: string;
  slides: ProjectorSlide[];
  initialIndex?: number;
  onClose: () => void;
  onPrevGroup?: () => void;
  onNextGroup?: () => void;
  prevGroupLabel?: string;
  nextGroupLabel?: string;
  baseFontSize?: number;
  uniformFontSize?: boolean;

  // novo
  pickerLabel?: string;
  pickerTitle?: string;
  renderSlideLabel?: (slide: ProjectorSlide, index: number) => string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getBaseFontSize(kind?: ProjectorSlide['kind']) {
  if (kind === 'verse') return 34;
  if (kind === 'stanza') return 34;
  if (kind === 'chorus') return 34;
  return 34;
}

export default function ProjectorScreen({
  title,
  subtitle,
  slides,
  initialIndex = 0,
  onClose,
  onPrevGroup,
  onNextGroup,
  prevGroupLabel = 'Anterior',
  nextGroupLabel = 'Próximo',
  baseFontSize,
  uniformFontSize = false,
  pickerLabel = 'Slides',
  pickerTitle = 'Selecionar slide',
  renderSlideLabel,
}: Props) {
  const [manualOffset, setManualOffset] = useState(0);
  const [slideIndex, setSlideIndex] = useState(initialIndex);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setSlideIndex(clamp(initialIndex, 0, Math.max(slides.length - 1, 0)));
  }, [initialIndex, slides.length]);

  const currentSlide = slides[slideIndex] ?? null;
  const canPrevSlide = slideIndex > 0;
  const canNextSlide = slideIndex < slides.length - 1;

  const prevSlide = () => {
    setSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  const nextSlide = () => {
    setSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const win = globalThis?.window;
    if (!win) return;

    const onKeyDown = (e: any) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault?.();
        nextSlide();
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault?.();
        prevSlide();
      }

      if (e.key === 'PageDown' && onNextGroup) {
        e.preventDefault?.();
        onNextGroup();
      }

      if (e.key === 'PageUp' && onPrevGroup) {
        e.preventDefault?.();
        onPrevGroup();
      }

      if (e.key === 'Escape') {
        e.preventDefault?.();
        if (pickerOpen) {
          setPickerOpen(false);
        } else {
          onClose();
        }
      }

      if (e.key === '+' || e.key === '=') {
        setManualOffset((s) => clamp(s + 2, -10, 18));
      }

      if (e.key === '-' || e.key === '_') {
        setManualOffset((s) => clamp(s - 2, -10, 18));
      }
    };

    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener('keydown', onKeyDown);
  }, [onClose, onNextGroup, onPrevGroup, pickerOpen]);

  const fontSize = useMemo(() => {
    const base =
      typeof baseFontSize === 'number'
        ? baseFontSize
        : uniformFontSize
        ? 36
        : getBaseFontSize(currentSlide?.kind);

    return clamp(base + manualOffset, 20, 56);
  }, [baseFontSize, uniformFontSize, currentSlide?.kind, manualOffset]);

  const lineHeight = Math.round(fontSize * 1.38);

  function getSlideLabel(slide: ProjectorSlide, index: number) {
    if (renderSlideLabel) return renderSlideLabel(slide, index);
    if (slide.title?.trim()) return slide.title;
    return `Slide ${index + 1}`;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.topMiniBtn}>
          <Ionicons name="close" size={18} color="#ffffff99" />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          {!!title && (
            <Text style={styles.topTitle} numberOfLines={1}>
              {title}
            </Text>
          )}
          {!!subtitle && (
            <Text style={styles.topSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.topActions}>
          {slides.length > 0 ? (
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={styles.topPickerBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.topPickerText}>{pickerLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s - 2, -10, 18))}
            style={styles.topMiniBtn}
          >
            <Text style={styles.control}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s + 2, -10, 18))}
            style={styles.topMiniBtn}
          >
            <Text style={styles.control}>A+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.slideWrap}>
        <TouchableOpacity
          style={styles.sideTap}
          onPress={prevSlide}
          disabled={!canPrevSlide}
          activeOpacity={0.9}
        />

        <View style={styles.slideContent}>
          <View style={styles.slideInner}>
            {currentSlide ? (
              <>
                {!!currentSlide.title && (
                  <Text style={styles.slideTitle}>{currentSlide.title}</Text>
                )}

                <Text
                  style={[
                    styles.slideText,
                    {
                      fontSize,
                      lineHeight,
                    },
                  ]}
                >
                  {currentSlide.content}
                </Text>
              </>
            ) : (
              <Text style={styles.emptyText}>Sem conteúdo para projetar</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.sideTap}
          onPress={nextSlide}
          disabled={!canNextSlide}
          activeOpacity={0.9}
        />
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={prevSlide}
          style={[styles.navBtn, !canPrevSlide && styles.navBtnDisabled]}
          disabled={!canPrevSlide}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={!canPrevSlide ? '#7c7c7c' : '#ffffffcc'}
          />
          <Text style={[styles.navText, !canPrevSlide && styles.navTextDisabled]}>
            Slide anterior
          </Text>
        </TouchableOpacity>

        <View style={styles.counterBlock}>
          <Text style={styles.counter}>
            Slide {slides.length ? slideIndex + 1 : 0} de {slides.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={nextSlide}
          style={[styles.navBtn, !canNextSlide && styles.navBtnDisabled]}
          disabled={!canNextSlide}
        >
          <Text style={[styles.navText, !canNextSlide && styles.navTextDisabled]}>
            Próximo slide
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={!canNextSlide ? '#7c7c7c' : '#ffffffcc'}
          />
        </TouchableOpacity>
      </View>

      {(onPrevGroup || onNextGroup) && (
        <View style={styles.groupNavBar}>
          <TouchableOpacity
            onPress={onPrevGroup}
            style={styles.groupNavBtn}
            disabled={!onPrevGroup}
          >
            <Ionicons
              name="play-skip-back"
              size={18}
              color={onPrevGroup ? '#ffffffaa' : '#666'}
            />
            <Text style={[styles.groupNavText, !onPrevGroup && styles.groupNavTextDisabled]}>
              {prevGroupLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNextGroup}
            style={styles.groupNavBtn}
            disabled={!onNextGroup}
          >
            <Text style={[styles.groupNavText, !onNextGroup && styles.groupNavTextDisabled]}>
              {nextGroupLabel}
            </Text>
            <Ionicons
              name="play-skip-forward"
              size={18}
              color={onNextGroup ? '#ffffffaa' : '#666'}
            />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Text style={styles.modalClose}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {slides.map((slide, index) => {
                const active = index === slideIndex;

                return (
                  <TouchableOpacity
                    key={slide.id}
                    style={[styles.modalItem, active && styles.modalItemActive]}
                    onPress={() => {
                      setSlideIndex(index);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, active && styles.modalItemTextActive]}>
                      {getSlideLabel(slide, index)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.72,
  },

  topMiniBtn: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  topPickerBtn: {
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  topPickerText: {
    color: '#ffffffcc',
    fontSize: 11,
    fontWeight: '700',
  },

  topCenter: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },

  topTitle: {
    color: '#ffffff99',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  topSubtitle: {
    marginTop: 1,
    color: '#7f7f7f',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  control: {
    color: '#ffffff99',
    fontSize: 11,
    fontWeight: '700',
  },

  slideWrap: {
    flex: 1,
    flexDirection: 'row',
  },

  sideTap: {
    width: 20,
  },

  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  slideInner: {
    width: '100%',
    transform: [{ translateY: -38 }],
  },

  slideTitle: {
    color: '#d8d8d8',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  slideText: {
    width: '100%',
    color: '#F8F8F8',
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  emptyText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },

  bottomBar: {
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    opacity: 0.78,
  },

  navBtn: {
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },

  navBtnDisabled: {
    opacity: 0.45,
  },

  navText: {
    marginLeft: 6,
    color: '#ffffffcc',
    fontSize: 12,
    fontWeight: '700',
  },

  navTextDisabled: {
    color: '#7c7c7c',
  },

  counterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  counter: {
    color: '#ffffff99',
    fontSize: 12,
    fontWeight: '600',
  },

  groupNavBar: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.72,
  },

  groupNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  groupNavText: {
    marginHorizontal: 6,
    color: '#ffffffaa',
    fontSize: 13,
    fontWeight: '600',
  },

  groupNavTextDisabled: {
    color: '#666',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },

  modalContent: {
    maxHeight: '72%',
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#222',
    overflow: 'hidden',
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  modalClose: {
    color: '#7db5ff',
    fontSize: 14,
    fontWeight: '700',
  },

  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1b1b',
  },

  modalItemActive: {
    backgroundColor: '#0F62FE22',
  },

  modalItemText: {
    color: '#ddd',
    fontSize: 14,
    fontWeight: '600',
  },

  modalItemTextActive: {
    color: '#fff',
  },
});