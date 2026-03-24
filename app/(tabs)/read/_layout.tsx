import { Stack } from 'expo-router';

export default function ReadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}