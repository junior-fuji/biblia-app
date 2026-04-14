import { AuthProvider } from '@/src/providers/AuthProvider';
import { SettingsProvider } from '@/src/providers/SettingsProvider';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SettingsProvider>
    </AuthProvider>
  );
}