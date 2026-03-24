import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
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
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getBaseFontSize(kind?: ProjectorSlide['kind']) {
  if (kind === 'verse') return 34;
  if (kind === 'stanza') return 30;
  if (kind === 'chorus') return 30;
  return 32;
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
}: Props) {
  const [manualOffset, setManualOffset] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const maxIndex = Math.max(slides.length - 1, 0);
    setSlideIndex(clamp(initialIndex, 0, maxIndex));
  }, [initialIndex, slides]);

  const currentSlide = slides[slideIndex] ?? null;
  const canPrevSlide = slideIndex > 0;
  const canNextSlide = slideIndex < slides.length - 1;

  const prevSlide = useCallback(() => {
    setSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const nextSlide = useCallback(() => {
    setSlideIndex((prev) => Math.min(prev + 1, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    setManualOffset(0);
  }, [currentSlide?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const win = globalThis?.window;
    if (!win) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;

      if (key === 'ArrowRight' || key === ' ' || key === 'Enter') {
        e.preventDefault?.();
        nextSlide();
        return;
      }

      if (key === 'ArrowLeft') {
        e.preventDefault?.();
        prevSlide();
        return;
      }

      if (key === 'PageDown' && onNextGroup) {
        e.preventDefault?.();
        onNextGroup();
        return;
      }

      if (key === 'PageUp' && onPrevGroup) {
        e.preventDefault?.();
        onPrevGroup();
        return;
      }

      if (key === 'Escape') {
        e.preventDefault?.();
        onClose();
        return;
      }

      if (key === '+' || key === '=') {
        e.preventDefault?.();
        setManualOffset((s) => clamp(s + 2, -10, 10));
        return;
      }

      if (key === '-' || key === '_') {
        e.preventDefault?.();
        setManualOffset((s) => clamp(s - 2, -10, 10));
      }
    };

    win.addEventListener('keydown', onKeyDown);
    return () => win.removeEventListener('keydown', onKeyDown);
  }, [nextSlide, onClose, onNextGroup, onPrevGroup, prevSlide]);

  const fontSize = useMemo(() => {
    const base = getBaseFontSize(currentSlide?.kind);
    return clamp(base + manualOffset, 20, 44);
  }, [currentSlide?.kind, manualOffset]);

  const lineHeight = Math.round(fontSize * 1.4);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.topMiniBtn} activeOpacity={0.8}>
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
          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s - 2, -10, 10))}
            style={styles.topMiniBtn}
            activeOpacity={0.8}
          >
            <Text style={styles.control}>A-</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setManualOffset((s) => clamp(s + 2, -10, 10))}
            style={styles.topMiniBtn}
            activeOpacity={0.8}
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
          activeOpacity={0.8}
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
          activeOpacity={0.8}
        >
          <Text style={[styles.navTextRight, !canNextSlide && styles.navTextDisabled]}>
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
            style={[styles.groupNavBtn, !onPrevGroup && styles.groupNavBtnDisabled]}
            disabled={!onPrevGroup}
            activeOpacity={0.8}
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
            style={[styles.groupNavBtn, !onNextGroup && styles.groupNavBtnDisabled]}
            disabled={!onNextGroup}
            activeOpacity={0.8}
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
    width: 32,
  },

  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
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
    fontWeight: '500',
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
    minWidth: 140,
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

  navTextRight: {
    marginRight: 6,
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

  groupNavBtnDisabled: {
    opacity: 0.55,
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
});