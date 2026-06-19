import { Platform, useWindowDimensions } from 'react-native';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useResponsiveMetrics() {
  const { width, height } = useWindowDimensions();

  const isWeb = Platform.OS === 'web';
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;
  const isLargeDesktop = width >= 1500;
  const isPresentationSize = width >= 1400 || height >= 900;

  const projectorFontStep = isLargeDesktop ? 6 : isDesktop ? 5 : 4;
  const projectorOffsetStep = isLargeDesktop ? 32 : isDesktop ? 24 : 16;

  const projectorOffsetLimit = Math.round(
    height * (isLargeDesktop ? 0.46 : isDesktop ? 0.38 : 0.28),
  );

  const harpaMinFontSize = isLargeDesktop ? 34 : isDesktop ? 30 : 24;
  const harpaBaseFontSize = isLargeDesktop ? 62 : isDesktop ? 50 : 38;
  const harpaMaxFontSize = isLargeDesktop ? 136 : isDesktop ? 104 : 78;

  const bibleMinFontSize = isLargeDesktop ? 26 : isDesktop ? 22 : 20;
  const bibleBaseFontSize = isLargeDesktop ? 48 : isDesktop ? 42 : 36;
  const bibleMaxFontSize = isLargeDesktop ? 96 : isDesktop ? 78 : 60;

  return {
    width,
    height,

    isWeb,
    isPhone,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isPresentationSize,

    projectorFontStep,
    projectorOffsetStep,
    projectorOffsetLimit,

    harpaMinFontSize,
    harpaBaseFontSize,
    harpaMaxFontSize,

    bibleMinFontSize,
    bibleBaseFontSize,
    bibleMaxFontSize,

    clamp,
  };
}