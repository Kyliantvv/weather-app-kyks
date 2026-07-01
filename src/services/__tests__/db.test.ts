jest.mock('expo-sqlite', () => {
  const history: Array<{ id: number; city: string; country: string; searched_at: string }> = [];
  const favorites: Array<{ id: number; city: string; country: string; added_at: string }> = [];
  let historyId = 1;
  let favoriteId = 1;

  const db = {
    execAsync: jest.fn(async () => undefined),
    runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.startsWith('INSERT INTO search_history')) {
        const [city, country, searchedAt] = params as string[];
        history.push({ id: historyId++, city, country, searched_at: searchedAt });
      } else if (sql.startsWith('INSERT INTO favorites')) {
        const [city, country, addedAt] = params as string[];
        favorites.push({ id: favoriteId++, city, country, added_at: addedAt });
      } else if (sql.startsWith('DELETE FROM favorites')) {
        const [city] = params as string[];
        const index = favorites.findIndex((f) => f.city === city);
        if (index !== -1) favorites.splice(index, 1);
      }
      return { changes: 1, lastInsertRowId: historyId };
    }),
    getAllAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('FROM search_history')) {
        const limit = (params[0] as number) ?? history.length;
        return [...history].reverse().slice(0, limit);
      }
      if (sql.includes('FROM favorites')) {
        return [...favorites].reverse();
      }
      return [];
    }),
    getFirstAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
      const [city] = params as string[];
      return favorites.find((f) => f.city === city) ?? null;
    }),
  };

  return { openDatabaseAsync: jest.fn(async () => db) };
});

import { initDb, addToHistory, getHistory, addFavorite, removeFavorite, getFavorites, isFavorite } from '../db';

describe('db', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('stores and retrieves search history, newest first', async () => {
    await addToHistory('Paris', 'FR', '2026-07-01T10:00:00.000Z');
    await addToHistory('Lyon', 'FR', '2026-07-01T11:00:00.000Z');

    const history = await getHistory(10);

    expect(history[0]).toMatchObject({ city: 'Lyon', country: 'FR' });
    expect(history[1]).toMatchObject({ city: 'Paris', country: 'FR' });
  });

  it('adds, checks, and removes a favorite', async () => {
    await addFavorite('Marseille', 'FR', '2026-07-01T12:00:00.000Z');

    expect(await isFavorite('Marseille')).toBe(true);

    await removeFavorite('Marseille');

    expect(await isFavorite('Marseille')).toBe(false);
  });

  it('lists all favorites', async () => {
    await addFavorite('Nice', 'FR', '2026-07-01T13:00:00.000Z');

    const favorites = await getFavorites();

    expect(favorites.some((f) => f.city === 'Nice')).toBe(true);
  });
});
