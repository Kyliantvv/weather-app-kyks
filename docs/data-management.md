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
