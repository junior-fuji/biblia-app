import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { invalidateBibleVersionsCache } from "../../src/features/bible/api/bibleVersions.cache"; // caminho relativo (sem @)

export default function TabLayout() {
  useEffect(() => {
    invalidateBibleVersionsCache().catch(() => {});
  }, []);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#007AFF" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarLabel: "Início",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="diary"
        options={{
          title: "Diário",
          tabBarLabel: "Diário",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="studies"
        options={{
          title: "Estudos",
          tabBarLabel: "Estudos",
          tabBarIcon: ({ color, size }) => <Ionicons name="create-outline" color={color} size={size} />,
        }}
      />

      {/* ✅ Aqui é o certo */}
      <Tabs.Screen
        name="read"
        options={{
          title: "Bíblia",
          tabBarLabel: "Bíblia",
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="dictionary"
        options={{
          title: "Dicionário",
          tabBarLabel: "Dicionário",
          tabBarIcon: ({ color, size }) => <Ionicons name="library-outline" color={color} size={size} />,
        }}
      />

      <Tabs.Screen
        name="plan"
        options={{
          title: "Plano",
          tabBarLabel: "Plano",
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}