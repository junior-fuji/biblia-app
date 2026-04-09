import { getSupabaseOrThrow } from '@/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildContentFromEditor } from './content';
import type { Study, StudyInsertInput, StudyUpdateInput } from './types';

export const LOCAL_STUDIES_KEY = 'LOCAL_SAVED_NOTES_V1';

export function toStudyId(studyId: string | number) {
  return String(studyId);
}

export function mapSavedNoteRowToStudy(item: any): Study {
  return {
    id: item.id,
    title: item.title || 'Sem Título',
    content: item.content ?? null,
    reference: item.reference ?? null,
    observation: null,
    application: null,
    prayer: null,
    created_at: item.created_at,
    user_id: item.user_id ?? null,
    client_id: item.client_id ?? null,
    source: 'supabase',
  };
}

export function generateLocalStudyId(existing: Study[]) {
  const maxId = existing.reduce((acc, item) => {
    const value = Number(item.id);
    return Number.isFinite(value) ? Math.max(acc, value) : acc;
  }, 0);

  return String(maxId + 1);
}

export async function getLocalStudies(): Promise<Study[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_STUDIES_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      ...item,
      source: 'local' as const,
    })) as Study[];
  } catch (error) {
    console.log('GET_LOCAL_STUDIES_ERROR', error);
    return [];
  }
}

export async function saveLocalStudies(studies: Study[]) {
  const sanitized = studies.map(({ source, ...rest }) => rest);
  await AsyncStorage.setItem(LOCAL_STUDIES_KEY, JSON.stringify(sanitized));
}

export async function fetchStudiesForUser(userId: string | null): Promise<Study[]> {
  if (!userId) {
    const local = await getLocalStudies();
    return [...local].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });
  }

  const sb = getSupabaseOrThrow();

  const { data, error } = await sb
    .from('saved_notes')
    .select('id, created_at, title, reference, content, user_id, client_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.log('FETCH_STUDIES_FOR_USER_ERROR', error);
    throw error;
  }

  return (data ?? []).map(mapSavedNoteRowToStudy);
}

export async function insertStudyRemote(input: StudyInsertInput): Promise<Study> {
  const sb = getSupabaseOrThrow();

  const { data, error } = await sb
    .from('saved_notes')
    .insert({
      user_id: input.user_id,
      title: input.title,
      reference: input.reference,
      content: input.content,
      client_id: input.client_id ?? null,
    })
    .select('id, created_at, title, reference, content, user_id, client_id')
    .single();

  if (error) {
    console.log('INSERT_STUDY_REMOTE_ERROR', error);
    throw error;
  }

  return mapSavedNoteRowToStudy(data);
}

export async function updateStudyRemote(params: {
  studyId: string | number;
  userId: string;
  input: StudyUpdateInput;
}): Promise<Study> {
  const sb = getSupabaseOrThrow();

  const numericId = Number(params.studyId);
  if (!Number.isFinite(numericId)) {
    throw new Error('ID de estudo inválido para atualização.');
  }

  const { data, error } = await sb
    .from('saved_notes')
    .update({
      title: params.input.title,
      reference: params.input.reference,
      content: params.input.content,
    })
    .eq('id', numericId)
    .eq('user_id', params.userId)
    .select('id, created_at, title, reference, content, user_id, client_id')
    .single();

  if (error) {
    console.log('UPDATE_STUDY_REMOTE_ERROR', error);
    throw error;
  }

  return mapSavedNoteRowToStudy(data);
}

export async function deleteStudyRemote(params: {
  studyId: string | number;
  userId: string;
}): Promise<void> {
  const sb = getSupabaseOrThrow();

  const numericId = Number(params.studyId);
  if (!Number.isFinite(numericId)) {
    throw new Error('ID de estudo inválido para exclusão.');
  }

  const { error } = await sb
    .from('saved_notes')
    .delete()
    .eq('id', numericId)
    .eq('user_id', params.userId);

  if (error) {
    console.log('DELETE_STUDY_REMOTE_ERROR', error);
    throw error;
  }
}

export async function updateStudyLocal(params: {
  study: Study;
  title: string;
  reference: string | null;
  fields: {
    theme: string;
    history: string;
    exegesis: string;
    theology: string;
    application: string;
  };
}): Promise<Study[]> {
  const local = await getLocalStudies();

  const next = local.map((item) => {
    if (String(item.id) !== String(params.study.id)) {
      return item;
    }

    return {
      ...item,
      title: params.title,
      reference: params.reference,
      content: buildContentFromEditor({
        title: params.title,
        reference: params.reference,
        existingEnvelope: null,
        fields: params.fields,
      }),
    };
  });

  await saveLocalStudies(next);
  return next;
}

export async function deleteStudyLocal(studyId: string | number): Promise<Study[]> {
  const local = await getLocalStudies();
  const next = local.filter((item) => String(item.id) !== String(studyId));
  await saveLocalStudies(next);
  return next;
}