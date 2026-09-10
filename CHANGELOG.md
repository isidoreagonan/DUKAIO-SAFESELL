# Changelog (Historique des modifications)

Ce fichier garde la trace de toutes les modifications et corrections apportées au projet.

> **Note d'environnement :** Ce projet a été initialement généré avec Lovable, mais a été entièrement migré sur Antigravity. Il n'est plus synchronisé avec Lovable Cloud et utilise désormais exclusivement la propre instance Supabase de l'utilisateur.

## [10/09/2026] - Refonte Graphiques Découverte, Rendu des Images & Sécurité des Données

### Ajouté & Amélioré
- **Graphiques d'analyse e-commerce réalistes & ondulés :** Refonte complète du module `src/components/discovery/charts.tsx` avec le composant interactif `StoreAnalyticsCard` et le générateur de trajectoire `generateStoreAnalyticsTimeline`. Fini les lignes plates ou barres isolées : les graphes présentent des courbes fines, douces et réalistes avec des fluctuations naturelles (pics publicitaires, rebonds de vente, creux de saisonnalité).
- **Infobulles interactives complètes (« qui parlent » au survol) :** Survol d'un point de la courbe affichant en temps réel le C.A. estimé (en FCFA avec badge $+/-X\%$), le nombre de commandes, le panier moyen, le trafic web (visites + visiteurs uniques), les pubs actives et le budget média estimé.
- **Sélecteur de métrique dynamique :** Possibilité de basculer la courbe principale en 1 clic entre **C.A.**, **Trafic**, **Commandes** et **Pubs**.
- **Sécurisation de l'affichage des images (`SafeImage`) :** Création du composant `SafeImage` (`src/components/discovery/safe-image.tsx`) avec politique `referrerPolicy="no-referrer"` et gestion d'erreur `onError` pour charger les images Meta CDN sans blocage et remplacer les visuels expirés par des avatars et icônes soignés sans icône brisée (`src/components/discovery/product-table.tsx`, `store-card.tsx`, `ad-card.tsx`, `analysis-dialog.tsx`).

### Corrigé
- **Suppression des chiffres aberrants (160+ milliards de FCFA) :** Filtrage strict dans `src/lib/traffic.functions.ts` des domaines de redirection génériques (`fb.me`, `fb.com`, `instagram.com`, `wa.me`, `bit.ly`, `linktr.ee`, `tiktok.com`, etc.) afin que le trafic mondial des géants de la tech ne vienne plus fausser les chiffres d'une boutique.
- **Honnêteté des estimations (zéro chiffre inventé) :** Lorsque le catalogue d'une boutique est privé ou inaccessible, le système affiche clairement *« Non estimable — Catalogue public non accessible : aucun chiffre inventé »* au lieu de générer des estimations arbitraires.
- **Crash d'ouverture du modal d'analyse (*Rules of Hooks*) :** Réorganisation de l'ordre d'appel des hooks React dans `src/components/discovery/analysis-dialog.tsx` pour éliminer l'erreur *« Rendered more hooks than during the previous render »* lors du clic sur *Analyser*.

---

## [09/09/2026] - Bot Telegram, Commandes & Dashboard

### Ajouté
- **Bouton « Tout marquer lu » dans les notifications :** Ajout de l'action rapide `CheckCheck` et suppression individuelle des alertes dans le popover de notifications (`src/components/dashboard/notifications.tsx`).
- **Bouton Paramètres dédié dans la barre latérale :** Ajout d'une icône ⚙️ indépendante à côté de la carte de profil et dans la navigation pour éviter toute redirection accidentelle lors du clic sur le profil (`src/components/dashboard/shell.tsx`).

### Corrigé
- **Détection des commandes par le Bot Telegram :** Correction de la requête SQL dans `src/lib/telegram.server.ts` (utilisation de `shipping_city` au lieu de `city` et fallback robuste `store_id`/`user_id`) permettant au bot d'afficher immédiatement les commandes reçues via la commande `/commandes`.
- **Refonte de la création de produits dans Telegram :** Suppression du scrapping in-chat instable au profit d'une redirection fluide vers le studio IA Web DUKAIO (`/dashboard/produits/ia`).
- **Sécurisation des claviers Telegram :** Ajout de `sanitizeKeyboard` dans `src/lib/telegram.server.ts` pour empêcher les erreurs Telegram `400 Bad Request` liées aux URL locales.

---

## [08/09/2026] - Corrections Storefront & Éditeur de Thème

### Corrigé
- **Écran blanc sur les sous-domaines (`lumezia-bef30f.dukaio.com`) :** Correction d'un crash React causé par une configuration de thème incomplète générée lors de l'onboarding. La fonction `readThemeConfig` dans `src/theme/personalize.ts` injecte désormais la structure des pages manquantes (`product`, `contact`) pour éviter les valeurs `undefined`.
- **Validation des images (Visuel non autorisé) :** Assouplissement de la fonction `isSafeImage` dans `src/theme/validate.ts` pour autoriser les URL locales (`http://`, `blob:`) et les chemins relatifs (`/`), empêchant ainsi le blocage de la publication de la boutique.
- **Scroll de l'aperçu dans l'éditeur de thème :** Suppression de la logique problématique de redimensionnement de l'iframe dans `src/components/editor/PreviewFrame.tsx`. L'iframe utilise désormais `height: 100%` et gère son propre défilement (modifications dans `PreviewFrame.tsx` et `LivePreview.tsx`).
- **Crash écran blanc à l'accueil (Boutique) :** Correction d'un erreur `TypeError: Cannot read properties of undefined (reading 'handle')` due à la désérialisation du contexte dans TanStack Router lors de l'hydratation côté client (`src/routes/index.tsx`).
- **Erreur "new row violates row-level security policy" lors de l'ajout d'image :** Correction des politiques RLS de stockage Supabase (`supabase/migrations/fix_storage_rls.sql`).
- **Affichage "Clé API non configurée" pour Gemini dans le panneau Admin :** Prise en compte de la configuration `GOOGLE_VERTEX_SA_JSON` via `hasGeminiKey()` dans `adminAiEngineGet`.
- **Refonte de la page "Boutique introuvable" :** Nouveau design sombre et professionnel inspiré de Shopify avec branding DUKAIO (`src/components/site/Storefront.tsx`).
- **Nouveau Menu Latéral (Dashboard) :** Refonte compacte et intuitive avec sous-menus visibles (`src/components/dashboard/shell.tsx`).
