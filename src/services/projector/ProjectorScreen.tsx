import { useSettings } from '@/src/providers/SettingsProvider';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  const { settings } = useSettings();

  const [manualOffset, setManualOffset] = useState(0);
  const [slideIndex, setSlideIndex] = useState(initialIndex);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isLightTheme = settings.projectorTheme === 'light';

  useEffect(() => {
    setSlideIndex(clamp(initialIndex, 0, Math.max(slides.length - 1, 0)));
  }, [initialIndex, slides.length]);

  const currentSlide = slides[slideIndex] ?? null;
  const canPrevSlide = slideIndex > 0;
  const canNextSlide = slideIndex < slides.length - 1;

  const prevSlide = useCallback(() => {
    setSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => Math.min(prev + 1, slides.length - 1));
  }, [slides.length]);

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
  }, [nextSlide, onClose, onNextGroup, onPrevGroup, pickerOpen, prevSlide]);

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

  const colors = useMemo(
    () => ({
      bg: isLightTheme ? '#FFFFFF' : '#000000',
      panel: isLightTheme ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
      panelBorder: isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
      mainText: isLightTheme ? '#111111' : '#F8F8F8',
      secondaryText: isLightTheme ? '#374151' : '#d8d8d8',
      mutedText: isLightTheme ? '#6B7280' : '#ffffff99',
      subtitleText: isLightTheme ? '#6B7280' : '#7f7f7f',
      accentText: isLightTheme ? '#1D4ED8' : '#7db5ff',
      modalBg: isLightTheme ? '#FFFFFF' : '#111111',
      modalBorder: isLightTheme ? '#E5E7EB' : '#222222',
      modalOverlay: isLightTheme ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.55)',
      modalItemBorder: isLightTheme ? '#F2F4F7' : '#1b1b1b',
      activeItemBg: isLightTheme ? '#DBEAFE' : '#0F62FE22',
      buttonText: isLightTheme ? '#111111' : '#ffffffcc',
      buttonDisabled: '#7c7c7c',
    }),
    [isLightTheme]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar hidden />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.topMiniBtn}>
          <Ionicons name="close" size={18} color={colors.mutedText} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          {!!title && (
            <Text style={[styles.topTitle, { color: colors.mutedText }]} numberOfLines={1}>
              {title}
            </Text>
          )}
          {!!subtitle && (
            <Text style={[styles.topSubtitle, { color: colors.subtitleText }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.topActions}>
          {slides.length > 0 ? (
            <TouchableOpacity
              onPress={() => setPickerOpen(true)}
              style={[styles.topPickerBtn, { backgroundColor: colors.panel }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.topPickerText, { color: colors.buttonText }]}>{pickerLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s - 2, -10, 18))}
            style={styles.topMiniBtn}
          >
            <Text style={[styles.control, { color: colors.mutedText }]}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s + 2, -10, 18))}
            style={styles.topMiniBtn}
          >
            <Text style={[styles.control, { color: colors.mutedText }]}>A+</Text>
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
                  <Text style={[styles.slideTitle, { color: colors.secondaryText }]}>
                    {currentSlide.title}
                  </Text>
                )}

                <Text
                  style={[
                    styles.slideText,
                    {
                      fontSize,
                      lineHeight,
                      color: colors.mainText,
                      fontWeight: isLightTheme ? '700' : '600',
                    },
                  ]}
                >
                  {currentSlide.content}
                </Text>
              </>
            ) : (
              <Text style={[styles.emptyText, { color: colors.mainText }]}>Sem conteúdo para projetar</Text>
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
          style={[
            styles.navBtn,
            { backgroundColor: colors.panel, borderColor: colors.panelBorder },
            !canPrevSlide && styles.navBtnDisabled,
          ]}
          disabled={!canPrevSlide}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={!canPrevSlide ? colors.buttonDisabled : colors.buttonText}
          />
          <Text style={[styles.navText, { color: !canPrevSlide ? colors.buttonDisabled : colors.buttonText }]}>
            Slide anterior
          </Text>
        </TouchableOpacity>

        <View style={styles.counterBlock}>
          <Text style={[styles.counter, { color: colors.mutedText }]}>
            Slide {slides.length ? slideIndex + 1 : 0} de {slides.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={nextSlide}
          style={[
            styles.navBtn,
            { backgroundColor: colors.panel, borderColor: colors.panelBorder },
            !canNextSlide && styles.navBtnDisabled,
          ]}
          disabled={!canNextSlide}
        >
          <Text style={[styles.navText, { color: !canNextSlide ? colors.buttonDisabled : colors.buttonText }]}>
            Próximo slide
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={!canNextSlide ? colors.buttonDisabled : colors.buttonText}
          />
        </TouchableOpacity>
      </View>

      {(onPrevGroup || onNextGroup) && (
        <View style={styles.groupNavBar}>
          <TouchableOpacity onPress={onPrevGroup} style={styles.groupNavBtn} disabled={!onPrevGroup}>
            <Ionicons
              name="play-skip-back"
              size={18}
              color={onPrevGroup ? colors.buttonText : colors.buttonDisabled}
            />
            <Text
              style={[
                styles.groupNavText,
                { color: onPrevGroup ? colors.buttonText : colors.buttonDisabled },
              ]}
            >
              {prevGroupLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onNextGroup} style={styles.groupNavBtn} disabled={!onNextGroup}>
            <Text
              style={[
                styles.groupNavText,
                { color: onNextGroup ? colors.buttonText : colors.buttonDisabled },
              ]}
            >
              {nextGroupLabel}
            </Text>
            <Ionicons
              name="play-skip-forward"
              size={18}
              color={onNextGroup ? colors.buttonText : colors.buttonDisabled}
            />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.modalBg, borderColor: colors.modalBorder }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.modalBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.mainText }]}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)}>
                <Text style={[styles.modalClose, { color: colors.accentText }]}>Fechar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {slides.map((slide, index) => {
                const active = index === slideIndex;

                return (
                  <TouchableOpacity
                    key={slide.id}
                    style={[
                      styles.modalItem,
                      { borderBottomColor: colors.modalItemBorder },
                      active && { backgroundColor: colors.activeItemBg },
                    ]}
                    onPress={() => {
                      setSlideIndex(index);
                      setPickerOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        { color: colors.secondaryText },
                        active && { color: colors.mainText },
                      ]}
                    >
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
  },

  topBar: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.9,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },

  topPickerText: {
    fontSize: 11,
    fontWeight: '700',
  },

  topCenter: {
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },

  topTitle: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  topSubtitle: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  control: {
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
    transform: [{ translateY: -110 }],
  },

  slideTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  slideText: {
    width: '100%',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  emptyText: {
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
    opacity: 0.95,
  },

  navBtn: {
    minWidth: 118,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },

  navBtnDisabled: {
    opacity: 0.45,
  },

  navText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
  },

  counterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },

  counter: {
    fontSize: 12,
    fontWeight: '600',
  },

  groupNavBar: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    opacity: 0.95,
  },

  groupNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },

  groupNavText: {
    marginHorizontal: 6,
    fontSize: 13,
    fontWeight: '600',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  modalContent: {
    maxHeight: '72%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },

  modalClose: {
    fontSize: 14,
    fontWeight: '700',
  },

  modalItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});