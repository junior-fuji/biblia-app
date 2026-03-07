import * as Localization from 'expo-localization';

export function getDeviceLanguage(): string {
  const locale = Localization.getLocales()?.[0]?.languageCode;

  if (!locale) return 'pt';

  return locale.toLowerCase();
}

export function getDefaultBibleVersion(): string {
  const lang = getDeviceLanguage();

  if (lang === 'pt') return 'ARA'; // Português
  if (lang === 'es') return 'RV60'; // Espanhol
  if (lang === 'ja') return 'JLB'; // Japonês
  if (lang === 'en') return 'ESV'; // Inglês

  return 'ARA'; // fallback
}