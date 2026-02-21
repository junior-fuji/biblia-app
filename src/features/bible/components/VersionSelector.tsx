import { getSupabaseOrNull } from "@/lib/supabaseClient";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import { useBibleStore } from "../state/bibleStore";

type BibleVersion = {
  id: string;
  code: string;
  name: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export default function VersionSelector() {
  const { versionCode, setVersionCode } = useBibleStore();

  const [versions, setVersions] = useState<BibleVersion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      const sb = getSupabaseOrNull();
      if (!sb) return;

      const { data, error } = await sb
        .from("bible_versions")
        .select("id, code, name, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (!alive) return;
      if (!error) setVersions((data as any) ?? []);
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const selected = useMemo(
    () => versions.find((v) => v.code === versionCode) ?? versions[0],
    [versions, versionCode]
  );

  useEffect(() => {
    // se não tiver selecionada ainda, pega a primeira (evita hardcode ARA)
    if (!selected) return;
    if (!versionCode) setVersionCode(selected.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.code]);

  if (!selected) return null;

  return (
    <View
      style={{
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        paddingHorizontal: 14,
        paddingTop: Platform.OS === "web" ? 10 : 12,
        paddingBottom: 10,
        zIndex: 50,
      }}
    >
      <TouchableOpacity
        onPress={() => setOpen((p) => !p)}
        activeOpacity={0.85}
        style={{
          alignSelf: "flex-start",
          backgroundColor: "#F2F4F7",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "900", color: "#111" }}>
          {selected.code}
        </Text>
        <Text style={{ color: "#666", fontWeight: "700" }}>
          {open ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>

      {open && (
        <View
          style={{
            marginTop: 10,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#eee",
            borderRadius: 14,
            overflow: "hidden",
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
                  backgroundColor: active ? "#E8F0FF" : "#fff",
                }}
              >
                <Text style={{ fontWeight: "900", color: "#111" }}>
                  {v.code}{" "}
                  <Text style={{ fontWeight: "700", color: "#666" }}>
                    {v.name ? `— ${v.name}` : ""}
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