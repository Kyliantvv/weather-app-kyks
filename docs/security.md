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
