# Changelog (Historique des modifications)

Ce fichier garde la trace de toutes les modifications et corrections apportées au projet.

> **Note d'environnement :** Ce projet a été initialement généré avec Lovable, mais a été entièrement migré sur Antigravity. Il n'est plus synchronisé avec Lovable Cloud et utilise désormais exclusivement la propre instance Supabase de l'utilisateur.

## [08/09/2026] - Corrections Storefront & Éditeur de Thème

### Corrigé
- **Écran blanc sur les sous-domaines (`lumezia-bef30f.dukaio.com`) :** Correction d'un crash React causé par une configuration de thème incomplète générée lors de l'onboarding. La fonction `readThemeConfig` dans `src/theme/personalize.ts` injecte désormais la structure des pages manquantes (`product`, `contact`) pour éviter les valeurs `undefined`.
- **Validation des images (Visuel non autorisé) :** Assouplissement de la fonction `isSafeImage` dans `src/theme/validate.ts` pour autoriser les URL locales (`http://`, `blob:`) et les chemins relatifs (`/`), empêchant ainsi le blocage de la publication de la boutique.
- **Scroll de l'aperçu dans l'éditeur de thème :** Suppression de la logique problématique de redimensionnement de l'iframe dans `src/components/editor/PreviewFrame.tsx`. L'iframe utilise désormais `height: 100%` et gère son propre défilement (modifications dans `PreviewFrame.tsx` et `LivePreview.tsx`).

- **Crash écran blanc à l'accueil (Boutique) :** Correction d'une erreur \TypeError: Cannot read properties of undefined (reading 'handle')\ due à la désérialisation du contexte dans TanStack Router lors de l'hydratation côté client (correction dans \src/routes/index.tsx\).
- **Erreur "new row violates row-level security policy" lors de l'ajout d'image :** Le problème est dû à une configuration trop stricte de la politique (Row-Level Security) sur le bucket de stockage Supabase. Un script SQL (`supabase/migrations/fix_storage_rls.sql`) a été généré pour corriger les règles `storage.objects` (remplacement de la fonction complexe `storage.foldername` par la colonne standard `owner`).
- **Affichage "Clé API non configurée" pour Gemini dans le panneau Admin :** L'interface administrateur vérifiait uniquement l'existence de la variable `GEMINI_API_KEY` au lieu d'accepter également la configuration via `GOOGLE_VERTEX_SA_JSON` (Google Cloud Service Account). Cela est désormais corrigé via l'utilisation de `hasGeminiKey()` dans `adminAiEngineGet`.
- **Refonte de la page "Boutique introuvable" :** Remplacement de la page d'erreur basique par un design sombre et professionnel inspiré de Shopify, avec le branding DUKAIO, un message clair d'indisponibilité, et des liens d'assistance pour le propriétaire (`src/components/site/Storefront.tsx`).
- **Nouveau Menu Latéral (Dashboard) :** Refonte complète du menu de navigation pour qu'il soit ultra-compact (comme Vercel ou Shopify). Intégration de sous-menus toujours visibles pour la Découverte (Boutiques, Produits, Publicités), les Produits (Créer avec l'IA, Mes Produits) et les Commandes (Mes commandes, Paniers abandonnés), sans nécessiter de scroll vertical (`src/components/dashboard/shell.tsx`).
