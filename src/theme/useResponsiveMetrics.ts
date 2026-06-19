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
  const isLargeDesktop = width >= 1440;
  const isUltraWide = width >= 1900;
  const isImacSize = width >= 2200 || height >= 1200;
  const isPresentationSize = width >= 1400 || height >= 900;

  const homeMaxContentWidth = isImacSize
    ? 1760
    : isUltraWide
      ? 1600
      : isLargeDesktop
        ? 1440
        : isDesktop
          ? 1240
          : undefined;

  const homePagePadding = isImacSize
    ? 56
    : isUltraWide
      ? 48
      : isLargeDesktop
        ? 40
        : isDesktop
          ? 32
          : isTablet
            ? 26
            : 20;

  const homeCardIconBoxSize = isImacSize
    ? 96
    : isUltraWide
      ? 88
      : isLargeDesktop
        ? 78
        : isDesktop
          ? 66
          : isTablet
            ? 58
            : 50;

  const homeCardIconSize = isImacSize
    ? 46
    : isUltraWide
      ? 42
      : isLargeDesktop
        ? 38
        : isDesktop
          ? 32
          : isTablet
            ? 28
            : 24;

  const homeCardMinHeight = isImacSize
    ? 220
    : isUltraWide
      ? 200
      : isLargeDesktop
        ? 180
        : isDesktop
          ? 154
          : 130;

  const homeCardPadding = isImacSize
    ? 28
    : isUltraWide
      ? 26
      : isLargeDesktop
        ? 22
        : isDesktop
          ? 18
          : 16;

  const homeCardTitleFontSize = isImacSize
    ? 24
    : isUltraWide
      ? 22
      : isLargeDesktop
        ? 20
        : isDesktop
          ? 18
          : 16;

  const homeCardSubtitleFontSize = isImacSize
    ? 16
    : isUltraWide
      ? 15
      : isLargeDesktop
        ? 14
        : 12;

  const homeGreetingFontSize = isImacSize
    ? 38
    : isUltraWide
      ? 34
      : isLargeDesktop
        ? 32
        : isDesktop
          ? 28
          : 26;

  const homeSubGreetingFontSize = isImacSize
    ? 18
    : isUltraWide
      ? 17
      : isLargeDesktop
        ? 16
        : 14;

  const homeSectionTitleFontSize = isImacSize
    ? 24
    : isUltraWide
      ? 22
      : isLargeDesktop
        ? 20
        : 18;

  const homeQuickTitleFontSize = isImacSize
    ? 22
    : isUltraWide
      ? 20
      : isLargeDesktop
        ? 18
        : 16;

  const homeQuickInputFontSize = isImacSize
    ? 19
    : isUltraWide
      ? 18
      : 16;

  const homeAvatarSize = isImacSize
    ? 64
    : isUltraWide
      ? 58
      : isLargeDesktop
        ? 52
        : 46;

  const homeHeroMinHeight = isImacSize
    ? 280
    : isUltraWide
      ? 250
      : isLargeDesktop
        ? 230
        : isDesktop
          ? 210
          : undefined;

  const tabIconSize = isImacSize
    ? 30
    : isUltraWide
      ? 28
      : isLargeDesktop
        ? 26
        : 22;

  const tabLabelFontSize = isImacSize
    ? 14
    : isUltraWide
      ? 13
      : isLargeDesktop
        ? 12
        : 10;

  const tabBarHeight = isImacSize
    ? 78
    : isUltraWide
      ? 72
      : isLargeDesktop
        ? 68
        : 62;

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
    isUltraWide,
    isImacSize,
    isPresentationSize,

    homeMaxContentWidth,
    homePagePadding,
    homeCardIconBoxSize,
    homeCardIconSize,
    homeCardMinHeight,
    homeCardPadding,
    homeCardTitleFontSize,
    homeCardSubtitleFontSize,
    homeGreetingFontSize,
    homeSubGreetingFontSize,
    homeSectionTitleFontSize,
    homeQuickTitleFontSize,
    homeQuickInputFontSize,
    homeAvatarSize,
    homeHeroMinHeight,

    tabIconSize,
    tabLabelFontSize,
    tabBarHeight,

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