import { Stack } from 'expo-router';

export default function ReadLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="[book]/index"
        options={{
          headerShown: true,
        }}
      />
    </Stack>
  );
}