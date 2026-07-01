# Documentation technique

## Stack

- **Expo** (React Native 0.76 / React 18) — cible mobile (Android/iOS) et web via `react-native-web`.
- **React Navigation** — un stack racine (`AuthStack` vs `AppTabs`) monté conditionnellement, puis une
  navigation par onglets (`bottom-tabs`) contenant deux stacks internes (`native-stack`).
- **React Native Paper** (Material Design 3) — composants d'interface et thèmes clair/sombre.
- **Firebase Auth** — identité et session utilisateur.
- **Firebase Firestore** — sauvegarde cloud optionnelle de l'historique/des favoris.
- **expo-sqlite** — stockage local de l'historique de recherche et des favoris.
- **expo-location** — géolocalisation pour la météo "position actuelle".
- **Joi** — validation des formulaires.
- **Jest + Testing Library** — tests unitaires et de composants, un fichier `__tests__` par module.

## Arborescence

```
src/
  components/     composants UI réutilisables (WeatherChart)
  config/         accès à l'environnement (env.ts) et initialisation Firebase (firebase.ts)
  context/        state global via React Context (AuthContext, ThemeContext)
  navigation/      RootNavigator, AuthStack, AppTabs
  screens/        écrans authentifiés + sous-dossier auth/ pour connexion/inscription
  services/       accès réseau et stockage (authService, weatherService, db, locationService, syncService)
  validation/     schémas Joi partagés par les formulaires
```

Chaque dossier a son propre `__tests__/`, colocalisé avec le code qu'il teste.

## Flux de démarrage

1. `App.tsx` initialise SQLite (`initDb`) au montage, puis englobe l'app dans `ThemeProvider` et
   `AuthProvider`.
2. `AuthProvider` s'abonne à `onAuthStateChanged` (Firebase) et expose `user` / `isLoading` via
   `useAuth()`.
3. `RootNavigator` affiche un loader tant que `isLoading` est vrai, puis bascule entre `AuthStack`
   (utilisateur non connecté) et `AppTabs` (utilisateur connecté) — voir "Protection des routes"
   plus bas.
4. Dès qu'un utilisateur est authentifié, `AppContent` déclenche `mergeFromCloud()` (best-effort,
   erreurs avalées) pour rapatrier l'historique/les favoris sauvegardés sur un autre appareil.

## Navigation

- `AppTabs` (bottom tabs) : **Dashboard**, **Search**, **Profile**.
- Dashboard et Search sont chacun un `native-stack` avec un écran `WeatherDetail` partagé, paramétré
  par `{ city: string }` (voir `DashboardStackParamList` / `SearchStackParamList` dans `AppTabs.tsx`).
- Profile est un écran plat (déconnexion, bascule thème sombre).
- `AuthStack` (non connecté) : Login, Register, ForgotPassword.

## State management

Pas de librairie de state globale : deux React Context suffisent au périmètre de l'app.

- **AuthContext** — expose `user`, `isLoading`, et les actions `signIn/signUp/signOut/resetPassword`
  qui délèguent à `authService`. C'est la seule source de vérité pour "l'utilisateur est-il connecté".
- **ThemeContext** — expose `isDarkMode`/`toggleDarkMode`, persisté dans AsyncStorage
  (`theme-preference`) et relu au démarrage. `App.tsx` traduit `isDarkMode` en thèmes Paper et
  React Navigation.

Le reste de l'état (résultats météo, historique, favoris) est local aux écrans qui les utilisent —
récupéré à la demande depuis les services plutôt que mis en cache globalement.

## Couche services

Chaque service encapsule un système externe et ne fuit jamais ses détails vers les écrans :

- `weatherService.ts` — appels OpenWeather (recherche par ville, par coordonnées, prévisions).
  Convertit Kelvin → Celsius et m/s → km/h, et normalise les erreurs en `CityNotFoundError` /
  `WeatherNetworkError` (jamais de code HTTP brut affiché à l'utilisateur).
- `authService.ts` — encapsule Firebase Auth, traduit les codes d'erreur (`mapAuthError`).
- `db.ts` — CRUD SQLite sur `search_history` et `favorites`, expose des types (`HistoryEntry`,
  `FavoriteEntry`) indépendants du schéma SQL.
- `locationService.ts` — demande la permission de géolocalisation et retourne des coordonnées ou
  `null` (jamais d'exception qui remonterait à l'écran).
- `syncService.ts` — synchronisation optionnelle avec Firestore (`sync/{uid}`) : `pushSyncSnapshot`
  envoie l'état local, `pullSyncSnapshot`/`mergeFromCloud` rapatrient et fusionnent sans écraser les
  entrées locales existantes (déduplication par ville pour les favoris, par `ville+date` pour
  l'historique). Toute erreur réseau ou Firestore désactivé est silencieusement ignorée : la sync est
  un bonus, jamais un prérequis au fonctionnement de l'app.

## Composants

`WeatherChart` est le seul composant partagé : il prend une liste de `ForecastEntry` (`weatherService`)
et affiche un histogramme de températures sans dépendance à une librairie de graphes.

## Sécurité

### Validation des formulaires (Joi)

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

### Authentification (Firebase)

- Inscription, connexion, déconnexion et réinitialisation de mot de passe passent par
  `src/services/authService.ts`, qui encapsule le SDK Firebase Auth.
- Les codes d'erreur Firebase (`auth/wrong-password`, `auth/user-not-found`,
  `auth/email-already-in-use`, etc.) sont traduits en messages français explicites via `mapAuthError()` —
  aucun code technique brut n'est montré à l'utilisateur.
- La session est gérée par `onAuthStateChanged`, avec persistance locale via AsyncStorage
  (`getReactNativePersistence`) : l'utilisateur reste connecté d'un lancement à l'autre tant que son
  token est valide.

### Protection des routes

La navigation authentifiée (`AppTabs` : Dashboard, Recherche, Détail météo, Profil) n'est montée que
si `AuthContext` expose un utilisateur non nul (`RootNavigator`). Tant que l'état d'authentification
n'est pas résolu, un indicateur de chargement est affiché ; sans utilisateur, seul `AuthStack`
(connexion/inscription) est monté. La protection est donc structurelle : les écrans authentifiés ne
sont jamais instanciés pour un utilisateur non connecté, pas seulement cachés.

## Gestion des données

L'application distingue deux systèmes de stockage, chacun avec un rôle précis.

### Firebase — identité et session

Firebase Authentication stocke uniquement l'identité de l'utilisateur (email, mot de passe géré côté
Firebase, uid) et gère l'état de session. Aucune donnée métier (historique, favoris) n'y est stockée :
Firebase répond uniquement à la question "qui est connecté ?".

### SQLite — données locales de l'application

`expo-sqlite` (via `src/services/db.ts`) stocke localement, sur l'appareil, deux tables :

- `search_history (id, city, country, searched_at)` : alimentée à chaque recherche réussie depuis
  l'écran Recherche, affichée triée du plus récent au plus ancien, limitée aux N dernières entrées
  (`getHistory(limit)`).
- `favorites (id, city, country, added_at)` : alimentée/vidée depuis l'écran Détail météo
  (bouton "Ajouter/Retirer des favoris"), consultée depuis le Dashboard (accès rapide) et l'écran
  Recherche.

Ces données vivent d'abord sur l'appareil : toutes les lectures/écritures de l'interface passent par
SQLite, jamais directement par Firestore.

### Synchronisation cloud (Firestore) — optionnelle

`src/services/syncService.ts` sauvegarde une copie de l'historique et des favoris dans Firestore, sous
`sync/{uid}`, pour permettre de les retrouver sur un autre appareil :

- `pushSyncSnapshot()` envoie l'état SQLite local vers Firestore (déclenché manuellement via
  `syncNow()`, par exemple depuis l'écran Profil).
- `mergeFromCloud()` est appelé automatiquement à chaque connexion (`App.tsx`) : il récupère le
  snapshot distant et ajoute dans SQLite les favoris/entrées d'historique qui n'existent pas encore
  localement (déduplication par ville pour les favoris, par `ville + date` pour l'historique). Rien
  n'est jamais écrasé côté local.
- Toute erreur (pas de réseau, Firestore non activé sur le projet Firebase) est avalée silencieusement :
  la synchronisation est un confort, jamais une dépendance pour utiliser l'app hors ligne.

## Tests

Chaque module (service, contexte, écran, composant, navigation) a son fichier de test miroir. Les
services réseau/stockage sont testés en mockant `fetch` ou le SDK correspondant ; les écrans sont
testés via Testing Library en mockant les hooks de contexte et les services qu'ils appellent.
