import * as SQLite from 'expo-sqlite';

export interface HistoryEntry {
  id: number;
  city: string;
  country: string;
  searchedAt: string;
}

export interface FavoriteEntry {
  id: number;
  city: string;
  country: string;
  addedAt: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('weather-secure-app.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          city TEXT NOT NULL,
          country TEXT NOT NULL,
          searched_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          city TEXT NOT NULL,
          country TEXT NOT NULL,
          added_at TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  await getDb();
}

export async function addToHistory(city: string, country: string, searchedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO search_history (city, country, searched_at) VALUES (?, ?, ?)', [
    city,
    country,
    searchedAt,
  ]);
}

export async function getHistory(limit: number): Promise<HistoryEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; city: string; country: string; searched_at: string }>(
    'SELECT id, city, country, searched_at FROM search_history ORDER BY id DESC LIMIT ?',
    [limit]
  );
  return rows.map((row) => ({ id: row.id, city: row.city, country: row.country, searchedAt: row.searched_at }));
}

export async function addFavorite(city: string, country: string, addedAt: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT INTO favorites (city, country, added_at) VALUES (?, ?, ?)', [city, country, addedAt]);
}

export async function removeFavorite(city: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM favorites WHERE city = ?', [city]);
}

export async function getFavorites(): Promise<FavoriteEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; city: string; country: string; added_at: string }>(
    'SELECT id, city, country, added_at FROM favorites ORDER BY id DESC'
  );
  return rows.map((row) => ({ id: row.id, city: row.city, country: row.country, addedAt: row.added_at }));
}

export async function isFavorite(city: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: number }>('SELECT id FROM favorites WHERE city = ? LIMIT 1', [city]);
  return row !== null;
}
