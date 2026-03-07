import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabaseOrNull } from './supabaseClient';

const QUEUE_KEY = 'SYNC_QUEUE';

type QueueItem = {
  type: 'note';
  payload: any;
};

async function getQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueueItem[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function addToSyncQueue(item: QueueItem) {
  const queue = await getQueue();
  queue.push(item);
  await saveQueue(queue);
}

export async function processSyncQueue() {
  const sb = getSupabaseOrNull();
  if (!sb) return;

  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  if (!user) return;

  const queue = await getQueue();
  if (!queue.length) return;

  const remaining: QueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.type === 'note') {
        const { error } = await sb.from('saved_notes').insert({
          user_id: user.id,
          ...item.payload,
        });

        if (error) {
          remaining.push(item);
        }
      }
    } catch {
      remaining.push(item);
    }
  }

  await saveQueue(remaining);
}