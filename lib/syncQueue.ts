import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';

const QUEUE_KEY = 'SYNC_QUEUE';
const ENABLE_NOTE_SYNC = false;

export type QueueItem = {
  type: 'note';
  payload: {
    id?: string;
    client_id?: string;
    title: string;
    reference?: string;
    content: string;
    created_at?: string;
  };
};

async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.log('SYNC_QUEUE_PARSE_ERROR', error);
    return [];
  }
}

async function saveQueue(queue: QueueItem[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function isSameQueueItem(a: QueueItem, b: QueueItem) {
  if (a.type !== b.type) return false;

  if (a.type === 'note' && b.type === 'note') {
    return (
      String(a.payload.title ?? '') === String(b.payload.title ?? '') &&
      String(a.payload.reference ?? '') === String(b.payload.reference ?? '') &&
      String(a.payload.content ?? '') === String(b.payload.content ?? '') &&
      String(a.payload.created_at ?? '') === String(b.payload.created_at ?? '')
    );
  }

  return false;
}

function sanitizeQueuedNotePayload(payload: QueueItem['payload']) {
  return {
    client_id: payload.client_id ? String(payload.client_id) : null,
    title: String(payload.title ?? ''),
    reference: payload.reference != null ? String(payload.reference) : '',
    content: String(payload.content ?? ''),
    created_at: payload.created_at || new Date().toISOString(),
  };
}

export async function addToSyncQueue(item: QueueItem) {
  const queue = await getQueue();

  const normalized: QueueItem = {
    type: item.type,
    payload: {
      // intencionalmente mantemos id apenas no armazenamento da fila,
      // mas ele nunca será enviado ao banco.
      id: item.payload.id ? String(item.payload.id) : undefined,
      client_id: item.payload.client_id ? String(item.payload.client_id) : undefined,
      title: String(item.payload.title ?? ''),
      reference: item.payload.reference != null ? String(item.payload.reference) : '',
      content: String(item.payload.content ?? ''),
      created_at: item.payload.created_at || new Date().toISOString(),
    },
  };

  const alreadyExists = queue.some((queued) => isSameQueueItem(queued, normalized));

  if (!alreadyExists) {
    queue.push(normalized);
    await saveQueue(queue);
  }
}

export async function getSyncQueue() {
  return getQueue();
}

export async function clearSyncQueue() {
  await saveQueue([]);
}

export async function removeNoteItemsFromQueue() {
  const queue = await getQueue();
  const filtered = queue.filter((item) => item.type !== 'note');
  await saveQueue(filtered);
}

export async function processSyncQueue() {
  const sb = getSupabaseOrNull();
  if (!sb) return { processed: 0, remaining: 0 };

  const { data, error: sessionError } = await sb.auth.getSession();
  if (sessionError) {
    console.log('SYNC_QUEUE_SESSION_ERROR', sessionError);
    return { processed: 0, remaining: 0 };
  }

  const user = data.session?.user;
  if (!user) return { processed: 0, remaining: 0 };

  const queue = await getQueue();
  if (!queue.length) return { processed: 0, remaining: 0 };

  const remaining: QueueItem[] = [];
  let processed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'note') {
        if (!ENABLE_NOTE_SYNC) {
          console.log('SYNC_QUEUE_NOTE_DISABLED');
          remaining.push(item);
          continue;
        }

        const clean = sanitizeQueuedNotePayload(item.payload);

        const payload = {
          user_id: user.id,
          client_id: clean.client_id,
          title: clean.title,
          reference: clean.reference,
          content: clean.content,
          created_at: clean.created_at,
        };

        // Nunca enviar id manualmente para saved_notes.
        const { error } = await sb
          .from('saved_notes')
          .insert(payload);

        if (error) {
          console.log('SYNC_QUEUE_NOTE_INSERT_ERROR', error);
          remaining.push(item);
        } else {
          processed += 1;
        }
      } else {
        remaining.push(item);
      }
    } catch (e) {
      console.log('SYNC_QUEUE_ITEM_FATAL', e);
      remaining.push(item);
    }
  }

  await saveQueue(remaining);

  return {
    processed,
    remaining: remaining.length,
  };
}