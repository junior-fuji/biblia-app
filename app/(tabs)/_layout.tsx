import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          // Altura ajustada para caber os 6 itens confortavelmente
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 5,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 9, 
          fontWeight: '600',
          marginBottom: 5,
        },
      }}
    >
      {/* 1. INÍCIO */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />

      {/* 2. PLANO */}
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plano',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />

      {/* 3. DIÁRIO (explore.tsx) */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Diário',
          tabBarIcon: ({ color, size }) => <Ionicons name="journal" size={24} color={color} />,
        }}
      />

      {/* 4. BÍBLIA - CORREÇÃO AQUI */}
      {/* Apontamos diretamente para 'read/index' que é como o sistema vê */}
      <Tabs.Screen
        name="read/index"
        options={{
          title: 'Bíblia',
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={24} color={color} />,
        }}
      />

      {/* 5. DICIONÁRIO - CORREÇÃO AQUI */}
      {/* Apontamos diretamente para 'atlas/index' */}
      <Tabs.Screen
        name="atlas/index"
        options={{
          title: 'Dicionário',
          tabBarIcon: ({ color, size }) => <Ionicons name="library" size={24} color={color} />,
        }}
      />

      {/* 6. ESTUDOS */}
      <Tabs.Screen
        name="study"
        options={{
          title: 'Estudos',
          tabBarIcon: ({ color, size }) => <Ionicons name="create" size={24} color={color} />,
        }}
      />

      {/* --- ITENS ESCONDIDOS --- */}
      
      {/* Também garantimos que a rota da pasta 'read' (se existir solta) fique oculta */}
      <Tabs.Screen name="read" options={{ href: null }} />
      <Tabs.Screen name="atlas" options={{ href: null }} />

      {/* Esconde a leitura interna do livro */}
      <Tabs.Screen 
        name="read/[book]/index" 
        options={{ 
          href: null,
          tabBarStyle: { display: 'none' } 
        }} 
      />

    </Tabs>
  );
}