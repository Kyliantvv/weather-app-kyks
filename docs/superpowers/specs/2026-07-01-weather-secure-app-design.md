# Weather Secure App — Design

**Date:** 2026-07-01
**Source:** `sujet1-r.pdf` — Sujet de Projet React Native, Hitema Bachelor, Malik HARRIZ
**Deadline:** 01/07/2026 20h00

## Objectif

Application mobile React Native (Expo) permettant de rechercher la météo via l'API OpenWeather,
avec authentification sécurisée (Firebase), stockage local (SQLite) de l'historique et des favoris,
et validation stricte des formulaires (Joi).

Scope de cette itération : couvrir intégralement les exigences obligatoires du sujet (fonctionnalités,
sécurité, navigation, stockage). Les extensions bonus (géolocalisation, mode sombre, cache avancé,
sync Firebase/SQLite, graphiques) sont explicitement hors scope pour l'instant et pourront être
ajoutées dans une itération suivante une fois le socle validé.

## Stack technique

- **Framework** : Expo (managed workflow) + TypeScript
- **Auth** : `firebase` (SDK modulaire v9+), persistence via `@react-native-async-storage/async-storage`
- **API météo** : OpenWeather, appels via `fetch` natif
- **Stockage local** : `expo-sqlite`
- **Validation** : `joi` (package réel), avec polyfills Node configurés dans `metro.config.js`
  (résolution de `stream`, `crypto`, etc. via des packages compatibles React Native, par ex.
  `readable-stream`, `crypto-browserify`, `stream-browserify`)
- **Navigation** : `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`
- **UI** : `react-native-paper`

## Structure de dossiers

```
reactnative/                       (racine du projet Expo)
  App.tsx
  metro.config.js
  app.json
  .env.example
  src/
    config/
      firebase.ts        (initialisation Firebase, auth avec persistence AsyncStorage)
      env.ts             (lecture des variables d'environnement)
    navigation/
      RootNavigator.tsx   (bascule Auth/App selon AuthContext)
      AuthStack.tsx        (Login, Register, ForgotPassword)
      AppTabs.tsx          (bottom tabs : Dashboard, Search, Profile ; chacun son stack)
    screens/
      auth/
        LoginScreen.tsx
        RegisterScreen.tsx
        ForgotPasswordScreen.tsx
      DashboardScreen.tsx
      SearchScreen.tsx
      WeatherDetailScreen.tsx
      ProfileScreen.tsx
    services/
      authService.ts       (signUp, signIn, signOut, resetPassword)
      weatherService.ts     (searchCity, getWeatherDetails)
      db.ts                 (init SQLite, CRUD historique/favoris)
    validation/
      schemas.ts            (schémas Joi : login, register, searchCity)
    context/
      AuthContext.tsx       (état utilisateur, écoute onAuthStateChanged)
    types/
      index.ts
  docs/
    security.md
    data-management.md
  README.md
```

## Navigation et protection des routes

- `RootNavigator` observe `AuthContext.user` :
  - `user === null` → affiche `AuthStack`
  - `user` défini → affiche `AppTabs`
  - état de chargement initial (vérification de session) → écran de chargement
- `AuthStack` (native stack) : Login → Register / Forgot Password.
- `AppTabs` (bottom tabs) : Dashboard, Search, Profile — chaque onglet a son propre stack interne pour
  pouvoir empiler `WeatherDetailScreen` par-dessus sans perdre la barre de tabs.
- Aucune route de `AppTabs` n'est atteignable sans utilisateur authentifié : la protection est structurelle
  (le stack n'est même pas monté), pas seulement un contrôle applicatif.

## Écrans (5 minimum requis)

1. **Auth** (Login/Register/ForgotPassword) — inscription, connexion, réinitialisation mot de passe,
   validation Joi avant tout appel Firebase.
2. **Dashboard** — météo de la ville par défaut (dernière ville consultée ou ville de secours),
   accès rapide aux favoris.
3. **Recherche** — saisie d'une ville (validée par Joi), affichage des résultats, historique des
   recherches récentes (SQLite).
4. **Détail météo** — température, humidité, vitesse du vent, conditions climatiques, formatées.
5. **Profil** — informations utilisateur (email), bouton de déconnexion.

## Authentification (Firebase)

- `authService.ts` encapsule `signUp(email, password)`, `signIn(email, password)`, `signOut()`,
  `resetPassword(email)`.
- Toute soumission de formulaire passe d'abord par un schéma Joi (`validation/schemas.ts`) :
  - `loginSchema` : email valide, password non vide.
  - `registerSchema` : email valide, password fort (min. 8 caractères, au moins une majuscule et un
    chiffre), confirmation de mot de passe identique.
  - Erreurs Joi mappées en messages explicites par champ, affichés sous chaque input.
- Erreurs Firebase (`auth/email-already-in-use`, `auth/wrong-password`, `auth/user-not-found`, etc.)
  traduites en messages utilisateur clairs (pas de code d'erreur brut affiché).
- Session gérée via `onAuthStateChanged` + persistence AsyncStorage (reconnexion automatique tant que
  le token Firebase est valide).

## Intégration OpenWeather

- `weatherService.ts` :
  - `searchCity(name: string)` → résout la ville, gère le cas "ville inexistante" (404).
  - `getWeatherDetails(cityId)` → température, humidité, vent, conditions.
- Clé API lue depuis variable d'environnement (`EXPO_PUBLIC_OPENWEATHER_KEY`), jamais commitée en dur.
- Gestion des erreurs :
  - Ville inexistante → message dédié ("Ville introuvable, vérifiez l'orthographe").
  - Erreur réseau/timeout → message + bouton "Réessayer".
  - Indicateur de chargement (`ActivityIndicator` React Native Paper) pendant les requêtes.
- Formatage : conversion Kelvin → Celsius, arrondis, libellés français des conditions.

## Stockage local (SQLite)

Tables :

- `search_history (id INTEGER PRIMARY KEY, city TEXT, country TEXT, searched_at TEXT)`
- `favorites (id INTEGER PRIMARY KEY, city TEXT, country TEXT, added_at TEXT)`

Fonctions dans `db.ts` : `initDb`, `addToHistory`, `getHistory(limit)`, `addFavorite`, `removeFavorite`,
`getFavorites`, `isFavorite(city)`.

- L'historique est alimenté à chaque recherche réussie depuis l'écran Recherche.
- Les favoris sont gérés depuis le Dashboard et l'écran Détail météo (bouton "ajouter/retirer des favoris").

## Validation Joi — détail

- `validate(schema, data)` : helper unique utilisé sur tous les formulaires, retourne
  `{ value, errors }` où `errors` est un objet `{ champ: message }` ou `null` si valide.
- Schémas définis pour : login, register (avec confirmation de mot de passe), recherche de ville
  (chaîne non vide, longueur maximale, caractères autorisés).
- Aucune soumission (Firebase ou navigation) n'a lieu si la validation Joi échoue.

## Gestion des erreurs (transverse)

- Toutes les opérations asynchrones (auth, fetch OpenWeather, SQLite) sont enveloppées avec gestion
  d'erreur et état de chargement explicite dans l'UI (spinner, message d'erreur, retry si pertinent).
- Aucune erreur technique brute (stack trace, code HTTP) n'est affichée directement à l'utilisateur.

## Livrables

- Code source dans le dossier `reactnative/` (dépôt Git à initialiser séparément par l'utilisateur —
  voir note ci-dessous).
- `README.md` : installation, configuration Firebase (étapes de création de projet + récupération des
  clés), configuration de la clé API OpenWeather, lancement du projet (`expo start`).
- `docs/security.md` : explication de la validation Joi et des protections mises en place
  (routes protégées, gestion de session).
- `docs/data-management.md` : explication du rôle de Firebase (identité/session) vs SQLite
  (données locales : historique, favoris).

## Note sur Git

Le dossier `reactnative` est actuellement imbriqué dans un dépôt Git existant qui couvre tout le
répertoire utilisateur (`C:\Users\Kylian`) et contient des fichiers sans rapport avec ce projet.
L'utilisateur a choisi de gérer lui-même l'initialisation d'un dépôt Git dédié et les commits pour ce
projet — l'implémentation ne doit donc pas exécuter de commandes `git init`, `git add` ou `git commit`
dans ce dossier.

## Hors scope (cette itération)

- Géolocalisation pour météo automatique
- Mode sombre
- Cache avancé au-delà du strict nécessaire
- Synchronisation Firebase ↔ SQLite
- Graphiques météo
