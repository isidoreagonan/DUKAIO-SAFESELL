# Changelog (Historique des modifications)

Ce fichier garde la trace de toutes les modifications et corrections apportées au projet.

> **Note d'environnement :** Ce projet a été initialement généré avec Lovable, mais a été entièrement migré sur Antigravity. Il n'est plus synchronisé avec Lovable Cloud et utilise désormais exclusivement la propre instance Supabase de l'utilisateur.

## [10/09/2026] - SEO Complet, Alignement COD & Image de Partage Réseaux Sociaux

### Ajouté & Amélioré
- **Stratégie SEO complète de toutes les pages publiques :**
  - Configuration individualisée des balises `<title>`, méta-descriptions percutantes, mots-clés stratégiques et tags Open Graph (`og:title`, `og:description`, `og:image`, `og:url`) sur l'ensemble des routes publiques :
    - `/` (Accueil) : `DUKAIO — Créez votre boutique en ligne et vendez partout`
    - `/about` (À propos) : `À propos de DUKAIO — L'histoire d'AGONAN Isidore Abraham`
    - `/tendances` (Découverte) : `Tendances E-commerce & Produits Gagnants | DUKAIO`
    - `/login` (Connexion) : `Connexion Vendeur — Accédez à votre espace | DUKAIO`
    - `/signup` (Inscription) : `Créer ma boutique en ligne gratuitement | DUKAIO`
    - `/mot-de-passe-oublie` : `Réinitialisation du mot de passe | DUKAIO` (`noindex, follow`)
    - `/rejoindre` : `Rejoindre une équipe de vente | DUKAIO`
    - `/mentions-legales` : `Mentions légales | DUKAIO`
    - `/confidentialite` : `Politique de confidentialité & CGU | DUKAIO`
- **Génération & configuration du Sitemap Google & Robots.txt :**
  - Création de `public/sitemap.xml` respectant le standard `sitemaps.org` avec toutes les URLs canoniques, priorités (`1.0`, `0.9`, `0.8`, `0.7`, `0.3`), fréquences de rafraîchissement et intégration de l'image de partage. Prêt pour soumission immédiate sur Google Search Console (`sitemap.google.com`).
  - Création de `public/robots.txt` autorisant l'indexation de toutes les pages publiques et protégeant les espaces privés (`/dashboard/`, `/admin/`, `/api/`).
- **Alignement 100% Produits Physiques & Paiement à la livraison (COD) :**
  - **Suppression intégrale** de toutes les mentions de « produits digitaux », « cartes bancaires » et « mobile money » sur l'ensemble des pages publiques, balises SEO, témoignages, FAQ et mentions légales.
  - **Nouvelle phrase d'accroche SEO & Réseaux Sociaux officielle :**
    - Titre : `DUKAIO — Vendez vos produits. Encaissez à la livraison.`
    - Description : `DUKAIO est la plateforme e-commerce tout-en-un pour vendre vos produits physiques : création de boutique en quelques clics, gestion des commandes, suivi des livraisons et encaissement à la réception (COD).`
  - **Harmonisation complète du Hero et des piliers de la Landing Page :**
    - Titre Hero : *« Vendez vos produits. Encaissez à la livraison. »*
    - Piliers : Vitrine connectée, Gestion des commandes & stocks physiques, Encaissements sécurisés à la livraison.
- **Image officielle de partage réseaux sociaux (`og-image.png`) :**
  - Déploiement de l'image officielle haute résolution *« Livrez à vos clients partout.png »* (1200x630px) avec dimensions explicites pour garantir un aperçu visuel élégant lors des partages sur WhatsApp, Facebook, Telegram, Twitter, etc.
- **Photo officielle du fondateur (Page À propos & Landing) :** Intégration de la photo officielle d'**AGONAN Isidore Abraham** (`isidore.png`) sur la page [about.tsx](file:///c:/Users/DELL/Desktop/DUKAIO%20SAFESELL/src/routes/about.tsx) dans la section *« Le fondateur »* avec badge et présentation.
- **Graphiques d'analyse e-commerce réalistes & ondulés :** Refonte complète du module `src/components/discovery/charts.tsx` avec le composant interactif `StoreAnalyticsCard` et le générateur de trajectoire `generateStoreAnalyticsTimeline`. Fini les lignes plates ou barres isolées : les graphes présentent des courbes fines, douces et réalistes avec des fluctuations naturelles.
- **Infobulles interactives complètes (« qui parlent » au survol) :** Survol d'un point de la courbe affichant en temps réel le C.A. estimé (en FCFA avec badge $+/-X\%$), le nombre de commandes, le panier moyen, le trafic web (visites + visiteurs uniques), les pubs actives et le budget média estimé.
- **Nettoyage & Stockage permanent Supabase des visuels Découverte :**
  - Purge complète des anciennes annonces aux liens temporaires Meta CDN expirés (HTTP 403).
  - Sauvegarde et réplication automatique de tous les visuels actifs directement dans le stockage Supabase (`store-media/discovery/`) avec URLs publiques permanentes.
  - Élimination totale des encadrés gris « Visuel expiré chez Meta ».
- **Sécurisation de l'affichage des images (`SafeImage`) :** Création du composant `SafeImage` ([safe-image.tsx](file:///c:/Users/DELL/Desktop/DUKAIO%20SAFESELL/src/components/discovery/safe-image.tsx)) avec politique `referrerPolicy="no-referrer"` et gestion d'erreur `onError`.

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
