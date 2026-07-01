import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { getFavorites, getHistory, addFavorite, addToHistory, type FavoriteEntry, type HistoryEntry } from './db';

interface SyncSnapshot {
  favorites: FavoriteEntry[];
  history: HistoryEntry[];
}

function getUid(): string | null {
  return auth.currentUser?.uid ?? null;
}

export async function pushSyncSnapshot(): Promise<void> {
  const uid = getUid();
  if (!uid) return;

  try {
    const [favorites, history] = await Promise.all([getFavorites(), getHistory(100)]);
    const firestore = getFirestore();
    await setDoc(doc(firestore, 'sync', uid), { favorites, history });
  } catch {
    // Best-effort: cloud sync failures (e.g. Firestore not enabled) never block local usage.
  }
}

export async function pullSyncSnapshot(): Promise<SyncSnapshot | null> {
  const uid = getUid();
  if (!uid) return null;

  try {
    const firestore = getFirestore();
    const snapshot = await getDoc(doc(firestore, 'sync', uid));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();
    return { favorites: data.favorites ?? [], history: data.history ?? [] };
  } catch {
    return null;
  }
}

export async function mergeFromCloud(): Promise<void> {
  const remote = await pullSyncSnapshot();
  if (!remote) return;

  const localFavorites = await getFavorites();
  const localCities = new Set(localFavorites.map((favorite) => favorite.city));
  for (const favorite of remote.favorites) {
    if (!localCities.has(favorite.city)) {
      await addFavorite(favorite.city, favorite.country, favorite.addedAt);
    }
  }

  const localHistory = await getHistory(1000);
  const localHistoryKeys = new Set(localHistory.map((entry) => `${entry.city}|${entry.searchedAt}`));
  for (const entry of remote.history) {
    const key = `${entry.city}|${entry.searchedAt}`;
    if (!localHistoryKeys.has(key)) {
      await addToHistory(entry.city, entry.country, entry.searchedAt);
    }
  }
}

export async function syncNow(): Promise<void> {
  await pushSyncSnapshot();
}
