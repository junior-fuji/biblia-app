import { Stack } from "expo-router";
import React from "react";
import VersionSelector from "../../../src/features/bible/components/VersionSelector"; // caminho real (sem @)

export default function ReadLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Bíblia",
          headerTitle: () => <VersionSelector />,
        }}
      />
      <Stack.Screen
        name="[book]/index"
        options={{
          headerTitle: () => <VersionSelector />,
        }}
      />
    </Stack>
  );
}