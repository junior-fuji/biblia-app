import { getSupabaseOrNull } from '@/lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type StudySource = 'supabase' | 'local';

export type SavedStudy = {
  id: string | number;
  title: string;
  content: string | null;
  reference: string | null;
  created_at: string;
  user_id?: string | null;
  client_id?: string | null;
  source?: StudySource;
  pendingSync?: boolean;
};

export type SupabaseStudyRow = {
  id: string | number;
  created_at: string | null;
  title: string | null;
  reference: string | null;
  content: string | null;
  user_id: string | null;
  client_id: string | null;
};

export type SaveStudyInput = {
  id?: string | number | null;
  title: string;
  content?: string | null;
  reference?: string | null;
  created_at?: string | null;
  client_id?: string | null;
};

export type FetchStudiesResult = {
  studies: SavedStudy[];
  source: StudySource;
};

export type SaveStudyResult = {
  study: SavedStudy;
  source: StudySource;
};

const LOCAL_STORAGE_PREFIX = 'LOCAL_SAVED_NOTES_V1';

function nowIso() {
  return new Date().toISOString();
}

function toStudyId(id: string | number) {
  return String(id);
}

function getLocalStorageKey(userId: string | null) {
  return `${LOCAL_STORAGE_PREFIX}:${userId ?? 'anonymous'}`;
}

function generateLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function generateClientId() {
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isLocalId(id: string | number | null | undefined) {
  return typeof id === 'string' && id.startsWith('local-');
}

function sortStudies(studies: SavedStudy[]) {
  return [...studies].sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return tb - ta;
  });
}

function normalizeTitle(title: string | null | undefined) {
  const clean = String(title ?? '').trim();
  return clean || 'Sem Título';
}

function normalizeContent(content: string | null | undefined) {
  if (typeof content !== 'string') {
    return null;
  }

  return content;
}

function normalizeReference(reference: string | null | undefined) {
  const clean = String(reference ?? '').trim();
  return clean || null;
}

function mapSupabaseStudy(row: SupabaseStudyRow): SavedStudy {
  return {
    id: row.id,
    title: normalizeTitle(row.title),
    content: normalizeContent(row.content),
    reference: normalizeReference(row.reference),
    created_at: row.created_at || nowIso(),
    user_id: row.user_id ?? null,
    client_id: row.client_id ?? null,
    source: 'supabase',
    pendingSync: false,
  };
}

function normalizeLocalStudy(item: Partial<SavedStudy>): SavedStudy {
  return {
    id: item.id ?? generateLocalId(),
    title: normalizeTitle(item.title),
    content: normalizeContent(item.content),
    reference: normalizeReference(item.reference),
    created_at: item.created_at || nowIso(),
    user_id: item.user_id ?? null,
    client_id: item.client_id ?? generateClientId(),
    source: 'local',
    pendingSync: item.pendingSync ?? true,
  };
}

function hasSameIdentity(a: SavedStudy, b: SavedStudy) {
  if (toStudyId(a.id) === toStudyId(b.id)) {
    return true;
  }

  if (a.client_id && b.client_id && a.client_id === b.client_id) {
    return true;
  }

  return false;
}

function mergeStudies(remoteStudies: SavedStudy[], localStudies: SavedStudy[]) {
  const unsyncedLocalStudies = localStudies.filter((localStudy) => {
    const alreadyExistsRemotely = remoteStudies.some((remoteStudy) =>
      hasSameIdentity(remoteStudy, localStudy),
    );

    return !alreadyExistsRemotely && localStudy.pendingSync;
  });

  return sortStudies([...remoteStudies, ...unsyncedLocalStudies]);
}

export async function readLocalStudies(
  userId: string | null,
): Promise<SavedStudy[]> {
  try {
    const raw = await AsyncStorage.getItem(getLocalStorageKey(userId));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return sortStudies(parsed.map((item) => normalizeLocalStudy(item)));
  } catch (error) {
    console.log('READ_LOCAL_STUDIES_ERROR', error);
    return [];
  }
}

export async function writeLocalStudies(
  userId: string | null,
  studies: SavedStudy[],
): Promise<void> {
  const normalized = sortStudies(studies).map((study) => ({
    id: study.id,
    title: normalizeTitle(study.title),
    content: normalizeContent(study.content),
    reference: normalizeReference(study.reference),
    created_at: study.created_at || nowIso(),
    user_id: study.user_id ?? userId,
    client_id: study.client_id ?? generateClientId(),
    source: study.source ?? 'local',
    pendingSync: study.pendingSync ?? study.source !== 'supabase',
  }));

  await AsyncStorage.setItem(
    getLocalStorageKey(userId),
    JSON.stringify(normalized),
  );
}

export async function fetchStudies(
  userId: string | null,
): Promise<FetchStudiesResult> {
  const localStudies = await readLocalStudies(userId);

  if (!userId) {
    return {
      studies: localStudies,
      source: 'local',
    };
  }

  const sb = getSupabaseOrNull();

  if (!sb) {
    return {
      studies: localStudies,
      source: 'local',
    };
  }

  try {
    const { data, error } = await sb
      .from('saved_notes')
      .select('id, created_at, title, reference, content, user_id, client_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log('FETCH_STUDIES_SUPABASE_ERROR', error);

      return {
        studies: localStudies,
        source: 'local',
      };
    }

    const remoteStudies = sortStudies(
      (data ?? []).map((row) => mapSupabaseStudy(row as SupabaseStudyRow)),
    );

    const mergedStudies = mergeStudies(remoteStudies, localStudies);

    await writeLocalStudies(userId, mergedStudies);

    return {
      studies: mergedStudies,
      source: 'supabase',
    };
  } catch (error) {
    console.log('FETCH_STUDIES_FATAL', error);

    return {
      studies: localStudies,
      source: 'local',
    };
  }
}

async function saveStudyLocally(
  userId: string | null,
  input: SaveStudyInput,
): Promise<SaveStudyResult> {
  const localStudies = await readLocalStudies(userId);

  const study: SavedStudy = {
    id: input.id ?? generateLocalId(),
    title: normalizeTitle(input.title),
    content: normalizeContent(input.content),
    reference: normalizeReference(input.reference),
    created_at: input.created_at || nowIso(),
    user_id: userId,
    client_id: input.client_id ?? generateClientId(),
    source: 'local',
    pendingSync: true,
  };

  const nextStudies = sortStudies([
    study,
    ...localStudies.filter(
      (item) =>
        toStudyId(item.id) !== toStudyId(study.id) &&
        (!study.client_id || item.client_id !== study.client_id),
    ),
  ]);

  await writeLocalStudies(userId, nextStudies);

  return {
    study,
    source: 'local',
  };
}

async function insertRemoteStudy(params: {
  userId: string;
  input: SaveStudyInput;
}) {
  const { userId, input } = params;
  const sb = getSupabaseOrNull();

  if (!sb) {
    return {
      data: null,
      error: new Error('Supabase não configurado.'),
    };
  }

  return sb
    .from('saved_notes')
    .insert({
      user_id: userId,
      title: normalizeTitle(input.title),
      content: normalizeContent(input.content),
      reference: normalizeReference(input.reference),
      client_id: input.client_id ?? generateClientId(),
    })
    .select('id, created_at, title, reference, content, user_id, client_id')
    .single();
}

async function updateRemoteStudy(params: {
  userId: string;
  input: SaveStudyInput;
}) {
  const { userId, input } = params;
  const sb = getSupabaseOrNull();

  if (!sb) {
    return {
      data: null,
      error: new Error('Supabase não configurado.'),
    };
  }

  if (!input.id || isLocalId(input.id)) {
    return {
      data: null,
      error: null,
    };
  }

  return sb
    .from('saved_notes')
    .update({
      title: normalizeTitle(input.title),
      content: normalizeContent(input.content),
      reference: normalizeReference(input.reference),
      client_id: input.client_id ?? null,
    })
    .eq('id', input.id)
    .eq('user_id', userId)
    .select('id, created_at, title, reference, content, user_id, client_id')
    .maybeSingle();
}

export async function saveStudy(
  userId: string | null,
  input: SaveStudyInput,
): Promise<SaveStudyResult> {
  if (!normalizeTitle(input.title)) {
    throw new Error('Informe um título para o estudo.');
  }

  if (!userId) {
    return saveStudyLocally(null, input);
  }

  const sb = getSupabaseOrNull();

  if (!sb) {
    return saveStudyLocally(userId, input);
  }

  try {
    const shouldTryUpdate = Boolean(input.id && !isLocalId(input.id));

    if (shouldTryUpdate) {
      const { data, error } = await updateRemoteStudy({
        userId,
        input,
      });

      if (error) {
        console.log('UPDATE_STUDY_SUPABASE_ERROR', error);
        return saveStudyLocally(userId, input);
      }

      if (data) {
        const savedStudy = mapSupabaseStudy(data as SupabaseStudyRow);
        const localStudies = await readLocalStudies(userId);

        const nextStudies = sortStudies([
          savedStudy,
          ...localStudies.filter(
            (study) =>
              toStudyId(study.id) !== toStudyId(savedStudy.id) &&
              (!savedStudy.client_id ||
                study.client_id !== savedStudy.client_id),
          ),
        ]);

        await writeLocalStudies(userId, nextStudies);

        return {
          study: savedStudy,
          source: 'supabase',
        };
      }
    }

    const { data, error } = await insertRemoteStudy({
      userId,
      input,
    });

    if (error || !data) {
      console.log('INSERT_STUDY_SUPABASE_ERROR', error);
      return saveStudyLocally(userId, input);
    }

    const savedStudy = mapSupabaseStudy(data as SupabaseStudyRow);
    const localStudies = await readLocalStudies(userId);

    const nextStudies = sortStudies([
      savedStudy,
      ...localStudies.filter(
        (study) =>
          toStudyId(study.id) !== toStudyId(input.id ?? savedStudy.id) &&
          (!savedStudy.client_id || study.client_id !== savedStudy.client_id),
      ),
    ]);

    await writeLocalStudies(userId, nextStudies);

    return {
      study: savedStudy,
      source: 'supabase',
    };
  } catch (error) {
    console.log('SAVE_STUDY_FATAL', error);
    return saveStudyLocally(userId, input);
  }
}

export async function deleteStudy(
  userId: string | null,
  studyId: string | number,
): Promise<StudySource> {
  const localStudies = await readLocalStudies(userId);

  const nextLocalStudies = localStudies.filter(
    (study) => toStudyId(study.id) !== toStudyId(studyId),
  );

  if (!userId || isLocalId(studyId)) {
    await writeLocalStudies(userId, nextLocalStudies);
    return 'local';
  }

  const sb = getSupabaseOrNull();

  if (!sb) {
    await writeLocalStudies(userId, nextLocalStudies);
    return 'local';
  }

  try {
    const { error } = await sb
      .from('saved_notes')
      .delete()
      .eq('id', studyId)
      .eq('user_id', userId);

    await writeLocalStudies(userId, nextLocalStudies);

    if (error) {
      console.log('DELETE_STUDY_SUPABASE_ERROR', error);
      return 'local';
    }

    return 'supabase';
  } catch (error) {
    console.log('DELETE_STUDY_FATAL', error);
    await writeLocalStudies(userId, nextLocalStudies);
    return 'local';
  }
}

export async function clearLocalStudies(userId: string | null): Promise<void> {
  await AsyncStorage.removeItem(getLocalStorageKey(userId));
}

export async function syncPendingStudies(userId: string | null): Promise<{
  synced: number;
  failed: number;
}> {
  if (!userId) {
    return {
      synced: 0,
      failed: 0,
    };
  }

  const sb = getSupabaseOrNull();

  if (!sb) {
    return {
      synced: 0,
      failed: 0,
    };
  }

  const localStudies = await readLocalStudies(userId);
  const pendingStudies = localStudies.filter((study) => study.pendingSync);

  if (pendingStudies.length === 0) {
    return {
      synced: 0,
      failed: 0,
    };
  }

  let synced = 0;
  let failed = 0;

  for (const study of pendingStudies) {
    try {
      const { data, error } = await sb
        .from('saved_notes')
        .insert({
          user_id: userId,
          title: normalizeTitle(study.title),
          content: normalizeContent(study.content),
          reference: normalizeReference(study.reference),
          client_id: study.client_id ?? generateClientId(),
        })
        .select('id, created_at, title, reference, content, user_id, client_id')
        .single();

      if (error || !data) {
        console.log('SYNC_PENDING_STUDY_ERROR', error);
        failed += 1;
        continue;
      }

      const remoteStudy = mapSupabaseStudy(data as SupabaseStudyRow);

      const currentLocalStudies = await readLocalStudies(userId);
      const nextStudies = sortStudies([
        remoteStudy,
        ...currentLocalStudies.filter(
          (item) =>
            toStudyId(item.id) !== toStudyId(study.id) &&
            (!study.client_id || item.client_id !== study.client_id),
        ),
      ]);

      await writeLocalStudies(userId, nextStudies);
      synced += 1;
    } catch (error) {
      console.log('SYNC_PENDING_STUDY_FATAL', error);
      failed += 1;
    }
  }

  return {
    synced,
    failed,
  };
}