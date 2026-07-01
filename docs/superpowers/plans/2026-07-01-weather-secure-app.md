# Weather Secure App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Expo/React Native "Weather Secure App" described in `sujet1-r.pdf` and `docs/superpowers/specs/2026-07-01-weather-secure-app-design.md`: Firebase-authenticated, OpenWeather-backed weather app with SQLite local storage and Joi-validated forms, across 5 screens.

**Architecture:** A single Expo TypeScript app. Pure logic (validation, services, data access) is built and unit-tested first, bottom-up, with all external systems (Firebase, OpenWeather, SQLite) behind small service modules. Navigation and screens are built on top, wiring services together. `AuthContext` gates navigation between an `AuthStack` and authenticated `AppTabs`.

**Tech Stack:** Expo SDK 52 (React Native 0.76, React 18.3), TypeScript, `firebase` v10 (modular, `initializeAuth` + `getReactNativePersistence`), `joi` (real package, resolved via Metro's browser field), `expo-sqlite` (async API), `@react-navigation/native` + native-stack + bottom-tabs, `react-native-paper`, `jest` + `jest-expo` + `@testing-library/react-native`.

## Global Constraints

- Expo SDK 52 / React Native 0.76.3 / React 18.3.1 — do not mix other RN/React versions in.
- TypeScript `strict: true`.
- Real `joi` npm package only — no forked/ported "joi-like" packages. It is made to work under Metro via `resolver.resolverMainFields = ['react-native', 'browser', 'main']` in `metro.config.js`, which makes Metro resolve Joi's own published Node-free `browser` build. No manual `stream`/`crypto` polyfills.
- `expo-sqlite` async API only: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`, `getFirstAsync`.
- Firebase modular SDK (`firebase/app`, `firebase/auth`), persistence via `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`.
- All user-facing strings (labels, error messages) are in French, matching the subject.
- Secrets (OpenWeather key, Firebase config) live in a local `.env` file as `EXPO_PUBLIC_*` variables, read via `process.env`. `.env` is git-ignored; `.env.example` is committed with placeholder values.
- **Do not run `git init`, `git add`, or `git commit` anywhere in this project.** The user manages their own dedicated Git repository for this project. Every task ends with working, tested code left uncommitted in the working tree — skip the "Commit" step that normally closes a task.
- Bonus/extension features from the subject (geolocation, dark mode, advanced caching, Firebase/SQLite sync, weather charts) are explicitly out of scope for this plan.
- Test runner: `npm test` (Jest). Type check: `npm run typecheck` (`tsc --noEmit`).

---

## Task 1: Project scaffold, tooling, and smoke test

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `babel.config.js`
- Create: `app.json`
- Create: `.gitignore`
- Create: `App.tsx`
- Create: `src/__tests__/App.test.tsx`

**Interfaces:**
- Produces: `App.tsx` default-exports a React component `App` used as the RN entry point (`node_modules/expo/AppEntry.js` renders it). Later tasks (Task 7) modify this file's internals but keep the default export.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "weather-secure-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "expo": "~52.0.11",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.3"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@testing-library/react-native": "^12.7.2",
    "@types/jest": "^29.5.13",
    "@types/react": "~18.3.12",
    "babel-preset-expo": "~12.0.1",
    "jest": "^29.7.0",
    "jest-expo": "~52.0.2",
    "typescript": "~5.3.3"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-paper|@react-native-async-storage/.*|firebase|@firebase/.*)"
    ]
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 3: Write `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

- [ ] **Step 4: Write `app.json`**

```json
{
  "expo": {
    "name": "Weather Secure App",
    "slug": "weather-secure-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#FFFFFF"
      }
    }
  }
}
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
.expo/
dist/
web-build/
.env
*.log
```

- [ ] **Step 6: Write initial `App.tsx`**

```tsx
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: install completes without errors, `node_modules/` created.

- [ ] **Step 8: Write the failing smoke test**

`src/__tests__/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import App from '../../App';

test('renders the app title', () => {
  render(<App />);
  expect(screen.getByText('Weather Secure App')).toBeTruthy();
});
```

- [ ] **Step 9: Run test to verify it fails**

Run: `npm test -- App.test.tsx`
Expected: FAIL — `getByText('Weather Secure App')` finds nothing (current text is "Open up App.tsx...").

- [ ] **Step 10: Update `App.tsx` to satisfy the test**

Change the `<Text>` content in `App.tsx` from `Open up App.tsx to start working on your app!` to `Weather Secure App`.

- [ ] **Step 11: Run test to verify it passes**

Run: `npm test -- App.test.tsx`
Expected: PASS

---

## Task 2: Environment configuration and Metro config

**Files:**
- Create: `.env.example`
- Create: `metro.config.js`
- Create: `src/config/env.ts`
- Create: `src/config/__tests__/env.test.ts`

**Interfaces:**
- Produces: `ENV` object (`{ openWeatherApiKey: string, firebase: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } }`) and `requireEnv(name: string, value: string | undefined): string`, both exported from `src/config/env.ts`. Consumed by Task 5 (`firebase.ts`) and Task 8 (`weatherService.ts`).

- [ ] **Step 1: Write `.env.example`**

```
EXPO_PUBLIC_OPENWEATHER_KEY=your_openweather_api_key
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

- [ ] **Step 2: Write the failing test**

`src/config/__tests__/env.test.ts`:

```ts
import { requireEnv } from '../env';

describe('requireEnv', () => {
  it('returns the value when defined', () => {
    expect(requireEnv('X', 'value')).toBe('value');
  });

  it('throws when the value is undefined', () => {
    expect(() => requireEnv('X', undefined)).toThrow('Missing required environment variable: X');
  });

  it('throws when the value is an empty string', () => {
    expect(() => requireEnv('X', '')).toThrow('Missing required environment variable: X');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- env.test.ts`
Expected: FAIL — `Cannot find module '../env'`

- [ ] **Step 4: Write `src/config/env.ts`**

```ts
export function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const ENV = {
  openWeatherApiKey: requireEnv('EXPO_PUBLIC_OPENWEATHER_KEY', process.env.EXPO_PUBLIC_OPENWEATHER_KEY),
  firebase: {
    apiKey: requireEnv('EXPO_PUBLIC_FIREBASE_API_KEY', process.env.EXPO_PUBLIC_FIREBASE_API_KEY),
    authDomain: requireEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN),
    projectId: requireEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID', process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID),
    storageBucket: requireEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: requireEnv(
      'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    ),
    appId: requireEnv('EXPO_PUBLIC_FIREBASE_APP_ID', process.env.EXPO_PUBLIC_FIREBASE_APP_ID),
  },
};
```

Note: this module throws at import time if a variable is missing. For the test in Step 2 to pass without a real `.env`, the test only imports `requireEnv` (a named export usable independently) — importing it alone does not evaluate the `ENV` object.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- env.test.ts`
Expected: PASS

- [ ] **Step 6: Write `metro.config.js`**

```js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase ships CommonJS (.cjs) entry points for React Native, and Metro's
// package.json "exports" resolution conflicts with them (produces
// "Component auth has not been registered yet"). Fall back to the classic
// resolver and explicitly allow .cjs files.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Joi (v17+) publishes a Node-free "browser" build via its package.json
// "browser" field. Metro already prioritizes "browser" by default; this is
// set explicitly so Joi resolves to that build regardless of Metro defaults.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
```

- [ ] **Step 7: Create a local `.env` for development**

Copy `.env.example` to `.env` and fill in real values once the Firebase project and OpenWeather key exist (Task 5 and Task 8 cover obtaining them). This file must never be committed (already covered by `.gitignore`).

---

## Task 3: Joi validation schemas

**Files:**
- Create: `src/validation/schemas.ts`
- Create: `src/validation/__tests__/schemas.test.ts`

**Interfaces:**
- Produces: `validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): { value: T | null; errors: Record<string, string> | null }`, `loginSchema`, `registerSchema`, `searchCitySchema`. Consumed by Task 9 (Login), Task 10 (Register/ForgotPassword — also adds `forgotPasswordSchema` here), Task 12 (Search).

- [ ] **Step 1: Install Joi**

Run: `npm install joi`

- [ ] **Step 2: Write the failing test**

`src/validation/__tests__/schemas.test.ts`:

```ts
import { validate, loginSchema, registerSchema, searchCitySchema } from '../schemas';

describe('loginSchema', () => {
  it('accepts a valid email and non-empty password', () => {
    const { value, errors } = validate(loginSchema, { email: 'user@example.com', password: 'secret' });
    expect(errors).toBeNull();
    expect(value).toEqual({ email: 'user@example.com', password: 'secret' });
  });

  it('rejects an invalid email', () => {
    const { value, errors } = validate(loginSchema, { email: 'not-an-email', password: 'secret' });
    expect(value).toBeNull();
    expect(errors?.email).toBe("L'adresse email n'est pas valide");
  });

  it('rejects an empty password', () => {
    const { errors } = validate(loginSchema, { email: 'user@example.com', password: '' });
    expect(errors?.password).toBe('Le mot de passe est requis');
  });
});

describe('registerSchema', () => {
  it('accepts a strong password with a matching confirmation', () => {
    const { value, errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Secret123',
      confirmPassword: 'Secret123',
    });
    expect(errors).toBeNull();
    expect(value?.password).toBe('Secret123');
  });

  it('rejects a password without an uppercase letter or digit', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'secretsecret',
      confirmPassword: 'secretsecret',
    });
    expect(errors?.password).toBe('Le mot de passe doit contenir au moins une majuscule et un chiffre');
  });

  it('rejects a password shorter than 8 characters', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Ab1',
      confirmPassword: 'Ab1',
    });
    expect(errors?.password).toBe('Le mot de passe doit contenir au moins 8 caractères');
  });

  it('rejects a mismatched confirmation', () => {
    const { errors } = validate(registerSchema, {
      email: 'user@example.com',
      password: 'Secret123',
      confirmPassword: 'Different123',
    });
    expect(errors?.confirmPassword).toBe('Les mots de passe ne correspondent pas');
  });
});

describe('searchCitySchema', () => {
  it('accepts a plain city name', () => {
    const { value, errors } = validate(searchCitySchema, { city: 'Paris' });
    expect(errors).toBeNull();
    expect(value).toEqual({ city: 'Paris' });
  });

  it('rejects an empty city', () => {
    const { errors } = validate(searchCitySchema, { city: '' });
    expect(errors?.city).toBe('Le nom de ville est requis');
  });

  it('rejects a city name with digits', () => {
    const { errors } = validate(searchCitySchema, { city: 'Paris123' });
    expect(errors?.city).toBe('Le nom de ville contient des caractères non autorisés');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- schemas.test.ts`
Expected: FAIL — `Cannot find module '../schemas'`

- [ ] **Step 4: Write `src/validation/schemas.ts`**

```ts
import Joi from 'joi';

export interface ValidationResult<T> {
  value: T | null;
  errors: Record<string, string> | null;
}

export function validate<T>(schema: Joi.ObjectSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.validate(data, { abortEarly: false, stripUnknown: true });

  if (!result.error) {
    return { value: result.value, errors: null };
  }

  const errors: Record<string, string> = {};
  for (const detail of result.error.details) {
    const field = String(detail.path[0] ?? 'form');
    if (!errors[field]) {
      errors[field] = detail.message;
    }
  }

  return { value: null, errors };
}

const emailRule = Joi.string().trim().email({ tlds: false }).required().messages({
  'string.email': "L'adresse email n'est pas valide",
  'string.empty': "L'adresse email est requise",
  'any.required': "L'adresse email est requise",
});

export const loginSchema = Joi.object({
  email: emailRule,
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Le mot de passe est requis',
    'any.required': 'Le mot de passe est requis',
  }),
});

export const registerSchema = Joi.object({
  email: emailRule,
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[0-9]/, 'digit')
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.name': 'Le mot de passe doit contenir au moins une majuscule et un chiffre',
      'string.empty': 'Le mot de passe est requis',
      'any.required': 'Le mot de passe est requis',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Les mots de passe ne correspondent pas',
    'any.required': 'La confirmation du mot de passe est requise',
  }),
});

export const searchCitySchema = Joi.object({
  city: Joi.string()
    .trim()
    .min(2)
    .max(85)
    .pattern(/^[\p{L} .'-]+$/u, 'city name characters')
    .required()
    .messages({
      'string.min': 'Le nom de ville doit contenir au moins 2 caractères',
      'string.max': 'Le nom de ville est trop long',
      'string.pattern.name': 'Le nom de ville contient des caractères non autorisés',
      'string.empty': 'Le nom de ville est requis',
      'any.required': 'Le nom de ville est requis',
    }),
});
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- schemas.test.ts`
Expected: PASS

---

## Task 4: SQLite data access (history and favorites)

**Files:**
- Create: `src/services/db.ts`
- Create: `src/services/__tests__/db.test.ts`

**Interfaces:**
- Produces: `initDb(): Promise<void>`, `addToHistory(city, country, searchedAt): Promise<void>`, `getHistory(limit: number): Promise<HistoryEntry[]>`, `addFavorite(city, country, addedAt): Promise<void>`, `removeFavorite(city: string): Promise<void>`, `getFavorites(): Promise<FavoriteEntry[]>`, `isFavorite(city: string): Promise<boolean>`, plus types `HistoryEntry { id, city, country, searchedAt }` and `FavoriteEntry { id, city, country, addedAt }`. Consumed by Task 11 (Dashboard), Task 12 (Search), Task 13 (WeatherDetail).

- [ ] **Step 1: Install expo-sqlite**

Run: `npx expo install expo-sqlite`

- [ ] **Step 2: Write the failing test**

`src/services/__tests__/db.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- db.test.ts`
Expected: FAIL — `Cannot find module '../db'`

- [ ] **Step 4: Write `src/services/db.ts`**

```ts
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
    dbPromise = SQLite.openDatabaseAsync('weather-secure-app.db');
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- db.test.ts`
Expected: PASS

---

## Task 5: Firebase configuration and auth service

**Files:**
- Create: `src/config/firebase.ts`
- Create: `src/services/authService.ts`
- Create: `src/services/__tests__/authService.test.ts`

**Interfaces:**
- Consumes: `ENV.firebase` (Task 2).
- Produces: `auth` (Firebase `Auth` instance, `src/config/firebase.ts`); `signUp(email, password): Promise<User>`, `signIn(email, password): Promise<User>`, `signOut(): Promise<void>`, `resetPassword(email): Promise<void>`, `subscribeToAuthChanges(callback: (user: User | null) => void): () => void`, `mapAuthError(error: unknown): string` (all `src/services/authService.ts`). Consumed by Task 6 (`AuthContext`).

- [ ] **Step 1: Install Firebase and AsyncStorage**

Run: `npm install firebase`
Run: `npx expo install @react-native-async-storage/async-storage`

- [ ] **Step 2: Create the Firebase project (manual, one-time)**

1. Go to the Firebase console and create a new project.
2. In the project, open **Build > Authentication**, click **Get started**, and enable the **Email/Password** sign-in provider.
3. Open **Project settings > General**, scroll to "Your apps", click the Web (`</>`) icon to register a web app (Firebase's web SDK is what the React Native app uses).
4. Copy the resulting `firebaseConfig` values (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`) into the local `.env` file created in Task 2, Step 7, under the matching `EXPO_PUBLIC_FIREBASE_*` keys.

- [ ] **Step 3: Write `src/config/firebase.ts`**

```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from './env';

const firebaseConfig = {
  apiKey: ENV.firebase.apiKey,
  authDomain: ENV.firebase.authDomain,
  projectId: ENV.firebase.projectId,
  storageBucket: ENV.firebase.storageBucket,
  messagingSenderId: ENV.firebase.messagingSenderId,
  appId: ENV.firebase.appId,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
```

- [ ] **Step 4: Write the failing test**

`src/services/__tests__/authService.test.ts`:

```ts
jest.mock('../../config/firebase', () => ({ auth: {} }));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { signUp, signIn, signOut, resetPassword, subscribeToAuthChanges, mapAuthError } from '../authService';

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signUp returns the created user on success', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: { uid: '1', email: 'a@b.com' } });

    const user = await signUp('a@b.com', 'Password1');

    expect(user).toEqual({ uid: '1', email: 'a@b.com' });
  });

  it('signUp maps a known Firebase error to a French message', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/email-already-in-use' });

    await expect(signUp('a@b.com', 'Password1')).rejects.toThrow('Un compte existe déjà avec cette adresse email');
  });

  it('signIn maps invalid credentials to a French message', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue({ code: 'auth/invalid-credential' });

    await expect(signIn('a@b.com', 'wrong')).rejects.toThrow('Email ou mot de passe incorrect');
  });

  it('signOut delegates to firebase signOut', async () => {
    (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

    await signOut();

    expect(firebaseSignOut).toHaveBeenCalled();
  });

  it('resetPassword maps unknown user to a French message', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({ code: 'auth/user-not-found' });

    await expect(resetPassword('missing@b.com')).rejects.toThrow('Aucun compte ne correspond à cette adresse email');
  });

  it('subscribeToAuthChanges registers and returns an unsubscribe function', () => {
    const unsubscribe = jest.fn();
    (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

    const result = subscribeToAuthChanges(() => {});

    expect(result).toBe(unsubscribe);
  });

  it('mapAuthError falls back to a generic message for unknown codes', () => {
    expect(mapAuthError({ code: 'auth/unknown' })).toBe('Une erreur est survenue, veuillez réessayer');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test -- authService.test.ts`
Expected: FAIL — `Cannot find module '../authService'`

- [ ] **Step 6: Write `src/services/authService.ts`**

```ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse email',
  'auth/invalid-email': "L'adresse email n'est pas valide",
  'auth/user-not-found': 'Aucun compte ne correspond à cette adresse email',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/invalid-credential': 'Email ou mot de passe incorrect',
  'auth/weak-password': 'Le mot de passe est trop faible',
  'auth/network-request-failed': 'Problème de connexion réseau, veuillez réessayer',
  'auth/too-many-requests': 'Trop de tentatives, veuillez réessayer plus tard',
};

export function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  return ERROR_MESSAGES[code] ?? 'Une erreur est survenue, veuillez réessayer';
}

export async function signUp(email: string, password: string): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- authService.test.ts`
Expected: PASS

---

## Task 6: AuthContext

**Files:**
- Create: `src/context/AuthContext.tsx`
- Create: `src/context/__tests__/AuthContext.test.tsx`

**Interfaces:**
- Consumes: `subscribeToAuthChanges`, `signIn`, `signUp`, `signOut`, `resetPassword` (Task 5, `src/services/authService.ts`).
- Produces: `AuthProvider` (component), `useAuth(): { user: User | null; isLoading: boolean; signIn(email, password): Promise<void>; signUp(email, password): Promise<void>; signOut(): Promise<void>; resetPassword(email): Promise<void> }`. Consumed by Task 7 (`RootNavigator`, `App.tsx`), Task 9/10 (auth screens), Task 14 (`ProfileScreen`).

- [ ] **Step 1: Write the failing test**

`src/context/__tests__/AuthContext.test.tsx`:

```tsx
jest.mock('../../services/authService', () => ({
  subscribeToAuthChanges: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { subscribeToAuthChanges } from '../../services/authService';

function Probe() {
  const { user, isLoading } = useAuth();
  return <Text>{isLoading ? 'loading' : user ? `user:${user.uid}` : 'no-user'}</Text>;
}

describe('AuthContext', () => {
  it('resolves to no-user when Firebase reports none', async () => {
    (subscribeToAuthChanges as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('no-user')).toBeTruthy());
  });

  it('exposes the authenticated user once Firebase reports one', async () => {
    (subscribeToAuthChanges as jest.Mock).mockImplementation((callback) => {
      callback({ uid: '42' });
      return jest.fn();
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText('user:42')).toBeTruthy());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- AuthContext.test.tsx`
Expected: FAIL — `Cannot find module '../AuthContext'`

- [ ] **Step 3: Write `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuthChanges, signIn, signUp, signOut, resetPassword } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    signIn: async (email, password) => {
      await signIn(email, password);
    },
    signUp: async (email, password) => {
      await signUp(email, password);
    },
    signOut: async () => {
      await signOut();
    },
    resetPassword: async (email) => {
      await resetPassword(email);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- AuthContext.test.tsx`
Expected: PASS

---

## Task 7: Navigation skeleton and protected routes

**Files:**
- Create: `src/screens/auth/LoginScreen.tsx` (placeholder body, filled in Task 9)
- Create: `src/screens/auth/RegisterScreen.tsx` (placeholder body, filled in Task 10)
- Create: `src/screens/auth/ForgotPasswordScreen.tsx` (placeholder body, filled in Task 10)
- Create: `src/screens/DashboardScreen.tsx` (placeholder body, filled in Task 11)
- Create: `src/screens/SearchScreen.tsx` (placeholder body, filled in Task 12)
- Create: `src/screens/WeatherDetailScreen.tsx` (placeholder body, filled in Task 13)
- Create: `src/screens/ProfileScreen.tsx` (placeholder body, filled in Task 14)
- Create: `src/navigation/AuthStack.tsx`
- Create: `src/navigation/AppTabs.tsx`
- Create: `src/navigation/RootNavigator.tsx`
- Create: `src/navigation/__tests__/RootNavigator.test.tsx`
- Modify: `App.tsx`
- Modify: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6).
- Produces: `AuthStackParamList` (`{ Login: undefined; Register: undefined; ForgotPassword: undefined }`), `DashboardStackParamList` / `SearchStackParamList` (both `{ DashboardHome | SearchHome: undefined; WeatherDetail: { city: string } }`), `RootNavigator`, `AuthStack`, `AppTabs`. Consumed by Task 9–14 screens (for `useNavigation`/`useRoute` typing) and by `App.tsx`.

Each placeholder screen below renders real, distinct static text so navigation can be asserted on. Later tasks replace the body but keep the same named export.

- [ ] **Step 1: Install navigation and UI dependencies**

Run: `npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-paper`

- [ ] **Step 2: Write placeholder screens**

`src/screens/auth/LoginScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text>Connexion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/auth/RegisterScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text>Inscription</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/auth/ForgotPasswordScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text>Mot de passe oublié</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/DashboardScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Dashboard Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/SearchScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text>Search Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/WeatherDetailScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function WeatherDetailScreen() {
  return (
    <View style={styles.container}>
      <Text>Weather Detail Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

`src/screens/ProfileScreen.tsx`:

```tsx
import { View, Text, StyleSheet } from 'react-native';

export function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 3: Write `src/navigation/AuthStack.tsx`**

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
```

- [ ] **Step 4: Write `src/navigation/AppTabs.tsx`**

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { WeatherDetailScreen } from '../screens/WeatherDetailScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type DashboardStackParamList = {
  DashboardHome: undefined;
  WeatherDetail: { city: string };
};

export type SearchStackParamList = {
  SearchHome: undefined;
  WeatherDetail: { city: string };
};

const DashboardStackNav = createNativeStackNavigator<DashboardStackParamList>();
function DashboardStack() {
  return (
    <DashboardStackNav.Navigator>
      <DashboardStackNav.Screen name="DashboardHome" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStackNav.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{ title: 'Détail météo' }}
      />
    </DashboardStackNav.Navigator>
  );
}

const SearchStackNav = createNativeStackNavigator<SearchStackParamList>();
function SearchStack() {
  return (
    <SearchStackNav.Navigator>
      <SearchStackNav.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <SearchStackNav.Screen
        name="WeatherDetail"
        component={WeatherDetailScreen}
        options={{ title: 'Détail météo' }}
      />
    </SearchStackNav.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="home" color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
```

- [ ] **Step 5: Write `src/navigation/RootNavigator.tsx`**

```tsx
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading} testID="root-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return user ? <AppTabs /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 6: Write the failing test**

`src/navigation/__tests__/RootNavigator.test.tsx`:

```tsx
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// RootNavigator's own render logic never touches these, but AppTabs mounts
// DashboardScreen/SearchScreen which, from Task 11/12 onward, call these
// services on mount. Mocking them here keeps this test isolated from later
// tasks' screen implementations.
jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn().mockResolvedValue({
    cityId: 1,
    city: 'Paris',
    country: 'FR',
    temperatureCelsius: 20,
    condition: 'clear',
  }),
  getWeatherDetails: jest.fn().mockResolvedValue({
    cityId: 1,
    city: 'Paris',
    country: 'FR',
    temperatureCelsius: 20,
    condition: 'clear',
    humidityPercent: 50,
    windSpeedKmh: 10,
  }),
}));

jest.mock('../../services/db', () => ({
  getFavorites: jest.fn().mockResolvedValue([]),
  getHistory: jest.fn().mockResolvedValue([]),
  addToHistory: jest.fn().mockResolvedValue(undefined),
  addFavorite: jest.fn().mockResolvedValue(undefined),
  removeFavorite: jest.fn().mockResolvedValue(undefined),
  isFavorite: jest.fn().mockResolvedValue(false),
}));

import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '../RootNavigator';
import { useAuth } from '../../context/AuthContext';

describe('RootNavigator', () => {
  it('shows the auth stack when there is no user', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText('Connexion')).toBeTruthy();
  });

  it('shows the app tabs when a user is present', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1' }, isLoading: false });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  it('shows a loading indicator while the auth state resolves', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true });

    render(
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    );

    expect(screen.getByTestId('root-loading')).toBeTruthy();
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npm test -- RootNavigator.test.tsx`
Expected: FAIL — `Cannot find module '../../services/weatherService'` (and `../../services/db`) since Tasks 8 and 4 haven't run yet in isolation... note: Task 4 (`db.ts`) already exists by this point since tasks run in order; only `weatherService` (Task 8) is missing. Failure: `Cannot find module '../../services/weatherService'`.

- [ ] **Step 8: Write a minimal `src/services/weatherService.ts` stub so this task's test can pass**

This task only needs the module to exist with the two named exports used above; Task 8 replaces this file with the full implementation (real fetch calls, error types, formatting). Write:

```ts
export async function searchCity(_city: string): Promise<unknown> {
  throw new Error('Not implemented until Task 8');
}

export async function getWeatherDetails(_city: string): Promise<unknown> {
  throw new Error('Not implemented until Task 8');
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm test -- RootNavigator.test.tsx`
Expected: PASS

- [ ] **Step 10: Wire `App.tsx`**

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </AuthProvider>
  );
}
```

- [ ] **Step 11: Update the Task 1 smoke test to match the new `App.tsx`**

Replace the entire contents of `src/__tests__/App.test.tsx`:

```tsx
jest.mock('../services/authService', () => ({
  subscribeToAuthChanges: jest.fn((callback: (user: null) => void) => {
    callback(null);
    return jest.fn();
  }),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../../App';

test('renders the login screen when no user is authenticated', async () => {
  render(<App />);

  await waitFor(() => expect(screen.getByText('Connexion')).toBeTruthy());
});
```

- [ ] **Step 12: Run the full test suite to verify everything still passes**

Run: `npm test`
Expected: PASS (all suites)

---

## Task 8: OpenWeather service

**Files:**
- Modify: `src/services/weatherService.ts` (replacing the Task 7 stub)
- Create: `src/services/__tests__/weatherService.test.ts`

**Interfaces:**
- Consumes: `ENV.openWeatherApiKey` (Task 2).
- Produces: `searchCity(city: string): Promise<WeatherSummary>`, `getWeatherDetails(city: string): Promise<WeatherDetails>`, `CityNotFoundError`, `WeatherNetworkError`, types `WeatherSummary { cityId, city, country, temperatureCelsius, condition }` and `WeatherDetails extends WeatherSummary { humidityPercent, windSpeedKmh }`. Consumed by Task 11 (Dashboard), Task 12 (Search), Task 13 (WeatherDetail).

- [ ] **Step 1: Obtain an OpenWeather API key (manual, one-time)**

1. Create a free account at openweathermap.org.
2. Go to **My API keys** and copy the default key (new keys can take up to a couple of hours to activate).
3. Paste it into the local `.env` file as `EXPO_PUBLIC_OPENWEATHER_KEY`.

- [ ] **Step 2: Write the failing test**

`src/services/__tests__/weatherService.test.ts`:

```ts
jest.mock('../../config/env', () => ({ ENV: { openWeatherApiKey: 'test-key' } }));

import { searchCity, getWeatherDetails, CityNotFoundError, WeatherNetworkError } from '../weatherService';

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('weatherService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('searchCity returns a formatted summary', async () => {
    mockFetchOnce(200, {
      id: 42,
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 293.15, humidity: 60 },
      weather: [{ description: 'ciel dégagé' }],
      wind: { speed: 5 },
    });

    const result = await searchCity('Paris');

    expect(result).toEqual({
      cityId: 42,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 20,
      condition: 'ciel dégagé',
    });
  });

  it('searchCity throws CityNotFoundError on a 404 response', async () => {
    mockFetchOnce(404, {});

    await expect(searchCity('Villeinexistante')).rejects.toBeInstanceOf(CityNotFoundError);
  });

  it('getWeatherDetails includes humidity and wind speed in km/h', async () => {
    mockFetchOnce(200, {
      id: 42,
      name: 'Paris',
      sys: { country: 'FR' },
      main: { temp: 293.15, humidity: 60 },
      weather: [{ description: 'ciel dégagé' }],
      wind: { speed: 5 },
    });

    const result = await getWeatherDetails('Paris');

    expect(result.humidityPercent).toBe(60);
    expect(result.windSpeedKmh).toBe(18);
  });

  it('throws WeatherNetworkError when fetch rejects', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

    await expect(searchCity('Paris')).rejects.toBeInstanceOf(WeatherNetworkError);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- weatherService.test.ts`
Expected: FAIL — the Task 7 stub throws `Not implemented until Task 8` instead of the expected results.

- [ ] **Step 4: Replace `src/services/weatherService.ts`**

```ts
import { ENV } from '../config/env';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`Ville introuvable : ${city}`);
    this.name = 'CityNotFoundError';
  }
}

export class WeatherNetworkError extends Error {
  constructor() {
    super('Problème de connexion réseau, veuillez réessayer');
    this.name = 'WeatherNetworkError';
  }
}

export interface WeatherSummary {
  cityId: number;
  city: string;
  country: string;
  temperatureCelsius: number;
  condition: string;
}

export interface WeatherDetails extends WeatherSummary {
  humidityPercent: number;
  windSpeedKmh: number;
}

function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15);
}

function msToKmh(metersPerSecond: number): number {
  return Math.round(metersPerSecond * 3.6);
}

async function fetchWeatherByCity(city: string): Promise<any> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${ENV.openWeatherApiKey}`);
  } catch {
    throw new WeatherNetworkError();
  }

  if (response.status === 404) {
    throw new CityNotFoundError(city);
  }

  if (!response.ok) {
    throw new WeatherNetworkError();
  }

  return response.json();
}

export async function searchCity(city: string): Promise<WeatherSummary> {
  const data = await fetchWeatherByCity(city);
  return {
    cityId: data.id,
    city: data.name,
    country: data.sys.country,
    temperatureCelsius: kelvinToCelsius(data.main.temp),
    condition: data.weather[0]?.description ?? '',
  };
}

export async function getWeatherDetails(city: string): Promise<WeatherDetails> {
  const data = await fetchWeatherByCity(city);
  return {
    cityId: data.id,
    city: data.name,
    country: data.sys.country,
    temperatureCelsius: kelvinToCelsius(data.main.temp),
    condition: data.weather[0]?.description ?? '',
    humidityPercent: data.main.humidity,
    windSpeedKmh: msToKmh(data.wind.speed),
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- weatherService.test.ts`
Expected: PASS

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites, including Task 7's `RootNavigator.test.tsx`, which mocks this module and is unaffected by the real implementation)

---

## Task 9: LoginScreen

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Create: `src/screens/auth/__tests__/LoginScreen.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6), `validate`/`loginSchema` (Task 3), `AuthStackParamList` (Task 7).

- [ ] **Step 1: Write the failing test**

`src/screens/auth/__tests__/LoginScreen.test.tsx`:

```tsx
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

function renderLoginScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={() => null} />
        <Stack.Screen name="ForgotPassword" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('LoginScreen', () => {
  const signIn = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ signIn });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error and does not call signIn for an invalid email', async () => {
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email'), 'not-an-email');
    fireEvent.changeText(screen.getByTestId('login-password'), 'somepassword');
    fireEvent.press(screen.getByText('Se connecter'));

    expect(await screen.findByText("L'adresse email n'est pas valide")).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with the validated credentials', async () => {
    signIn.mockResolvedValue(undefined);
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'somepassword');
    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('user@example.com', 'somepassword'));
  });

  it('shows the mapped error message when signIn rejects', async () => {
    signIn.mockRejectedValue(new Error('Email ou mot de passe incorrect'));
    renderLoginScreen();

    fireEvent.changeText(screen.getByTestId('login-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    fireEvent.press(screen.getByText('Se connecter'));

    expect(await screen.findByText('Email ou mot de passe incorrect')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- LoginScreen.test.tsx`
Expected: FAIL — placeholder `LoginScreen` has no inputs or "Se connecter" button.

- [ ] **Step 3: Replace `src/screens/auth/LoginScreen.tsx`**

```tsx
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { validate, loginSchema } from '../../validation/schemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';

export function LoginScreen() {
  const { signIn } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Login'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const { value, errors } = validate(loginSchema, { email, password });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(value.email, value.password);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Connexion</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="login-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="login-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.password}>
        {fieldErrors?.password}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="login-form-error">
          {formError}
        </HelperText>
      ) : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Se connecter
      </Button>
      <Button onPress={() => navigation.navigate('Register')}>Créer un compte</Button>
      <Button onPress={() => navigation.navigate('ForgotPassword')}>Mot de passe oublié ?</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- LoginScreen.test.tsx`
Expected: PASS

---

## Task 10: RegisterScreen and ForgotPasswordScreen

**Files:**
- Modify: `src/validation/schemas.ts` (add `forgotPasswordSchema`)
- Modify: `src/validation/__tests__/schemas.test.ts` (add its tests)
- Modify: `src/screens/auth/RegisterScreen.tsx`
- Modify: `src/screens/auth/ForgotPasswordScreen.tsx`
- Create: `src/screens/auth/__tests__/RegisterScreen.test.tsx`
- Create: `src/screens/auth/__tests__/ForgotPasswordScreen.test.tsx`

**Interfaces:**
- Produces (addition): `forgotPasswordSchema` in `src/validation/schemas.ts`.

- [ ] **Step 1: Add the failing test for `forgotPasswordSchema`**

Append to `src/validation/__tests__/schemas.test.ts`:

```ts
import { validate, loginSchema, registerSchema, searchCitySchema, forgotPasswordSchema } from '../schemas';

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const { value, errors } = validate(forgotPasswordSchema, { email: 'user@example.com' });
    expect(errors).toBeNull();
    expect(value).toEqual({ email: 'user@example.com' });
  });

  it('rejects an invalid email', () => {
    const { errors } = validate(forgotPasswordSchema, { email: 'not-an-email' });
    expect(errors?.email).toBe("L'adresse email n'est pas valide");
  });
});
```

Replace the existing `import { validate, loginSchema, registerSchema, searchCitySchema } from '../schemas';` line at the top of the file with the `forgotPasswordSchema`-inclusive import above (do not duplicate the import).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- schemas.test.ts`
Expected: FAIL — `forgotPasswordSchema` is not exported yet.

- [ ] **Step 3: Add `forgotPasswordSchema` to `src/validation/schemas.ts`**

Append after `registerSchema`:

```ts
export const forgotPasswordSchema = Joi.object({
  email: emailRule,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for RegisterScreen**

`src/screens/auth/__tests__/RegisterScreen.test.tsx`:

```tsx
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterScreen } from '../RegisterScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

function renderRegisterScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Login" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('RegisterScreen', () => {
  const signUp = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ signUp });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error for a mismatched confirmation and does not call signUp', async () => {
    renderRegisterScreen();

    fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Different123');
    fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls signUp with the validated credentials', async () => {
    signUp.mockResolvedValue(undefined);
    renderRegisterScreen();

    fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Secret123');
    fireEvent.press(screen.getByText("S'inscrire"));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith('user@example.com', 'Secret123'));
  });

  it('shows the mapped error message when signUp rejects', async () => {
    signUp.mockRejectedValue(new Error('Un compte existe déjà avec cette adresse email'));
    renderRegisterScreen();

    fireEvent.changeText(screen.getByTestId('register-email'), 'user@example.com');
    fireEvent.changeText(screen.getByTestId('register-password'), 'Secret123');
    fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'Secret123');
    fireEvent.press(screen.getByText("S'inscrire"));

    expect(await screen.findByText('Un compte existe déjà avec cette adresse email')).toBeTruthy();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- RegisterScreen.test.tsx`
Expected: FAIL — placeholder `RegisterScreen` has no inputs.

- [ ] **Step 7: Replace `src/screens/auth/RegisterScreen.tsx`**

```tsx
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { validate, registerSchema } from '../../validation/schemas';
import type { AuthStackParamList } from '../../navigation/AuthStack';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Register'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    const { value, errors } = validate(registerSchema, { email, password, confirmPassword });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(value.email, value.password);
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Inscription</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="register-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      <TextInput
        label="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        testID="register-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.password}>
        {fieldErrors?.password}
      </HelperText>
      <TextInput
        label="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        testID="register-confirm-password"
      />
      <HelperText type="error" visible={!!fieldErrors?.confirmPassword}>
        {fieldErrors?.confirmPassword}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="register-form-error">
          {formError}
        </HelperText>
      ) : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        S'inscrire
      </Button>
      <Button onPress={() => navigation.navigate('Login')}>J'ai déjà un compte</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- RegisterScreen.test.tsx`
Expected: PASS

- [ ] **Step 9: Write the failing test for ForgotPasswordScreen**

`src/screens/auth/__tests__/ForgotPasswordScreen.test.tsx`:

```tsx
jest.mock('../../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ForgotPasswordScreen } from '../ForgotPasswordScreen';
import { useAuth } from '../../../context/AuthContext';

const Stack = createNativeStackNavigator();

function renderScreen() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('ForgotPasswordScreen', () => {
  const resetPassword = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ resetPassword });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error for an invalid email and does not call resetPassword', async () => {
    renderScreen();

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'not-an-email');
    fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByText("L'adresse email n'est pas valide")).toBeTruthy();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('shows a confirmation message once resetPassword succeeds', async () => {
    resetPassword.mockResolvedValue(undefined);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'user@example.com');
    fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByTestId('forgot-password-confirmation')).toBeTruthy();
  });

  it('shows the mapped error message when resetPassword rejects', async () => {
    resetPassword.mockRejectedValue(new Error('Aucun compte ne correspond à cette adresse email'));
    renderScreen();

    fireEvent.changeText(screen.getByTestId('forgot-password-email'), 'missing@example.com');
    fireEvent.press(screen.getByText('Réinitialiser le mot de passe'));

    expect(await screen.findByText('Aucun compte ne correspond à cette adresse email')).toBeTruthy();
  });
});
```

- [ ] **Step 10: Run test to verify it fails**

Run: `npm test -- ForgotPasswordScreen.test.tsx`
Expected: FAIL — placeholder `ForgotPasswordScreen` has no input.

- [ ] **Step 11: Replace `src/screens/auth/ForgotPasswordScreen.tsx`**

```tsx
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, HelperText, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { validate, forgotPasswordSchema } from '../../validation/schemas';

export function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    setConfirmation(null);
    const { value, errors } = validate(forgotPasswordSchema, { email });
    setFieldErrors(errors);
    if (!value) {
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(value.email);
      setConfirmation('Un email de réinitialisation a été envoyé');
    } catch (error) {
      setFormError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Mot de passe oublié</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        testID="forgot-password-email"
      />
      <HelperText type="error" visible={!!fieldErrors?.email}>
        {fieldErrors?.email}
      </HelperText>
      {formError ? (
        <HelperText type="error" visible testID="forgot-password-form-error">
          {formError}
        </HelperText>
      ) : null}
      {confirmation ? <Text testID="forgot-password-confirmation">{confirmation}</Text> : null}
      <Button mode="contained" onPress={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Réinitialiser le mot de passe
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 4 },
});
```

- [ ] **Step 12: Run test to verify it passes**

Run: `npm test -- ForgotPasswordScreen.test.tsx`
Expected: PASS

---

## Task 11: DashboardScreen

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`
- Create: `src/screens/__tests__/DashboardScreen.test.tsx`

**Interfaces:**
- Consumes: `searchCity` (Task 8), `getFavorites` (Task 4), `DashboardStackParamList` (Task 7).

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/DashboardScreen.test.tsx`:

```tsx
jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  getFavorites: jest.fn(),
}));

import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../DashboardScreen';
import { searchCity } from '../../services/weatherService';
import { getFavorites } from '../../services/db';

const Stack = createNativeStackNavigator();

function renderDashboard() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="DashboardHome" component={DashboardScreen} />
        <Stack.Screen name="WeatherDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('DashboardScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the default city weather when there are no favorites', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
    });

    renderDashboard();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(searchCity).toHaveBeenCalledWith('Paris');
  });

  it('shows the first favorite city weather when favorites exist', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([
      { id: 1, city: 'Lyon', country: 'FR', addedAt: '2026-07-01T00:00:00.000Z' },
    ]);
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 2,
      city: 'Lyon',
      country: 'FR',
      temperatureCelsius: 19,
      condition: 'nuageux',
    });

    renderDashboard();

    await waitFor(() => expect(searchCity).toHaveBeenCalledWith('Lyon'));
    expect(await screen.findByText('Lyon')).toBeTruthy();
  });

  it('shows an error with a retry button when the weather fetch fails', async () => {
    (getFavorites as jest.Mock).mockResolvedValue([]);
    (searchCity as jest.Mock).mockRejectedValue(new Error('Problème de connexion réseau, veuillez réessayer'));

    renderDashboard();

    expect(await screen.findByText('Problème de connexion réseau, veuillez réessayer')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- DashboardScreen.test.tsx`
Expected: FAIL — placeholder `DashboardScreen` renders none of this.

- [ ] **Step 3: Replace `src/screens/DashboardScreen.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchCity, type WeatherSummary } from '../services/weatherService';
import { getFavorites, type FavoriteEntry } from '../services/db';
import type { DashboardStackParamList } from '../navigation/AppTabs';

const DEFAULT_CITY = 'Paris';

export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>>();
  const [weather, setWeather] = useState<WeatherSummary | null>(null);
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedFavorites = await getFavorites();
      setFavorites(storedFavorites);
      const cityToShow = storedFavorites[0]?.city ?? DEFAULT_CITY;
      const summary = await searchCity(cityToShow);
      setWeather(summary);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.center} testID="dashboard-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text>{error}</Text>
        <Button onPress={load}>Réessayer</Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {weather ? (
        <Card style={styles.card} onPress={() => navigation.navigate('WeatherDetail', { city: weather.city })}>
          <Card.Title title={weather.city} subtitle={weather.condition} />
          <Card.Content>
            <Text variant="displaySmall">{weather.temperatureCelsius}°C</Text>
          </Card.Content>
        </Card>
      ) : null}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Favoris
      </Text>
      {favorites.map((favorite) => (
        <Button key={favorite.id} onPress={() => navigation.navigate('WeatherDetail', { city: favorite.city })}>
          {favorite.city}
        </Button>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 16 },
  sectionTitle: { marginBottom: 8 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- DashboardScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites)

---

## Task 12: SearchScreen

**Files:**
- Modify: `src/screens/SearchScreen.tsx`
- Create: `src/screens/__tests__/SearchScreen.test.tsx`

**Interfaces:**
- Consumes: `validate`/`searchCitySchema` (Task 3), `searchCity` (Task 8), `addToHistory`/`getHistory` (Task 4), `SearchStackParamList` (Task 7).

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/SearchScreen.test.tsx`:

```tsx
jest.mock('../../services/weatherService', () => ({
  searchCity: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  addToHistory: jest.fn(),
  getHistory: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SearchScreen } from '../SearchScreen';
import { searchCity } from '../../services/weatherService';
import { addToHistory, getHistory } from '../../services/db';

const Stack = createNativeStackNavigator();

function renderSearch() {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="SearchHome" component={SearchScreen} />
        <Stack.Screen name="WeatherDetail" component={() => null} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('SearchScreen', () => {
  beforeEach(() => {
    (getHistory as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a validation error and does not search for an empty city', async () => {
    renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Le nom de ville est requis')).toBeTruthy();
    expect(searchCity).not.toHaveBeenCalled();
  });

  it('shows the result and records it in history on a successful search', async () => {
    (searchCity as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
    });
    renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    fireEvent.changeText(screen.getByTestId('search-city-input'), 'Paris');
    fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Paris')).toBeTruthy();
    await waitFor(() => expect(addToHistory).toHaveBeenCalledWith('Paris', 'FR', expect.any(String)));
  });

  it('shows an error message when the city is not found', async () => {
    (searchCity as jest.Mock).mockRejectedValue(new Error('Ville introuvable : Zzzzz'));
    renderSearch();
    await waitFor(() => expect(getHistory).toHaveBeenCalled());

    fireEvent.changeText(screen.getByTestId('search-city-input'), 'Zzzzz');
    fireEvent.press(screen.getByText('Rechercher'));

    expect(await screen.findByText('Ville introuvable : Zzzzz')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- SearchScreen.test.tsx`
Expected: FAIL — placeholder `SearchScreen` renders none of this.

- [ ] **Step 3: Replace `src/screens/SearchScreen.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, HelperText, List, TextInput, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validate, searchCitySchema } from '../validation/schemas';
import { searchCity, type WeatherSummary } from '../services/weatherService';
import { addToHistory, getHistory, type HistoryEntry } from '../services/db';
import type { SearchStackParamList } from '../navigation/AppTabs';

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SearchStackParamList, 'SearchHome'>>();
  const [city, setCity] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<WeatherSummary | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setHistory(await getHistory(10));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSearch() {
    setSearchError(null);
    setResult(null);
    const { value, errors } = validate(searchCitySchema, { city });
    setFieldError(errors?.city ?? null);
    if (!value) {
      return;
    }

    setIsLoading(true);
    try {
      const summary = await searchCity(value.city);
      setResult(summary);
      await addToHistory(summary.city, summary.country, new Date().toISOString());
      await loadHistory();
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <TextInput label="Rechercher une ville" value={city} onChangeText={setCity} testID="search-city-input" />
      <HelperText type="error" visible={!!fieldError}>
        {fieldError}
      </HelperText>
      <Button mode="contained" onPress={handleSearch} loading={isLoading} disabled={isLoading}>
        Rechercher
      </Button>
      {searchError ? <Text testID="search-error">{searchError}</Text> : null}
      {result ? (
        <Card style={styles.card} onPress={() => navigation.navigate('WeatherDetail', { city: result.city })}>
          <Card.Title title={result.city} subtitle={result.condition} />
          <Card.Content>
            <Text variant="displaySmall">{result.temperatureCelsius}°C</Text>
          </Card.Content>
        </Card>
      ) : null}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Historique
      </Text>
      {history.map((entry) => (
        <List.Item
          key={entry.id}
          title={entry.city}
          description={entry.country}
          onPress={() => navigation.navigate('WeatherDetail', { city: entry.city })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginVertical: 16 },
  sectionTitle: { marginBottom: 8 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- SearchScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites)

---

## Task 13: WeatherDetailScreen

**Files:**
- Modify: `src/screens/WeatherDetailScreen.tsx`
- Create: `src/screens/__tests__/WeatherDetailScreen.test.tsx`

**Interfaces:**
- Consumes: `getWeatherDetails` (Task 8), `addFavorite`/`removeFavorite`/`isFavorite` (Task 4), `DashboardStackParamList` (Task 7, reused for its `WeatherDetail` route shape).

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/WeatherDetailScreen.test.tsx`:

```tsx
jest.mock('../../services/weatherService', () => ({
  getWeatherDetails: jest.fn(),
}));

jest.mock('../../services/db', () => ({
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
  isFavorite: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WeatherDetailScreen } from '../WeatherDetailScreen';
import { getWeatherDetails } from '../../services/weatherService';
import { addFavorite, removeFavorite, isFavorite } from '../../services/db';

const Stack = createNativeStackNavigator();

function renderDetail() {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WeatherDetail">
        <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} initialParams={{ city: 'Paris' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

describe('WeatherDetailScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows the weather details for the given city', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);

    renderDetail();

    expect(await screen.findByText('Paris')).toBeTruthy();
    expect(screen.getByText('21°C')).toBeTruthy();
    expect(screen.getByText('Humidité : 55%')).toBeTruthy();
    expect(screen.getByText('Vent : 12 km/h')).toBeTruthy();
    expect(screen.getByText('Ajouter aux favoris')).toBeTruthy();
  });

  it('adds the city to favorites when the button is pressed', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(false);
    (addFavorite as jest.Mock).mockResolvedValue(undefined);

    renderDetail();
    await screen.findByText('Ajouter aux favoris');

    fireEvent.press(screen.getByText('Ajouter aux favoris'));

    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('Paris', 'FR', expect.any(String)));
    expect(await screen.findByText('Retirer des favoris')).toBeTruthy();
  });

  it('removes the city from favorites when already a favorite', async () => {
    (getWeatherDetails as jest.Mock).mockResolvedValue({
      cityId: 1,
      city: 'Paris',
      country: 'FR',
      temperatureCelsius: 21,
      condition: 'ciel dégagé',
      humidityPercent: 55,
      windSpeedKmh: 12,
    });
    (isFavorite as jest.Mock).mockResolvedValue(true);
    (removeFavorite as jest.Mock).mockResolvedValue(undefined);

    renderDetail();
    await screen.findByText('Retirer des favoris');

    fireEvent.press(screen.getByText('Retirer des favoris'));

    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('Paris'));
    expect(await screen.findByText('Ajouter aux favoris')).toBeTruthy();
  });

  it('shows an error with a retry button when the fetch fails', async () => {
    (getWeatherDetails as jest.Mock).mockRejectedValue(new Error('Ville introuvable : Paris'));
    (isFavorite as jest.Mock).mockResolvedValue(false);

    renderDetail();

    expect(await screen.findByText('Ville introuvable : Paris')).toBeTruthy();
    expect(screen.getByText('Réessayer')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- WeatherDetailScreen.test.tsx`
Expected: FAIL — placeholder `WeatherDetailScreen` renders none of this.

- [ ] **Step 3: Replace `src/screens/WeatherDetailScreen.tsx`**

```tsx
import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { getWeatherDetails, type WeatherDetails } from '../services/weatherService';
import { addFavorite, isFavorite, removeFavorite } from '../services/db';
import type { DashboardStackParamList } from '../navigation/AppTabs';

type WeatherDetailRouteProp = RouteProp<DashboardStackParamList, 'WeatherDetail'>;

export function WeatherDetailScreen() {
  const route = useRoute<WeatherDetailRouteProp>();
  const { city } = route.params;
  const [details, setDetails] = useState<WeatherDetails | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weatherDetails, favoriteState] = await Promise.all([getWeatherDetails(city), isFavorite(city)]);
      setDetails(weatherDetails);
      setFavorite(favoriteState);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [city]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFavorite() {
    if (!details) return;
    if (favorite) {
      await removeFavorite(details.city);
      setFavorite(false);
    } else {
      await addFavorite(details.city, details.country, new Date().toISOString());
      setFavorite(true);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center} testID="weather-detail-loading">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error || !details) {
    return (
      <View style={styles.center}>
        <Text>{error ?? 'Données indisponibles'}</Text>
        <Button onPress={load}>Réessayer</Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">{details.city}</Text>
      <Text>{details.condition}</Text>
      <Text variant="displayMedium">{details.temperatureCelsius}°C</Text>
      <Text>Humidité : {details.humidityPercent}%</Text>
      <Text>Vent : {details.windSpeedKmh} km/h</Text>
      <Button mode={favorite ? 'contained' : 'outlined'} onPress={toggleFavorite}>
        {favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- WeatherDetailScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites)

---

## Task 14: ProfileScreen

**Files:**
- Modify: `src/screens/ProfileScreen.tsx`
- Create: `src/screens/__tests__/ProfileScreen.test.tsx`

**Interfaces:**
- Consumes: `useAuth` (Task 6).

- [ ] **Step 1: Write the failing test**

`src/screens/__tests__/ProfileScreen.test.tsx`:

```tsx
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../ProfileScreen';
import { useAuth } from '../../context/AuthContext';

describe('ProfileScreen', () => {
  it('shows the authenticated user email', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut: jest.fn() });

    render(<ProfileScreen />);

    expect(screen.getByTestId('profile-email').props.children).toBe('user@example.com');
  });

  it('calls signOut when the logout button is pressed', () => {
    const signOut = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '1', email: 'user@example.com' }, signOut });

    render(<ProfileScreen />);
    fireEvent.press(screen.getByText('Se déconnecter'));

    expect(signOut).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ProfileScreen.test.tsx`
Expected: FAIL — placeholder `ProfileScreen` has no such content.

- [ ] **Step 3: Replace `src/screens/ProfileScreen.tsx`**

```tsx
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">Profil</Text>
      <Text testID="profile-email">{user?.email}</Text>
      <Button mode="contained" onPress={signOut}>
        Se déconnecter
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ProfileScreen.test.tsx`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS (all suites)

---

## Task 15: Documentation deliverables

**Files:**
- Create: `README.md`
- Create: `docs/security.md`
- Create: `docs/data-management.md`

No tests apply to documentation; the deliverable is the presence of complete, accurate content covering everything the subject's "Livrables attendus" section requires.

- [ ] **Step 1: Write `README.md`**

```markdown
# Weather Secure App

Application mobile React Native (Expo) : recherche météo via OpenWeather, authentification Firebase,
stockage local SQLite (historique et favoris), formulaires validés avec Joi.

## Installation

1. Installer les dépendances : `npm install`
2. Copier `.env.example` vers `.env` : `cp .env.example .env`
3. Remplir `.env` avec une clé OpenWeather et une configuration Firebase (voir ci-dessous).
4. Lancer le projet : `npm start`, puis ouvrir l'app dans Expo Go (scanner le QR code) ou un émulateur
   (`npm run android` / `npm run ios`).

## Configuration Firebase

1. Créer un projet sur https://console.firebase.google.com/.
2. Dans **Build > Authentication**, activer le fournisseur **Email/Password**.
3. Dans **Project settings > General**, enregistrer une "Web app" et copier la configuration
   (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
4. Reporter ces valeurs dans `.env`, sous les clés `EXPO_PUBLIC_FIREBASE_*`.

## Configuration OpenWeather

1. Créer un compte sur https://openweathermap.org/.
2. Récupérer la clé API par défaut sous **My API keys** (l'activation peut prendre jusqu'à 2 heures).
3. Reporter cette clé dans `.env`, sous `EXPO_PUBLIC_OPENWEATHER_KEY`.

## Scripts

- `npm start` : démarre le serveur de développement Expo
- `npm test` : lance la suite de tests Jest
- `npm run typecheck` : vérifie les types TypeScript sans compiler

## Documentation complémentaire

- [`docs/security.md`](docs/security.md) : validation des formulaires (Joi) et protections mises en place
- [`docs/data-management.md`](docs/data-management.md) : rôle de Firebase (identité) vs SQLite (données locales)
```

- [ ] **Step 2: Write `docs/security.md`**

```markdown
# Sécurité

## Validation des formulaires (Joi)

Tous les formulaires (connexion, inscription, réinitialisation du mot de passe, recherche de ville)
passent par un schéma Joi avant tout appel réseau, via le helper `validate()` de
`src/validation/schemas.ts`. Ce helper retourne soit les données validées et normalisées (`value`),
soit une table d'erreurs par champ (`errors`) — jamais les deux. Aucune soumission n'atteint Firebase,
OpenWeather ou SQLite si la validation échoue.

Schémas définis :

- `loginSchema` : email valide, mot de passe non vide.
- `registerSchema` : email valide, mot de passe fort (8 caractères minimum, au moins une majuscule et
  un chiffre), confirmation de mot de passe strictement identique.
- `forgotPasswordSchema` : email valide.
- `searchCitySchema` : nom de ville non vide, entre 2 et 85 caractères, limité aux lettres, espaces,
  apostrophes et tirets (empêche l'injection de caractères de contrôle dans la requête OpenWeather).

Chaque règle porte un message d'erreur explicite en français (`.messages({...})`), affiché directement
sous le champ concerné dans l'interface.

## Authentification (Firebase)

- Inscription, connexion, déconnexion et réinitialisation de mot de passe passent par
  `src/services/authService.ts`, qui encapsule le SDK Firebase Auth.
- Les codes d'erreur Firebase (`auth/wrong-password`, `auth/user-not-found`,
  `auth/email-already-in-use`, etc.) sont traduits en messages français explicites via `mapAuthError()` —
  aucun code technique brut n'est montré à l'utilisateur.
- La session est gérée par `onAuthStateChanged`, avec persistance locale via AsyncStorage
  (`getReactNativePersistence`) : l'utilisateur reste connecté d'un lancement à l'autre tant que son
  token est valide.

## Protection des routes

La navigation authentifiée (`AppTabs` : Dashboard, Recherche, Détail météo, Profil) n'est montée que
si `AuthContext` expose un utilisateur non nul (`RootNavigator`). Tant que l'état d'authentification
n'est pas résolu, un indicateur de chargement est affiché ; sans utilisateur, seul `AuthStack`
(connexion/inscription) est monté. La protection est donc structurelle : les écrans authentifiés ne
sont jamais instanciés pour un utilisateur non connecté, pas seulement cachés.
```

- [ ] **Step 3: Write `docs/data-management.md`**

```markdown
# Gestion des données

L'application distingue deux systèmes de stockage, chacun avec un rôle précis.

## Firebase — identité et session

Firebase Authentication stocke uniquement l'identité de l'utilisateur (email, mot de passe géré côté
Firebase, uid) et gère l'état de session. Aucune donnée métier (historique, favoris) n'y est stockée :
Firebase répond uniquement à la question "qui est connecté ?".

## SQLite — données locales de l'application

`expo-sqlite` (via `src/services/db.ts`) stocke localement, sur l'appareil, deux tables :

- `search_history (id, city, country, searched_at)` : alimentée à chaque recherche réussie depuis
  l'écran Recherche, affichée triée du plus récent au plus ancien, limitée aux N dernières entrées
  (`getHistory(limit)`).
- `favorites (id, city, country, added_at)` : alimentée/vidée depuis l'écran Détail météo
  (bouton "Ajouter/Retirer des favoris"), consultée depuis le Dashboard (accès rapide) et l'écran
  Recherche.

Ces données sont propres à l'appareil : elles ne sont pas synchronisées entre appareils et ne
transitent jamais par Firebase (aucune synchronisation Firebase/SQLite dans cette version — voir
la section "Hors scope" de la spec pour une éventuelle évolution future).
```

---

## Task 16: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS — every suite from Tasks 1–14.

- [ ] **Step 2: Run the TypeScript type check**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Manual QA checklist (Expo Go or emulator)**

Run: `npm start`, then open the app and walk through:

- [ ] Register a new account with a weak password → see the French validation error, no submission.
- [ ] Register a new account with a valid strong password → redirected into the authenticated app.
- [ ] Log out from Profile → back to the Login screen.
- [ ] Log back in with the same credentials → back into the authenticated app.
- [ ] Log in with a wrong password → see the mapped French error message.
- [ ] Search for a real city → see the result, then find it in Search history on a second visit.
- [ ] Search for a nonsense city name → see the "ville introuvable" message.
- [ ] Open a search result's Weather Detail screen, add it to favorites → it appears on the Dashboard's
      favorites list; on next app launch, the Dashboard shows this favorite's weather instead of the
      default city.
- [ ] Remove the favorite from Weather Detail → it disappears from the Dashboard favorites list.
- [ ] Turn off network (airplane mode) and retry a search → see the network error message with a
      working "Réessayer" button.

---

## Execution Handoff

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, with review between tasks.
2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.
