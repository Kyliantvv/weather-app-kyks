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

- [`docs/documentation.md`](docs/documentation.md) : architecture, sécurité, gestion des données
