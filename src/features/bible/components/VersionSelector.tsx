import { getSupabaseOrNull } from '@/lib/supabaseClient';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useBibleStore } from '../state/bibleStore';

type BibleVersion = {
  id: string;
  code: string;
  name: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const FALLBACK_VERSIONS: BibleVersion[] = [
  { id: 'fallback-ara', code: 'ARA', name: 'Almeida Revista e Atualizada', sort_order: 1, is_active: true },
  { id: 'fallback-arc', code: 'ARC', name: 'Almeida Revista e Corrigida', sort_order: 2, is_active: true },
  { id: 'fallback-acf', code: 'ACF', name: 'Almeida Corrigida Fiel', sort_order: 3, is_active: true },
  { id: 'fallback-nvi', code: 'NVI', name: 'Nova Versão Internacional', sort_order: 4, is_active: true },
  { id: 'fallback-kja', code: 'KJA', name: 'King James Atualizada', sort_order: 5, is_active: true },
];

export default function VersionSelector() {
  const { versionCode, setVersionCode } = useBibleStore();

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const sb = getSupabaseOrNull();

        if (!sb) {
          if (!alive) return;
          setVersions(FALLBACK_VERSIONS);
          return;
        }

        const { data, error } = await sb
          .from('bible_versions')
          .select('id, code, name, sort_order, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!alive) return;

        if (error) {
          console.log('VERSION_SELECTOR_LOAD_ERROR', error);
          setVersions(FALLBACK_VERSIONS);
          return;
        }

        const parsed = Array.isArray(data) ? (data as BibleVersion[]) : [];
        setVersions(parsed.length ? parsed : FALLBACK_VERSIONS);
      } catch (error) {
        console.log('VERSION_SELECTOR_FATAL', error);
        if (!alive) return;
        setVersions(FALLBACK_VERSIONS);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo<BibleVersion | null>(() => {
    if (!versions.length) return null;
    return versions.find((v) => v.code === versionCode) ?? versions[0] ?? null;
  }, [versions, versionCode]);

  useEffect(() => {
    if (!selected) return;

    if (!versionCode || versionCode !== selected.code) {
      setVersionCode(selected.code);
    }
  }, [selected, versionCode, setVersionCode]);

  if (!selected) return null;

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 14,
        paddingTop: Platform.OS === 'web' ? 10 : 12,
        paddingBottom: 10,
        zIndex: 50,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: '#F2F4F7',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontWeight: '900', color: '#111' }}>{selected.code}</Text>
        <Text style={{ color: '#666', fontWeight: '700', marginLeft: 8 }}>
          {open ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {open && (
        <View
          style={{
            marginTop: 10,
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#eee',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {versions.map((v) => {
            const active = v.code === selected.code;

            return (
              <TouchableOpacity
                key={v.id}
                onPress={() => {
                  setVersionCode(v.code);
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: active ? '#E8F0FF' : '#fff',
                }}
              >
                <Text style={{ fontWeight: '900', color: '#111' }}>
                  {v.code}{' '}
                  <Text style={{ fontWeight: '700', color: '#666' }}>
                    {v.name ? `— ${v.name}` : ''}
                  </Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}