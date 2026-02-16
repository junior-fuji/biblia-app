import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import { AtlasEtapa, AtlasItem } from './types';
const supabase = getSupabaseOrThrow();

export async function fetchAtlasItems(): Promise<AtlasItem[]> {
  const { data, error } = await supabase
    .from('atlas_biblico')
    .select('*')
    .order('id')

  if (error) {
    console.error('Erro ao carregar Atlas:', error)
    throw error
  }

  return data ?? []
}

export async function fetchAtlasEtapas(atlasId: string): Promise<AtlasEtapa[]> {
  const { data, error } = await supabase
    .from('etapas_jornada')
    .select('*')
    .eq('atlas_id', atlasId)
    .order('ordem', { ascending: true })

  if (error) {
    console.error('Erro ao carregar etapas:', error)
    throw error
  }

  return data ?? []
}
