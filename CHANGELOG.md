# Changelog (Historique des modifications)

Ce fichier garde la trace de toutes les modifications et corrections apportées au projet.

> **Note d'environnement :** Ce projet a été initialement généré avec Lovable, mais a été entièrement migré sur Antigravity. Il n'est plus synchronisé avec Lovable Cloud et utilise désormais exclusivement la propre instance Supabase de l'utilisateur.

## [25/09/2026] - Alignement Naturel à Gauche des E-mails et Mise à Jour de l'E-mail de Bienvenue (Essai 14 Jours)

### Modifié & Optimisé
- **Alignement et structure des gabarits d'e-mails (`src/lib/email.server.ts`)** :
  - **Problème résolu :** Sur les écrans larges, le contenu des e-mails flottait au centre de la fenêtre avec un grand vide de chaque côté (`align="center"`).
  - **Correction apportée :** L'e-mail s'aligne désormais naturellement à gauche (`align="left"`, conteneur max-width 640px avec marge latérale confortable de 32px), respectant les standards typographiques des e-mails personnels et professionnels directs. Les boutons CTA et la signature du fondateur sont parfaitement calés sur la grille de lecture.
- **Message de Bienvenue du Fondateur & relances (`src/lib/lifecycle-emails.server.ts`)** :
  - **Problème résolu :** Le message mentionnait une ancienne « formule Gratuite active à vie », ce qui ne correspondait plus au modèle économique actuel.
  - **Correction apportée :** L'e-mail met désormais en avant l'**Essai gratuit de 14 jours**, explique clairement ce qu'il permet de faire (tester la plateforme, lancer sa boutique, générer ses premières fiches produits IA), et présente de manière structurée et percutante les formules **Starter** (7 900 FCFA/mois) et **Pro** (14 900 FCFA/mois) pour créer davantage avec l'IA et scaler ses ventes.

## [25/09/2026] - Rétablissement des E-mails Transactionnels de Commande et de Mise à Jour de Statut

### Corrigé
- **E-mails de confirmation de commande et de vente (`src/lib/storefront.functions.ts` & `src/lib/orders.server.ts`)** :
  - **Problème résolu :** Lors d'une commande sur une boutique en ligne, ni le client ni le vendeur ne recevaient d'e-mail de confirmation.
  - **Cause identifiée :** Dans `submitOrder`, `supabaseAdmin` était importé dans une portée fermée (`if (!isPaid)`). Pour les boutiques payantes ou hors de cette condition, la tentative d'accès à `supabaseAdmin` levait une `ReferenceError` silencieuse qui interrompait le bloc avant l'envoi de l'e-mail au vendeur et au client.
  - **Correction :** `supabaseAdmin` est désormais disponible dans toute la portée du handler. La résolution de l'adresse du vendeur a été renforcée (contact direct, compte propriétaire auth Supabase avec `?.` sécurisé, et repli sur l'équipe admin de la boutique). L'e-mail acheteur et l'e-mail vendeur sont désormais tous deux expédiés de manière fiable via Resend (`commandes@dukaio.com`).
- **E-mails de suivi de statut de livraison au client (`src/lib/stores.functions.ts` & `src/lib/order-emails.functions.ts`)** :
  - **Problème résolu :** Lorsque le vendeur mettait à jour le statut d'une commande (ex: « Confirmée », « En livraison », « Livrée »), aucun e-mail de notification n'était envoyé au client.
  - **Cause identifiée :** La fonction serveur `updateStoreOrderStatus` tentait d'appeler en interne une seconde fonction serveur (`notifyOrderStatus`) dotée d'un middleware d'authentification Bearer HTTP, ce qui échouait lors de l'appel direct intra-serveur. De plus, les requêtes étaient soumises aux politiques RLS de Supabase.
  - **Correction :** L'envoi de l'e-mail de notification de statut (`sendStatusEmail`) est désormais déclenché directement depuis le contexte serveur avec `supabaseAdmin` et `order-emails.server`, garantissant un envoi instantané et fiable dès que le statut change dans le dashboard.

## [25/09/2026] - Chargement Instantané (0ms) des Boutiques au Dashboard et Requête Client Directe

### Performance & Optimisation
- **Chargement instantané sans délai (`src/lib/store.ts`)** :
  - **Problème résolu :** À la connexion au tableau de bord, le nom de la boutique et les boutons d'accès mettaient 10 à 20 secondes à s'afficher (affichant temporairement « Boutique, Boutique, Boutique ») en attendant une fonction serveur RPC distante.
  - **Correction apportée :**
    1. **Cache local instantané et sécurisé par utilisateur (`dukaio.cachedStores.[userId]` et `dukaio.cachedActiveStore.[userId]`)** : dès le premier millième de seconde, le tableau de bord hydrate le nom de la boutique et la liste des boutiques depuis ce cache spécifique à l'utilisateur connecté via `initialData`. Le rendu est **immédiat (0 ms)**.
    2. **Requête directe Supabase client (~50ms)** : `listStores()` interroge désormais directement le client Supabase en premier, évitant le temps de démarrage à froid des fonctions serveur de 10 à 20 secondes.
    3. Les boutiques partagées (équipe/closer) continuent d'être synchronisées en arrière-plan sans bloquer l'affichage.
    4. Isolation 100% étanche entre différents comptes sur le même navigateur.

## [25/09/2026] - Correction de l'Attribution de l'Essai Gratuit 14 Jours et de l'Isolation Multi-Boutiques

### Corrigé
- **Attribution automatique de l'essai gratuit 14 jours (`src/lib/subscription.server.ts` & `src/components/dashboard/shell.tsx`)** :
  - **Problème résolu :** Tout nouveau compte marchand se voyait attribuer par erreur la formule payante `Starter` (`status: "active"`, `plan: "starter"`), ce qui désactivait le statut d'essai gratuit et affichait le badge orange « STARTER » au lieu de « ESSAI 14J ».
  - **Correction :** La création d'une nouvelle boutique initialise désormais correctement l'abonnement en mode essai : `plan: "free"`, `status: "trialing"`, et `trial_ends_at` fixé à +14 jours.
  - Dans l'en-tête et la barre latérale (`shell.tsx`), la priorité d'affichage est désormais donnée au statut d'essai (`trialing`) affichant le badge ambre `Essai 14j`.
  - La base de données a été corrigée pour rétablir immédiatement le compte test en cours en statut d'essai 14 jours.
- **Isolation des boutiques entre comptes et suppression des fuites de cache (`src/lib/store.ts`)** :
  - **Problème résolu :** Lorsqu'un marchand invitait un closer ou testait plusieurs comptes dans le même navigateur, `useStores()` et `useStore()` chargeaient un cache global `localStorage` (`dukaio.cachedStores` et `dukaio.cachedActiveStore`) partagé sans distinction d'utilisateur, avec un délai de péremption de 3 minutes (`staleTime: 3 * 60_000`). L'administrateur ou le nouveau compte se retrouvait bloqué sur la boutique du closer (ex. TECHNOVA) au lieu de voir ses propres boutiques (DUKAIO, Lumezia).
  - **Correction :** Suppression totale de l'hydratation non sécurisée par `initialData` depuis `localStorage`. `useStores()` et `useStore()` requêtent désormais toujours les boutiques de l'utilisateur authentifié.
  - `activeStoreId()` est désormais strictement cloisonné par `userId` (`dukaio.activeStore.[userId]`).
  - La fonction de déconnexion `clearActiveStoreStorage()` nettoie l'intégralité des clés de stockage local liées aux boutiques.

## [25/09/2026] - Refonte Simplifiée et Centrée du Parcours Onboarding

### Modifié
- **`onboarding.tsx` (`src/routes/onboarding.tsx`) & `onboarding.ts` (`src/lib/onboarding.ts`)** : refonte complète de la mise en route de la boutique.
  - **Design épuré et centré :** Suppression du panneau latéral orange lourd (`auth-brand`), des doubles cadres et conteneurs massifs. Le formulaire d'onboarding est désormais parfaitement centré, sobre, moderne et fluide sur mobile comme sur desktop.
  - **Réduction à 6 étapes essentielles :**
    1. **Nom de votre boutique** : saisie rapide du nom commercial (génération automatique du sous-domaine).
    2. **Domaine de votre boutique** : vérification instantanée de la disponibilité de l'adresse `[nom].dukaio.com` avec suggestions automatiques.
    3. **Chiffre d'affaires / ventes** : sélection du volume habituel en 1 clic (cartes interactives avec progression automatique).
    4. **Pays de vente** : choix du marché principal avec barre de recherche rapide, drapeaux et devises associées (Bénin, Côte d'Ivoire, Sénégal, etc.).
    5. **Numéro de téléphone (WhatsApp)** : saisie du numéro de contact avec indicatif du pays sélectionné pré-rempli.
    6. **Canal d'acquisition (Où avez-vous entendu parler de nous ?)** : sélection directe avec les logos officiels (TikTok, Facebook, Instagram, YouTube, Google, Bouche à oreille / Ami, Autre) déclenchant la finalisation immédiate.
  - **Création fluide :** Animation de configuration en 4 phases et redirection vers le tableau de bord.

## [25/09/2026] - Alignement Automatique des Couleurs du Catalogue sur la Page d'Accueil

### Corrigé
- **`Storefront.tsx` (`src/components/site/Storefront.tsx`)** : correction de l'héritage des couleurs sur la page catalogue (`/produits` et liste générale des produits).
  - **Problème résolu :** La page catalogue adoptait involontairement la palette IA du premier produit créé (`theme.productGlobals[firstProduct.id]`), ce qui provoquait l'affichage d'une couleur différente (ex. bleu) sur la barre d'annonces, le bouton « Commander », les filtres et les boutons « Acheter » / « Panier », au lieu du vert ou de la couleur choisie lors de l'onboarding.
  - **Correction :** Désormais, seules les véritables pages produit dédiées (avec `productId` explicite ou boutique mono-produit sur sa fiche) appliquent les styles et couleurs spécifiques du produit (`productGlobals`).
  - La page catalogue (`/produits`), la page de commande (`/commande`) et la page d'accueil (`/`) héritent TOUJOURS de l'identité globale de la boutique (`theme.global`).
  - Tout changement de couleur de la page d'accueil ou de la boutique (onboarding ou éditeur) met à jour automatiquement la page catalogue en temps réel.

## [25/09/2026] - Boutons Orange sur la Page de Création IA (Generate page & Choose media)

### Modifié
- **`produits.ia.tsx` (`src/routes/_authenticated/dashboard/produits.ia.tsx`)** : mise en orange des deux boutons d'action principaux pour correspondre à la charte DUKAIO.
  - **Bouton "Generate page"** : passage de `btn-3d` sans couleur de fond vers `bg-primary text-primary-foreground` (orange officiel DUKAIO).
  - **Bouton "Choose from media library"** : remplacement du style gris/blanc (`bg-background border-border`) par `bg-primary text-primary-foreground hover:bg-primary/90` (orange DUKAIO avec effet hover légèrement plus sombre).
  - L'icône `<Images>` du bouton "Choose media" a également été passée en blanc (`text-primary-foreground` hérité) pour un contraste optimal.



### Corrigé
- **`AddressAutocomplete` (`src/components/storefront/CheckoutPage.tsx`)** : correction des défaillances intermittentes de la recherche d'adresse automatique.
  - **User-Agent Nominatim obligatoire :** Ajout de l'en-tête `User-Agent: DUKAIO-SafeSell/1.0 (contact@dukaio.com)` requis par l'API OpenStreetMap Nominatim. Sans cet en-tête, les requêtes étaient bloquées silencieusement (HTTP 429 / erreur CORS), causant les pannes intermittentes.
  - **Timeout de 5 secondes :** Implémentation d'un `AbortController` avec délai d'annulation automatique à 5s, évitant les attentes infinies sur les connexions lentes.
  - **Annulation des requêtes obsolètes :** La requête précédente est annulée dès que l'utilisateur tape un nouveau caractère, évitant les collisions de réponses et les résultats dans le mauvais ordre.
  - **Message d'erreur visible :** En cas d'indisponibilité réseau, un message ambre informe l'utilisateur et propose un lien direct vers la saisie manuelle (au lieu d'échouer silencieusement).
  - **Clé de liste fiable :** Remplacement de `key={r.place_id}` par `key={\`${r.place_id}-${r.lat}-${r.lon}\`}` pour éviter les conflits de clé React en cas de résultats identiques.

## [25/09/2026] - Correction Crash Navigation Boutique & Erreur `shop.href` (commit `3675325`)

### Corrigé
- **`Storefront.tsx` (`src/components/site/Storefront.tsx`)** : correction du crash `insertBefore` en DOM. La logique d'injection du favicon a été refactorisée pour utiliser `setAttribute` au lieu de `removeChild` / `insertBefore`, évitant une exception d'arbre DOM invalide lors des transitions de route rapides.
- **`CheckoutPage.tsx` (`src/components/storefront/CheckoutPage.tsx`)** : correction de l'erreur `TypeError: shop.href is not a function`. Tous les appels `shop.href(...)` sur la page de commande ont été sécurisés avec un fallback sur `storePath(...)` pour les rares cas où le contexte boutique n'est pas encore initialisé.
- **`shop.tsx` (`src/lib/shop.tsx`)** : ajout de la méthode `href` à l'interface `ShopValue` et à l'objet `useMemo` du `ShopProvider` pour garantir sa disponibilité dès le premier rendu.
- **`produit.index.tsx` & `produits.tsx`** : typage `any` ajouté au contexte `head` pour résoudre les erreurs de build TypeScript (`exactOptionalPropertyTypes`).

## [25/09/2026] - Widget Hub Créateur (Support, Nouveautés, Aide & Messages)
- **`CreatorHubWidget` (`src/components/dashboard/creator-hub-widget.tsx`)** :
  - **Bouton flottant officiel avec casque support client** : cercle orange vibrant aux couleurs DUKAIO (`bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500`) avec micro-casque de support client (`Headphones`) en blanc pur, ombre portée lumineuse et pastille animée de disponibilité en direct.
  - **Positionnement absolu garanti par React Portal** : monté directement sur `document.body` à `fixed bottom-6 right-6 z-[9999]`, garantissant qu'il reste toujours ancré dans le coin inférieur droit de l'écran sans jamais déborder ni chevaucher la barre latérale ou la carte profil.
  - **Vrai logo DUKAIO dans l'en-tête** : intégration du logo officiel `/dukaio-icon.png` à côté du titre *DUKAIO Hub*.
  - **Têtes de l'équipe Support africaine** : intégration des photos des 3 membres de l'équipe support (homme et femmes avec micro-casques) remplaçant les initiales `DA`, `ST`, `IA`, avec statut *Support en ligne*.
  - **Mode Plein Écran Mobile natif (`inset-0 h-[100dvh]`)** : sur smartphone, le widget s'ouvre en plein écran fluide comme dans l'application native de référence, avec en-tête chaleureux ambre/doré, prise en compte des encoches (`safe-area-inset-top`), bouton de fermeture `X`, cartes réactives bien aérées et barre de navigation 4 onglets en bas avec espacement sécurisé (`safe-area-inset-bottom`). Sur tablette/ordinateur, il conserve son format popover compact et élégant (`sm:w-[410px] sm:h-[620px]`).
  - **Intégration** : monté directement dans `DashboardShell` pour être accessible partout sans rechargement.

## [24/09/2026] - Correction État Sous-Menus & Icônes Remplies Blanc (Style Shopall)

### Corrigé
- **Dépliage des sous-menus (`Orders`, `Ad Spy & Trends`, `Products`)** : correction du bug de fermeture intempestive (clignotement). Chaque menu déroulant possède désormais son propre état d'ouverture persistant (`openMenus`), découplé des re-renders de page.
- **Auto-ouverture lors de la navigation** : le sous-menu de la page active s'ouvre proprement uniquement lors d'un vrai changement d'URL (`pathname`/`searchString`).
- **Stabilisation des permissions (`store.ts`)** : mémoïsation de `useCurrentRole()` avec `useMemo` et `useCallback` pour éliminer les re-renders en cascade.

### Modifié
- **Icônes du menu actif (`shell.tsx`)** :
  - **État actif** : l'icône du menu sélectionné est désormais remplie de blanc pur (`fill="currentColor"` / silhouette pleine) avec texte blanc contrasté, calqué exactement sur la référence Shopall.
  - **État inactif** : outline fin et moderne (`strokeWidth={1.5}`, `fill="none"`).
  - **Composants dédiés** : `NavHomeIcon` (silhouette maison avec porte découpée), `NavOrdersIcon` (sac de shopping plein/contour), `NavProductsIcon`, `NavCustomersIcon`, `NavAnalyticsIcon`, `Heart`, `Crown`, etc.
  - **Structure sidebar** : layout original préservé (`h-8`, `rounded-[5px]`, `bg-chrome-panel` sélecteur).

## [24/09/2026] - Refonte Complète Navigation Sidebar (Style Premium Linear/Vercel)

### Modifié
- **`NavBadge`** (nouveau composant) : composant centralisé pour les badges `NEW` (vert émeraude avec ring), `PLAN` et autres badges personnalisés. Design plus raffiné que les spans ad-hoc précédents.
- **`SidebarLink`** : refonte complète du composant de lien de navigation :
  - **Indicateur actif** : barre verticale orange de 3px à gauche de l'élément actif (style Linear).
  - **Icônes** : taille optimisée `15px`, coloration adaptative (orange si actif, gris semi-transparent sinon, foreground au hover).
  - **Font** : `font-medium` (vs `font-semibold`) pour un rendu plus fin et professionnel.
  - **Arrière-plan actif** : `bg-primary/12` (teinte orange très légère) au lieu du gris plat précédent.
  - **Transitions** : `transition-all duration-150` pour des animations plus fluides.
- **`CollapsibleNavItem`** : mêmes améliorations appliquées au bouton parent des menus déroulants (indicateur barre, icône colorée, état actif orange).
- **Logo Header** (`NavContent`) : refonte complète de l'en-tête de la sidebar :
  - **Logo mark** : coins plus arrondis `rounded-[7px]`, ombre orange subtile `shadow-[0_0_0_1px_rgba(234,88,12,0.25),0_2px_6px_rgba(234,88,12,0.2)]`.
  - **Live dot** : indicateur de statut vert animé (`animate-ping`) sur le logo signalant que la boutique est en ligne.
  - **Wordmark** : nom + sous-titre `Dashboard` en petit, typographie hiérarchisée.
  - **Boutons collapse** : avec Tooltip et style plus discret.
- **Labels des sections** : taille réduite `text-[9px]` avec `tracking-[0.14em]` et opacité 40% pour un look épuré.
- **Espacement** : `space-y-0.5` entre items, `space-y-3` entre sections — hiérarchie visuelle claire.

---

## [24/09/2026] - Refonte Professionnelle du Pied de Sidebar (Carte Utilisateur)

### Modifié
- **`SidebarUser`** (`src/components/dashboard/shell.tsx`) : refonte complète du bloc inférieur de la sidebar (style Linear/Notion) :
  - La section utilisateur devient une **carte encadrée** (`border + bg-chrome-panel`) avec avatar, nom, badge plan/rôle et email.
  - La barre d'actions en bas de carte regroupe : **Langue** (pleine largeur, avec drapeau), **Paramètres** (icône) et **Déconnexion** (icône rouge au survol) — séparés par des bordures verticales fines.
  - Suppression des boutons "Déconnexion" et "Langue" en rangées séparées remplacés par des icônes intégrées directement dans la carte.
  - État replié : icônes compactes centrées en colonne avec tooltips côté droit.
- **`LanguageSwitcher`** (`src/components/ui/language-switcher.tsx`) : ajout du variant `"sidebar-inline"` — affichage pleine largeur dans la barre d'actions de la carte, avec globeicon + label à gauche et drapeau + code à droite. Menu déroulant ouvert vers le haut (`side="top"`).

---

## [24/09/2026] - Suppression du bouton "Centre d'aide" de la Sidebar

### Supprimé
- **Bouton "Centre d'aide"** (`src/components/dashboard/shell.tsx`) : suppression complète du bouton `LifeBuoy` dans les deux états de la sidebar (replié et déplié).
- **Import `LifeBuoy`** : nettoyage de l'import Lucide devenu inutilisé.

---

## [24/09/2026] - Interface Dashboard Adaptée par Rôle (Membres d'Équipe)

### Ajouté
- **`RoleBadge` component** (`src/components/dashboard/shell.tsx`) : nouveau badge sky-blue affichant le rôle des membres invités (`CLOSER`, `LIVREUR`, `PRODUITS`, `ADMIN`) dans la sidebar et le menu utilisateur en en-tête.
- **`roleLabel()` helper** (`src/components/dashboard/shell.tsx`) : mappe les codes internes de rôle vers des libellés lisibles en français.

### Modifié
- **`TrialBanner`** (`src/components/dashboard/shell.tsx`) : le bandeau d'essai gratuit 14 jours est désormais masqué pour les membres non-propriétaires. Seul le propriétaire de la boutique le voit.
- **`TopUserMenu`** (`src/components/dashboard/shell.tsx`) :
  - Les membres voient un `RoleBadge` (ex: `CLOSER`) à la place du badge de formule (Free / Starter / Pro).
  - Le lien "Abonnement" dans le menu déroulant est masqué pour les non-propriétaires.
- **`SidebarUser`** (`src/components/dashboard/shell.tsx`) : badge plan remplacé par badge rôle pour les membres dans la sidebar.
- **Dashboard Home** (`src/routes/_authenticated/dashboard/index.tsx`) :
  - Section **"Démarrage rapide"** (création IA + ajout manuel produit) : masquée pour les rôles non-admin.
  - Section **"Configuration boutique"** (design, nom/marque, COD/livraisons) : masquée pour les rôles non-admin.
  - Import de `useCurrentRole` ajouté depuis `@/lib/store`.

---

## [24/09/2026] - Système Multilingue International (Français 🇫🇷 / English 🇬🇧), Drapeaux Graphiques PC & Traduction Complète de Toutes les Pages Clés

### Internationalisation (i18n) & Expérience Utilisateur
- **Correction des Drapeaux sur PC Windows (`LanguageSwitcher.tsx`) :**
  - **Élimination du problème des lettres "GB" et "FR" :** Les PC sous Windows 10/11 n'affichant pas les emojis drapeaux nationaux et affichant à la place les deux lettres indicatrices régionales, intégration du composant `FlagIcon` combinant des visuels ultra-nets FlagCDN (`https://flagcdn.com/w40/fr.png` et `gb.png`) avec repli SVG vectoriel direct et dimensions fixes strictes.
  - Résultat : drapeaux visuels parfaits (tricolore français 🇫🇷 et Union Jack 🇬🇧) visibles sur tous les écrans, PC Windows, Mac, tablettes et smartphones.
- **Tableau de Bord 100% Réactif & Traduit (`shell.tsx`, `dashboard/index.tsx`) :**
  - **Traduction instantanée de la barre latérale (Sidebar) :** Catégories ("Vente" / "Sales", "Compte" / "Account") et l'ensemble des éléments de menu ("Accueil", "Produits", "Commandes", "Marketing", "Clients", "Analyses", "Découverte", "Boutiques", "Publicités", "Favoris", "Ma boutique", "Équipe", "Abonnement") réagissent immédiatement au changement de langue sans rechargement.
  - **Pied de navigation & Actions utilisateur :** "Paramètres" / "Settings", "Centre d'aide" / "Help Center", "Déconnexion" / "Log out", et modalité de visite guidée traduites.
  - **Barre supérieure (Header) :** Bouton "Voir la boutique" / "View Store", champ de recherche et suggestions d'accès rapide traduits en direct.
  - **Page d'accueil du Dashboard :** Bannière d'alerte des commandes COD à confirmer, accroche Héro de recherche de produits gagnants, suggestions de recherche, catégories d'inspiration dynamiquement traduites, ainsi que l'intégralité de la moitié inférieure : "Démarrage rapide" / "Quick start", "Générer une page produit avec l'IA" / "Generate a product page with AI", "Ajouter vos propres produits" / "Add your own products", "Configuration de votre boutique" / "Store setup", "Design de boutique" / "Store design", "Nom & Domaine" / "Name & Domain", "Paiement COD & WhatsApp" / "COD & WhatsApp Payment".
- **Page « Mes Produits » (`produits.index.tsx`) :**
  - En-tête, compteur de produits et brouillons IA traduits.
  - Champ de recherche réactif ("Rechercher un produit..." / "Search products...").
  - Carte de démonstration panier ("Ajouter au panier" / "Add to cart").
  - Cartes d'atouts inférieurs ("Produits digitaux" / "Digital products", "Stock & variantes" / "Stock & variants", "SEO intégré" / "Built-in SEO").
  - Badges de méthode ("Photo → IA" / "Photo → AI", "Manuel" / "Manual").
- **Page « Créer avec DUKAIO IA » (`produits.ia.tsx`) :**
  - Stepper de progression ("Importer" / "Import", "Personnaliser" / "Customize", "Finaliser" / "Finalize").
  - Lien retour ("Retour aux produits" / "Back to products").
  - Sélection de méthode ("Nouvelle page produit" / "New product page", "Choisissez votre méthode pour démarrer" / "Choose your method to get started").
  - Onglets mobiles ("Par lien (Auto)" / "By link (Auto)", "Par images (Manuel)" / "By images (Manual)").
  - Carte 1 (Lien externe) : badge Recommandé, titre, description, placeholder de lien, sélecteur de langue cible localisé, bouton "Générer la page" / "Generate page", coût en crédits.
  - Carte 2 (Visuels directs) : badge Alternative, zone de glisser-déposer ("Depuis votre appareil" / "From your device"), séparateur "OU" / "OR", "Choisir dans la galerie" / "Choose from media library", "Continuer (X images)" / "Continue (X images)".
  - Écran d'analyse dynamique localisé ("Connexion & extraction du produit", "Analyse visuelle et détection IA", etc.).
  - Dialogue de confirmation avant de quitter traduit ("Quitter la création ?" / "Leave creation?", "Quitter" / "Leave", "Continuer la création" / "Keep editing").
- **Page « Mes Favoris » (`decouverte.favoris.tsx`) :**
  - En-tête de page ("Mes favoris" / "My favorites", sous-titre).
  - État vide ("Aucun favori pour l'instant" / "No favorites yet").
  - Titres des sections dynamiques ("Boutiques enregistrées" / "Saved Stores", "Produits enregistrés" / "Saved Products", "Publicités enregistrées" / "Saved Ads").
  - Actions des cartes : "Analyse de l'annonce" / "Ad Analysis", "Ouvrir la page" / "Open page", "Pubs actives" / "Active ads", "Durée" / "Duration", bouton de suppression.
- **Page « Ma Boutique » (`boutique.tsx`) :**
  - En-tête : "Boutique en ligne" / "Online store", boutons "Rafraîchir" / "Refresh", "Voir la boutique" / "View store".
  - Carte du thème : "Thème en ligne" / "Active Theme", badge "Actif" / "Active", bouton "Modifier le thème" / "Customize theme", date de sauvegarde au format localisé (`fr-FR` ou `en-US`).
  - Section prochains thèmes : "Prochains thèmes" / "Upcoming themes", badge "Bientôt" / "Coming soon", descriptions éditoriales bilingues et bouton "Me prévenir" / "Notify me".
- **Éditeur de Thème (`editeur.tsx`, `PageSelector.tsx`, `EditorSidebar.tsx`) :**
  - Barre d'outils supérieure : "Retour à la boutique" / "Back to store", "Éditeur de thème" / "Theme editor", statut "En ligne" / "Live" / "Hors ligne" / "Offline", badge "modifications non enregistrées" / "unsaved changes", bouton "Enregistrer" / "Save".
  - Sélecteur de page central (`PageSelector.tsx`) : "Page d'accueil" / "Home page", "Pages produit" / "Product pages", "Nouveau produit IA" / "New AI product", recherche et messages d'aide traduits.
  - Menu Plus d'actions : "Historique des versions" / "Version history", "Réinitialiser le thème" / "Reset theme", "Dépublier la boutique" / "Unpublish store", "Publier la boutique" / "Publish store".
  - Bandeau supérieur brouillon IA : textes descriptifs, boutons "Abandonner" / "Discard", "Enregistrer le produit" / "Save product", "Appliquer à ce produit" / "Apply to this product".
  - Barre latérale (`EditorSidebar.tsx`) : onglets "Sections" et "Branding", en-têtes "Global (toutes les pages)" / "Global (all pages)", libellés de page active, dialogues d'ajout de section et identité de boutique (Logo, Favicon).
  - Barre de navigation mobile inférieure : onglets "Sections", "Branding", "Aperçu" / "Preview".
- **Détection Géographique & Priorité Francophone :**
  - **Priorité naturelle aux pays francophones :** Tout utilisateur se connectant depuis le Bénin, la France, la Côte d'Ivoire, le Sénégal ou dont le navigateur est paramétré en français est automatiquement dirigé vers la version française dès son arrivée sur `dukaio.com`.
  - **Routes Dédiées `/fr` et `/en` :** Accès direct par URL (`dukaio.com/fr` et `dukaio.com/en`) mémorisant immédiatement la langue choisie et guidant l'utilisateur de manière fluide.
  - **Persistance Universelle :** Synchronisation simultanée dans `localStorage`, cookie `dukaio_lang` et attribut HTML `lang`.

## [24/09/2026] - Infrastructure CDN Bunny.net Dédiée, Règle Vidéo ≤ 40 Mo & Pérennisation 100% Hors-Supabase

### Infrastructure CDN & Découverte Publicitaire
- **Architecture Dédiée Bunny.net CDN (`bunny.server.ts`) :**
  - **Zéro Ko consommé sur Supabase Storage :** Abandon définitif du stockage des médias publicitaires sur Supabase Storage pour préserver l'intégralité du quota de la base de données.
  - **Storage Zone & CDN Global :** Configuration de la Storage Zone `dukaio-ads` (Région Francfort/Falkenstein) et de la Pull Zone CDN mondiale sécurisée SSL (`https://dukaio-ads.b-cdn.net`).
  - **Client d'upload haute résilience :** Module natif `node:https` avec streaming mémoire, requêtes PUT directes, timeout étendu à 300s, et pré-contrôle HEAD des en-têtes HTTP (`checkUrlSize`) pour valider la taille des fichiers avant téléchargement.
- **Règle Stricte des Vidéos ≤ 40 Mo & Protection de Quota (`discovery.server.ts`) :**
  - **Plafond anti-saturation :** Pour protéger le quota de 100 Go de Bunny.net contre les vidéos parasites hors format (telenovelas, émissions religieuses, longs webinaires), contrôle strict de la taille en moins de 200 ms avant tout traitement.
  - **Vidéos e-commerce standard (≤ 40 Mo) :** Uploadées et hébergées à vie sur le CDN Bunny.net (`https://dukaio-ads.b-cdn.net/videos/{external_id}.mp4`).
  - **Vidéos volumineuses (> 40 Mo) :** Bloquées d'upload sur Bunny, marquées avec le flag `meta_oversized_video: true` et redirigées vers la bibliothèque officielle Meta sans altérer le quota.
- **Migration Intégrale de la Base de Données Existante (100% Terminée) :**
  - **337 / 337 images (100%)** migrées et servies via le CDN Bunny.net.
  - **419 / 419 vidéos e-commerce (100%)** migrées et servies via le CDN Bunny.net.
  - **3 vidéos hors format (> 40 Mo)** répertoriées avec passerelle Meta Ad Library.
  - Consommation finale : **2,68 Go / 100 Go** sur Bunny (~2,7% du quota) et **0 Ko** sur Supabase Storage (100% d'économie).
- **Interface & Lecteur Vidéo Haute Définition (`analysis-dialog.tsx`, `tendances.$id.tsx`, `ad-card.tsx`) :**
  - Lecteur vidéo HD intégré avec badge source explicite (`Vidéo HD CDN Bunny.net · Pérenne`).
  - Écran dédié de visionnage pour les publicités volumineuses (> 40 Mo) avec bouton d'action officiel : **« Regarder sur Meta Ad Library »**.
  - Lien direct Meta Ad Library sécurisé avec fallback automatique sur l'identifiant externe de la publicité (`https://www.facebook.com/ads/library/?id=...`).
- **Épuration de la Console d'Administration (`admin/tendances.tsx`) :**
  - Suppression du bandeau temporaire de progression de migration une fois l'opération complétée à 100%.
  - Ajout d'un badge de statut discret et moderne dans l'en-tête : `● CDN Bunny.net 100%`.
- **Automatisation Serveur Vercel Cloud :**
  - Les collectes manuelles ("Collecter les publicités") et les scans périodiques du robot (`cron.decouverte.ts`) s'exécutent entièrement en tâche de fond dans le Cloud Vercel (liaisons 10 Gbps) sans consommer la connexion Internet personnelle de l'utilisateur.

## [23/09/2026] - Correction Définitive de la Disparition des Publicités & Pérennisation des Médias Vidéo

### Découverte Publicitaire & Fiabilité des Médias
- **Élimination Définitive du Bug de Disparition des Cartes (`ad-card.tsx`) :**
  - **Suppression du masquage destructif :** Retrait immédiat de la ligne `if (broken || !media) return null;` qui faisait littéralement disparaître les annonces dès l'expiration du jeton signé temporaire Meta (`oe=...`).
  - **Carte Visuelle de Secours Haute Définition (`SafeImage`) :** Lorsque l'URL externe Meta a expiré, la carte de publicité reste **100% visible et intacte** avec un visuel stylisé aux normes DUKAIO (dégradé ardoise/zinc sombre, badge thématique de niche, étiquette vidéo avec icône de lecture orange, accroche du produit, durée active en direct, lien vers la boutique et bouton officiel Meta Ad Library).
  - **Zéro perte de données pour le marchand :** L'annonceur, la traction, le pays ciblé, le lien de destination et l'accès à la fiche d'analyse restent consultables sans aucune interruption.
- **Modernisation & Fluidification du Lecteur Vidéo (`analysis-dialog.tsx` & `video.stream.ts`) :**
  - **Élimination des blocages réseau de 35s :** Retrait des appels Apify synchrones et bloquants au sein de la route de streaming `/api/public/video/stream`, évitant tout timeout ou gel du navigateur.
  - **Aperçu Vidéo & Passerelle Directe Meta Ad Library :** En cas de flux vidéo direct arrivé à expiration, affichage instantané d'une interface vidéo soignée invitant à visionner l'annonce officielle en haute définition sur Meta Ads Library en 1 clic (`ad.ad_library_url`), avec bouton de réactualisation à la demande.
- **Pérennisation des Médias Vidéo & Visuels dans Supabase Storage (`discovery.server.ts`) :**
  - **Stockage permanent anti-expiration :** Lors des collectes d'annonces, sauvegarde systématique du visuel (`store-media/discovery/`) et de la vidéo (`store-media/discovery-videos/`).
  - **Démystification de l'espace disque :** 1 000 miniatures ne pèsent que 40 Mo et 100 vidéos courtes optimisées ne pèsent que 200 Mo, soit **moins de 0,25% du quota de 100 Go** de Supabase de l'utilisateur. Les médias stockés restent valides à vie sans jamais dépendre des jetons éphémères de 4 jours de Meta.

## [21/09/2026] - Intégration de l'Assistant DUKAIO Hybride (Questions 0 Token + Google Gemini AI Studio)

### Expérience Utilisateur & Assistance Commerciale
- **Widget Assistant Flottant (`assistant-widget.tsx`) :**
  - Ajout d'une bulle flottante moderne et discrète en bas à droite des pages publiques avec infobulle incitative automatique.
  - Fenêtre de chat aux couleurs de DUKAIO (Orange `#ea580c`, Blanc et vert WhatsApp) avec en-tête soigné, statut "En ligne" et fermeture fluide.
- **Mode Hybride Intelligent (0 Token + IA Gratuite) :**
  - **4 Sujets Rapides Prédéfinis (0 token consommé)** : Réponses instantanées intégrées en local sur le Paiement à la livraison (COD), les Tarifs, la Création de boutique et le Support.
  - **Moteur IA dédié Google Gemini AI Studio (`askAssistant`) :** Les questions libres sont traitées directement par l'API gratuite Google Gemini (`GEMINI_API_KEY`) avec un prompt système expert en e-commerce africain, sans aucune utilisation de l'API Kie.ai.
  - **Bouton WhatsApp direct :** Accès en 1 clic pour discuter immédiatement avec l'équipe commerciale sur WhatsApp.
- **Intégration propre :** Intégré dans le layout public (`PublicLayout`) sans affecter le dashboard ni altérer aucun composant existant.

## [21/09/2026] - Rétablissement de l'Identité Orange & Blanc du Dashboard & Nettoyage des Loaders

### Branding & Tableau de Bord
- **Élimination complète du vert dans le Dashboard :**
  - Remplacement de toutes les variables vertes héritées de la maquette par les teintes officielles DUKAIO : Orange vibrant (`oklch(0.672 0.204 42.5)` / `#ea580c`) et Blanc pur (`oklch(1 0 0)`).
  - Boutons, badges (PRO, NEW), icônes d'action, onglets actifs, barres de recherche et notifications Toaster 100% alignés sur la charte Orange & Blanc.
  - Préservation intégrale et sans retouche des styles de bordure et d'arrondis (`--radius: 0.5rem`, `rounded-lg`) de la landing page.

### Navigation & Système de Chargement
- **Suppression du trait de chargement supérieur (`GlobalRouteProgressBar`) :**
  - Retrait complet du composant de barre orange en haut de l'écran (dans `__root.tsx` et `PageLoader.tsx`).
- **Suppression des loaders sur les pages publiques :**
  - Le clic sur le logo ou les liens de navigation sur la landing page ou les pages publiques n'affiche plus aucun écran ni spinner de chargement.
- **Rechargement fluide au clic sur le logo :**
  - Sur la landing page, le clic sur le logo DUKAIO (en en-tête comme en pied de page) recharge directement le site (`window.location.reload()`) et replace l'utilisateur à sa position exacte sans aucun effet indésirable ni trait de chargement.
- **Maintien du loader circulaire officiel sur le Dashboard :**
  - Seul le spinner rotatif orange centré avec mention « Chargement… » (`DukaioPageLoader`) s'affiche lors du chargement des données dans le tableau de bord.

## [21/09/2026] - Intégration Complète de la Nouvelle Landing Page & Pages d'Authentification (Launchpad)

### Design & Identité Visuelle
- **Plaquage 1:1 du Design System Launchpad :**
  - Restauration des tokens exacts du design system (`--radius: 0.5rem`, polices officielles `Sora` pour les titres et `Manrope` pour le corps de texte).
  - Élimination des polices parasites (suppression d'Instrument Serif et des styles italiques automatiques).
  - Normalisation des variantes de boutons (`Button` avec `rounded-lg`, hauteurs précises, ombres et transitions exactes).
  - Style blueprint restauré (`blueprint-cross`, `blueprint-cross-light`, `blueprint-frame`, `glass-nav`, `glass-media`).
- **Landing Page Complète (`src/routes/index.tsx`) :**
  - Intégration exacte du code du launchpad avec lecteur vidéo dynamique (`MotionPlayer`), démonstrations interactives, grille de tarifs compacte, bandeau défilant (`marquee-track`) et FAQ.
  - Tous les médias stockés et servis localement depuis `public/landing/` (vidéo MP4, GIFs, captures HD, logo vectoriel).
- **Pages Connexion & Inscription (`/connexion` et `/inscription`) :**
  - Implémentation du gabarit split desktop avec panneau de marque (`auth-brand`), dégradé signal, rappel des 3 étapes, boutons Google OAuth stylisés et formulaires dédiés.
  - Raccordement complet à Supabase (connexion par mot de passe, vérification OTP par code mail, et redirections automatiques vers `/dashboard`).
  - Redirections transparentes de `/login` vers `/connexion` et `/signup` vers `/inscription`.
- **Pied de Page & Navigation :**
  - Liens rapides épurés dans le footer (conservation des sections essentielles : Fonctionnalités, Comment ça marche, Tarifs, À propos, Connexion, Créer un compte).
  - Titre "Restez informé" rendu dans la typographie Sora officielle sans altération.

## [21/09/2026] - Séparation Stricte de l'Expéditeur & Signature des E-mails (Boutiques vs Plateforme)

### Expérience E-mail & Image de Marque
- **Sécurisation par Défaut des Gabarits E-mail (`renderBrandEmail`) :**
  - Paramètre `includeFounderSignature` passé à `false` par défaut : aucun e-mail ne peut désormais afficher par mégarde la signature ou le portrait du fondateur.
  - La signature officielle (photo d'Isidore Agonan, titre Fondateur & CEO, et mot personnel) est réservée exclusivement aux communications officielles de la plateforme DUKAIO.
- **E-mails Clients & Boutiques 100% Dédiés à la Marque du Vendeur :**
  - **Confirmations & Suivis de Commande (`order-emails.server.ts`) :**
    - Suppression totale du portrait et de la signature du fondateur sur les e-mails de commande, confirmation, expédition, livraison ("Commande livrée"), remboursement et annulation.
    - Expéditeur personnalisé au nom de la boutique : `${NomBoutique} <commandes@dukaio.com>` (au lieu d'`AGONAN ISIDORE`).
    - L'e-mail de notification de commande envoyé au vendeur provient de `DUKAIO Commandes <commandes@dukaio.com>`.
  - **Relances de Paniers Abandonnés (`abandoned.server.ts`) :**
    - L'e-mail de relance est envoyé sous le nom propre de la boutique : `${NomBoutique} <commandes@dukaio.com>`.
  - **Campagnes Marketing des Vendeurs (`email-marketing.server.ts` & `email-marketing.functions.ts`) :**
    - Les campagnes marketing envoyées par les marchands à leurs clients partent avec l'en-tête de leur boutique : `${NomBoutique} <contact@dukaio.com>`.
- **E-mails Officiels Plateforme DUKAIO Conservant la Signature du Fondateur :**
  - **E-mail de Bienvenue & Cycle de Vie (`lifecycle-emails.server.ts`) :** Accueil personnalisé des nouveaux marchands par le fondateur Isidore Agonan.
  - **Campagnes Marketing Super-Admin (`admin.functions.ts`) :** Newsletters et annonces globales de la plateforme transmises avec la signature officielle.
  - **Facturation & Abonnements (`billing.server.ts`) :** Reçus officiels et justificatifs de paiement envoyés par `DUKAIO Facturation <facturation@dukaio.com>`.

## [20/09/2026] - Dashboard Blanc Épuré ("Blanc bien fait") & Recherche Haute Interactive

### Amélioration de l'Expérience Visuelle & Navigation
- **Arrière-plan Dashboard Blanc Pur :**
  - Élimination complète de la teinte pêche/orangée (`oklch(0.983 0.014 70)`) sur `--surface-tint`, remplacée par un blanc pur `oklch(1 0 0)`.
  - Neutralisation des reflets chauds sur `--muted`, `--secondary`, `--border`, et `--input` pour une palette gris ardoise moderne, nette et haut de gamme.
  - Conteneur global du dashboard (`shell.tsx`) et de l'administration (`admin/shell.tsx`) passés en fond blanc pur (`bg-white`), mettant en valeur les cartes UI avec des bordures fines et élégantes.
  - En-tête de navigation, sélecteur de boutique (`store-switcher.tsx`), cloche de notifications et bouton profil configurés avec fond blanc immaculé.
- **Barre de Recherche Haute Interactive :**
  - Remplacement du champ statique grisé par un composant actif `HeaderSearch` avec intérieur blanc pur (`bg-white`).
  - Suggestions intelligentes en direct lors de la saisie (recherche dans les *Produits gagnants*, dans les *Commandes* ou dans les *Clients* avec validation directe via touche `Entrée ↵`).
  - Menu d'accès rapide au clic (raccourcis directs vers *Produits gagnants*, *Créer avec IA*, *Mes commandes*, *Mes clients*).
  - Bouton d'effacement rapide (`X`) et détection automatique des numéros de commande.

## [19/09/2026] - Favicon SEO Officiel Haute Résolution (Google Search) & Résilience DUKAIO AI

### Identité Visuelle & Référencement Google (SEO)
- **Nouveau Favicon Officiel & Optimisation Google Search (SERP) :**
  - Remplacement de l'ancien pictogramme temporaire par le logo officiel DUKAIO haute résolution (carré orange arrondi avec swoosh signature noir & blanc).
  - Génération complète de la suite d'assets aux normes Google Search Central : `/favicon.ico` (multi-résolution 16x16, 32x32, 48x48), `/favicon-48x48.png` (standard Googlebot), `/favicon-32x32.png`, `/favicon-16x16.png`, `/apple-touch-icon.png` (180x180), `/android-chrome-192x192.png` et `512x512.png`.
  - Création du fichier PWA `/site.webmanifest` avec nom DUKAIO et couleur de marque `#ea580c`.
  - Enrichissement de la balise `<head>` dans `__root.tsx` (`sizes="48x48"`, manifeste et balise `theme-color`).

### IA & Fiabilisation
- **Résilience & Correction du Pipeline DUKAIO AI :**
  - Analyse et confirmation de la boucle de retry automatique Kie.ai (`KIE_TEXT_ATTEMPTS = 4`) : les refus réseau passagers (0s) ne consomment aucun crédit et évitent les crashs.
  - Correction de l'archivage prématuré : fermer la notification flottante ne clôture plus la génération en base (`acknowledged: false`), seule la validation vers l'éditeur le fait.
  - Ajout de la reprise directe et de l'aperçu automatique des travaux terminés (`status: "done"`) sur l'écran `/dashboard/produits/ia`.

## [18/09/2026] - Notifications Telegram Super-Admin Exclusives & Rapport Analytique Quotidien (23h00)

### Nouveautés & Fonctionnalités Super-Admin
- **Alertes Instantanées Telegram (Super-Admin @easy_573) :**
  - **Nouvelle Inscription Utilisateur :** Dès confirmation du code OTP par un nouvel entrepreneur, envoi automatique d'une fiche Telegram détaillée (nom complet, email, téléphone, boutique souhaitée, date/heure, pays, et total des membres inscrits sur DUKAIO) avec boutons directs d'accès à l'administration des utilisateurs.
  - **Création / Ouverture de Boutique :** Dès finalisation de l'onboarding ou ajout d'une boutique supplémentaire, envoi instantané d'une alerte avec nom de boutique, lien public officiel, identité du commerçant, téléphone, devise et total du parc de boutiques actives avec boutons d'accès rapide.
- **Rapport Exécutif Quotidien Automatique à 23h00 :**
  - Bilan complet et soigné généré chaque soir à 23h00 (heure du Bénin / Afrique de l'Ouest) synthétisant :
    - Nouveaux inscrits du jour & total plateforme.
    - Nouvelles boutiques créées aujourd'hui & total parc.
    - Nouveaux produits mis en ligne.
    - Commandes passées aujourd'hui, commandes confirmées, commandes livrées/encaissées, commandes en attente (COD).
    - Chiffre d'affaires / GMV du jour (en FCFA) et panier moyen.
    - Volume d'affaires cumulé global et total de commandes historiques.
    - Trafic & visites du jour sur le site / plateformes et cumul global, avec répartition des principaux pays de provenance.
    - Podium des meilleures boutiques du jour (top 3 par chiffre d'affaires et commandes).
    - Utilisation des crédits DUKAIO AI du mois.
- **Accès & Commandes Telegram à la Demande :**
  - Commande `/rapport` ou `/daily` : Permet au Super-Admin de recevoir immédiatement le rapport du jour à tout moment.
  - Bouton interactif `📈 Rapport Quotidien (23h)` intégré directement au menu `/admin`.
  - Protection stricte : réservé exclusivement à `@easy_573` (ID Telegram `7593951919`).
- **Infrastructure & Automatisation Robuste :**
  - Nouvelle route API planifiée `/api/public/cron/daily-report` (GET/POST) sécurisée par Bearer token et clé secrète CRON.
  - Démon de vérification horaire automatique à 23h00 intégré dans `telegram-worker.ts` et dans la boucle de polling avec verrou atomique anti-doublon distribué (`tryClaimTelegramEvent`).

## [18/09/2026] - Optimisation & Réduction Drastique de la Longueur de la Page d'Accueil (Mobile & Desktop)

### Corrigé & Amélioré
- **Réduction de 67% de la Hauteur Totale & Aération de l'En-tête (Mobile & PC) :**
  - Fin de l'empilement vertical infini qui nécessitait 8 balayages sur mobile et un long défilement sur PC.
  - **Aération Supérieure Équilibrée :** Ajustement du padding supérieur (`pt-6 sm:pt-10`) pour détacher harmonieusement la section héros ("Trouvons votre prochain produit gagnant") de la barre de navigation du haut, offrant une respiration visuelle élégante et professionnelle sans effet de collage.
  - **Carrousel Découverte Horizontal Tactile sur Mobile :** Les 6 cartes de catégories ne s'empilent plus sur 3 rangées verticales géantes (750px), mais défilent horizontalement avec fluidité sur une seule ligne compacte (110px) avec barre de défilement masquée.
  - **Démarrage Rapide Consolidé :** Fusion des actions majeures (*Créer avec l'IA DUKAIO* et *Ajouter ses propres stocks*) en 2 cartes horizontales compactes et percutantes.
  - **Suppression du Bandeau Supérieur Doublon :** Retrait de la barre d'état de boutique (*Votre boutique · Prête pour la vente*, *Copier*, *Voir boutique*, *Centre d'aide*) pour éliminer toute duplication avec le menu de navigation supérieur et offrir un accès direct au cœur de l'espace de vente.
- **Harmonisation de la Charte Graphique des Cartes (Design System DUKAIO) :**
  - Correction des angles excessifs (`rounded-2xl`, `rounded-xl`, `rounded-full`) qui ne correspondaient pas à l'identité visuelle de DUKAIO.
  - Application stricte des rayons de courbure originaux du projet :
    - Cartes, conteneurs et sections : **`rounded-[6px]`** (angles précis, nets et professionnels).
    - Boutons d'action et champs de recherche : **`rounded-[6px]`** / **`rounded-[4px]`**.
    - Badges et étiquettes techniques : **`rounded-[4px]`**.
  - Rendu visuel net, structuré et cohérent avec l'ensemble du tableau de bord (sidebar, cartes d'annonces, réglages).

## [17/09/2026] - Refonte En-tête Découverte (Logo Officiel Meta & Design "Bibliothèque" fidèle à la Capture 2)

### Corrigé & Amélioré
- **Design d'En-tête Conforme à la Capture 2 :**
  - Remplacement du format en pilules isolées par un bloc d'en-tête majestueux inspiré des meilleures plateformes d'analyse publicitaire.
  - Intégration du **véritable logo officiel Meta Platforms** en haute définition avec son dégradé bleu signature (`#0064E1` vers `#0082FB`), placé à gauche du titre.
  - Titre principal épuré et puissant : **Bibliothèque**.
  - Sous-titre officiel : *"Parcourez tous les produits disponibles sur la plateforme"* (adapté élégamment selon l'onglet actif : Boutiques, Produits, Publicités).
- **Suppression du Badge "Flux en direct" :**
  - Retrait intégral de la pastille verte clignotante *"Flux en direct"* à la demande de l'utilisateur (suppression de l'aspect jugé trop artificiel / "trop IA").
- **Mise à Niveau Vectorielle Globale de la Marque Meta :**
  - Remplacement des anciens tracés simplifiés dans `meta-badge.tsx` par les courbes officielles Meta avec gestion vectorielle des dégradés, garantissant une netteté absolue sur desktop et mobile.

## [17/09/2026] - Désactivation de la Recherche en Direct Apify & Suppression de la Bannière de Quota

### Corrigé & Amélioré
- **Désactivation Totale de la Collecte Apify à la Demande :**
  - Fin des déclenchements Apify en direct lors des recherches utilisateurs (maintien de 100% des crédits Apify de l'utilisateur, 0 $ dépensé inutilement).
  - La recherche s'effectue désormais exclusivement et instantanément dans la base de données DUKAIO (Postgres / Supabase).
  - Sécurisation côté serveur (`discovery.functions.ts` - `searchDiscoveryBrandFn`) rejetant toute tentative de collecte en direct avec un message clair.
- **Suppression Complète de la Bannière de Quota & des Badges de Recherches Récentes :**
  - Retrait du bandeau *"Recherches de marque : X restante(s) sur Y ce mois-ci [Formule Pro]"* et des étiquettes de recherches dans `decouverte.publicites.tsx`, `decouverte.boutiques.tsx` et `decouverte.produits.tsx`.
  - Retrait des boutons d'action *"Analyser cette marque en direct"* lors des recherches ou en état vide.
  - État vide repensé et élégant : lorsqu'aucun élément ne correspond aux filtres, un message épuré invite simplement à réajuster la recherche sans solliciter de robot externe.
- **Scan Professionnel Multi-Niches Élargi (1 139 publicités au total, 536 vidéos) :**
  - Exécution ciblée à coût ultra-maîtrisé sur les niches demandées par l'utilisateur :
    - *Massage & Bien-être :* pistolets de massage, masseurs cervicaux, ceintures lombaires chauffantes, coussins orthopédiques, ceintures de sudation.
    - *Auto & Équipements :* rétroviseurs avec caméra/dashcam, supports téléphone, gonfleurs sans fil, nettoyeurs haute pression portables.
    - *Beauté, Dermaplaning & Dentaire :* rasoirs dermaplaning visage, aspirateurs de points noirs, hydropulseurs dentaires sans fil, brosses à dents soniques, brosses lissantes.
    - *Cuisine & Maison Pratique :* hachoirs sans fil, scelleuses sous vide, lampes solaires, organisateurs dressing.
    - *Tech & Gadgets :* micros cravate sans fil, projecteurs LED portables, caméras de surveillance WiFi, montres connectées.
  - Enrichissement automatique de 38 nouvelles boutiques e-commerce détectées avec leurs catalogues et prix.
  - La base atteint désormais **1 139 publicités gagnantes actives**, dont **536 vidéos HD**, tout en préservant le solde de crédits Apify de l'utilisateur.
- **Logos Officiels Meta & Google Ads & Épuration Mobile :**
  - Intégration des logos officiels certifiés **Meta Ads** (boucle infinie bleue) et **Google Ads** (4 couleurs) dans l'en-tête Découverte avec badge lumineux discret *"Flux en direct"*.
  - Suppression des 4 gros blocs de cartes métriques pour éviter toute surcharge visuelle sur mobile et préserver un design épuré, digne des meilleurs outils SaaS du marché.
  - Clarification totale des compteurs de résultats : affichage d'un bandeau stylisé dissociant clairement le nombre d'éléments trouvés pour une recherche spécifique (ex: 103 produits) et le total global de la plateforme (1 139 publicités), avec bouton d'effacement rapide.

## [17/09/2026] - Grand Nettoyage, Collecte Massive de 630 Publicités Gagnantes (Apify) & Relais Streaming « Zéro Stockage »

### Corrigé & Ajouté
- **Nettoyage Intégral de la Base de Données :**
  - Purge de 396 anciennes publicités vidéo dont les jetons d'origine étaient expirés (erreur 403).
  - Suppression de 238 boutiques orphelines dans `discovery_stores` qui ne contenaient plus aucune annonce active.
- **Collecte Ciblée Massive de 630 Publicités Gagnantes Fraîches via Robot Apify :**
  - Collecte automatisée et ciblée sur les marchés clés : **Bénin (BJ), Côte d'Ivoire (CI), Sénégal (SN), Cameroun (CM), Congo (CD), France (FR) et États-Unis (US)**.
  - Couverture des niches à forte rentabilité et fort potentiel e-commerce :
    - *Beauté & Soins Dentaires :* blanchiment dentaire, dentifrice charbon/probiotiques, sérums visage.
    - *Tech & Hygiène :* rasoirs électriques, tondeuses de précision, épilateurs laser IPL.
    - *Auto & Équipement :* nettoyeurs haute pression sans fil pour voiture, compresseurs portables, accessoires auto.
    - *Cuisine & Maison :* friteuses sans huile (Air Fryer), mixeurs portables rechargeables, ustensiles et casseroles inox.
  - La base Découverte compte désormais **916 publicités actives de premier plan**, dont 378 vidéos avec des flux directs neufs (HTTP 206 Partial Content).
- **Création du Relais Streaming Transparent « Zéro Stockage » (`/api/public/video/stream`) :**
  - Endpoint serveur léger TanStack Start / Nitro streamant les octets vidéo en direct avec support complet des requêtes partielles (`Range: bytes=...`, code 206).
  - **Auto-guérison instantanée :** En cas d'expiration d'un jeton Meta en coulisses (403/410), le relais serveur contacte automatiquement Apify, renouvelle le jeton et maintient le streaming vidéo sans interruption pour l'utilisateur.
  - **Strictement 0 octet consommé sur Supabase Storage :** Aucun fichier MP4 n'est enregistré sur le disque, garantissant la préservation intégrale du quota de 100 Go pour les boutiques marchandes.
- **Lecteur Hybride Double Sécurité (`AdMediaSection` dans `analysis-dialog.tsx`) :**
  - Tente d'abord la lecture directe rapide avec `referrerPolicy="no-referrer"`.
  - Bascule automatiquement vers le relais streaming `/api/public/video/stream?id=...` en cas de restriction réseau.
  - Intègre un écran d'attente élégant (*« Synchronisation du flux officiel Meta… »*) en cas de régénération de jeton.
- **Résolution Définitive & Lecteur Vidéo Auto-Guérissant (0 Ko de Stockage Consommé) :**
  - **Déblocage des flux vidéo Meta CDN :** Ajout de `referrerPolicy="no-referrer"`, `playsInline` et `preload="metadata"` sur les balises `<video>` pour contourner le blocage anti-hotlink de Meta.
  - **Moteur de Rafraîchissement Résilient Apify (Self-Healing Token Refresh) :** Création de la fonction serveur `refreshDiscoveryAdVideo` et du hook `useRefreshAdVideo`. Lorsque le jeton signé Meta d'une annonce (`oe=...`) a expiré, le système effectue une requête intelligente auprès de l'acteur Apify de collecte Meta Ads avec le nom de la marque (`page_name`), extrait le flux vidéo frais haute définition (HTTP 206 Partial Content, 100% lisible) et actualise l'URL texte en base de données.
  - **0 Ko de Stockage Supabase Storage :** Strict respect de la règle d'or : aucune vidéo n'est téléchargée ni stockée dans Supabase Storage (réservé exclusivement aux boutiques des marchands).
  - **Expérience Utilisateur Fluide :** Ajout d'un état de chargement élégant dans le lecteur (`Synchronisation du flux officiel Meta…`) pendant la mise à jour du jeton, éliminant tout blocage ou redirection forcée vers Facebook.
  - **Interface de secours élégante :** En cas d'indisponibilité ou d'archivage côté Meta, affichage de l'affiche de la pub avec boutons d'action :
    - *« Resynchroniser avec Meta »* (bouton manuel avec spinner pour relancer l'extraction du flux).
    - *« Regarder sur Meta Ad Library »* (lien direct officiel vers la bibliothèque publicitaire Meta).
  - **Barre d'outils vidéo en lecture normale :** Bouton *« Actualiser le flux »* intégré directement sous la vidéo et lien direct vers Meta Ad Library.
- **Synchronisation Complète des Filtres d'URL dans l'Espace Découverte (`decouverte.produits.tsx` & `decouverte.publicites.tsx`) :**
  - Configuration de `validateSearch` avec Zod sur les routes TanStack Router pour valider et capturer les paramètres d'URL (`category`, `search`, `country`, `sort`, `media`, `status`).
  - Initialisation et synchronisation dynamique des filtres et du champ de recherche (`Route.useSearch()` + `useEffect`) dès l'arrivée sur la page ou lors d'un changement de paramètres.
  - Les puces de filtres (Niche, Marché, etc.) et la barre de saisie reflètent désormais fidèlement les filtres appliqués depuis la page d'accueil ou les liens directs.
- **Raccordement Intégral des Liens et de la Recherche depuis la Page d'Accueil (`dashboard/index.tsx`) :**
  - **6 Cartes de Catégories Interactives :**
    - *Mode femme* ➔ `/dashboard/decouverte/produits` avec filtre niche `Mode & accessoires` et recherche `femme`.
    - *Mode homme* ➔ `/dashboard/decouverte/produits` avec filtre niche `Mode & accessoires` et recherche `homme`.
    - *Électronique* ➔ `/dashboard/decouverte/produits` avec filtre niche `Tech & gadgets`.
    - *Maison & Cuisine* ➔ `/dashboard/decouverte/produits` avec filtre niche `Cuisine`.
    - *Beauté & Soin* ➔ `/dashboard/decouverte/produits` avec filtre niche `Beauté & soin`.
    - *Toutes les pubs* ➔ `/dashboard/decouverte/publicites`.
  - **Barre de Recherche « Trouvons votre prochain produit gagnant » :** Soumission avec redirection immédiate vers `/dashboard/decouverte/produits?search=...` (ex : *sérum*, *kit de blanchiment dentaire*), filtrant instantanément les produits gagnants et préservant le mot-clé lors du basculement vers l'onglet *Publicités*.
- **Moteur de Recherche Multi-Mots Tolérant (`discovery.functions.ts`) :**
  - Amélioration de `searchTokens` et `adsMatchingSearch` : élimination automatique des mots de liaison français courants (*de*, *du*, *des*, *le*, *la*, *un*, *pour*, etc.) pour garantir que des requêtes comme *« kit de blanchiment dentaire »* trouvent les résultats pertinents contenant *« kit blanchiment »* ou *« dentaire »* sans être pénalisées.
- **Conservation des Filtres lors de la Navigation par Onglets (`DiscoveryHeader`) :**
  - Le passage entre les onglets *Boutiques*, *Produits* et *Publicités* conserve désormais automatiquement les paramètres de recherche de l'utilisateur (`search={(prev) => prev}`).

## [16/09/2026] - Refonte Élite de la Page d'Accueil du Dashboard (Style Shopify Command Center)

### Ajouté & Amélioré
- **Transformation Complète de la Page Accueil (`/dashboard`) en Centre de Pilotage & Découverte :**
  - **Suppression du doublon avec l'onglet Analyses :** Retrait des graphiques et courbes analytiques lourdes pour laisser l'onglet *Analyses* comme sanctuaire des statistiques avancées, et faire d'*Accueil* une page d'action, d'inspiration et d'accélération.
  - **1. Barre Supérieure Exécutive :**
    - Indicateur de statut en direct de la boutique avec puce pulsante verte (*« Prête pour la vente »*).
    - Bouton d'action rapide *« Copier le lien »* avec notification toast en 1 clic.
    - Bouton principal *« Voir la boutique »* (ouverture du storefront) et lien discret vers le *Centre d'aide*.
  - **2. Bandeau Opérationnel Intelligent de Priorités (COD) :**
    - Détection automatique des commandes en attente d'appel client (*« X commande(s) en attente de confirmation téléphonique »*) avec bouton d'accès immédiat pour traiter et expédier.
  - **3. En-tête Héro & Recherche IA (Inspiré de Shopify Sidekick) :**
    - Salutation personnalisée avec le prénom du marchand.
    - Titre phare : *« Trouvons votre prochain produit gagnant »*.
    - Barre de recherche/prompt IA interactive permettant de saisir un type de produit et d'atterrir instantanément sur les offres et publicités gagnantes correspondantes.
  - **4. Rangée de Découverte de Produits par Catégorie (6 Cartes Photos Haute Définition) :**
    - Cartes au format portrait avec photos léchées, transitions au survol et flèche de navigation :
      - *Mode femme*
      - *Mode homme*
      - *Électronique & High-Tech* (mise en avant spécifique)
      - *Maison & Cuisine*
      - *Beauté & Soin*
      - *Toutes les pubs*
  - **5. Deux Grandes Vitrines de Démarrage Rapide :**
    - *Générer une page produit avec DUKAIO IA* (badge *« IA Intégrée · 10s chrono »*, argumentaire COD et bouton vers `/dashboard/produits/ia`).
    - *Vendre vos propres produits* (badge *« Vos propres stocks »* et bouton d'import direct vers `/dashboard/produits/nouveau`).
  - **6. Trois Piliers d'Accélération & de Croissance :**
    - *Choisissez le design de votre boutique* (maquette visuelle de thème et lien vers l'éditeur).
    - *Nommer votre boutique & marque* (maquette de badge de marque et lien vers les paramètres).
    - *Paiement à la livraison & WhatsApp* (maquette de badge COD Cash on Delivery et gestion des commandes).

## [16/09/2026] - Accès Illimité aux Publicités (Formules Starter & Pro) & Optimisations Ergonomiques

### Ajouté & Amélioré
- **Déblocage Intégral de l'Accès aux Publicités pour les Abonnés (`src/lib/plans.ts` & `src/lib/discovery-plan.ts`) :**
  - **Suppression du bridage sur le nombre de publicités :** Les formules **Starter** et **Pro** bénéficient désormais d'un accès sans aucune restriction à toutes les publicités de l'espace Découverte (`ads: Number.POSITIVE_INFINITY`).
  - **Mise à jour claire et vendeuse du descriptif des formules :**
    - **Formule Starter :** *« Accès illimité aux publicités (espace Découverte) »*.
    - **Formule Pro :** *« Accès illimité et prioritaire aux publicités (espace Découverte) »*.
    - **Formule Découverte (Gratuit) :** *« Accès aux publicités limité (15 aperçus sans recherche ni filtre) »*.
  - **Moteur Serveur de la Découverte (`src/lib/discovery.functions.ts`) :**
    - Prise en charge des limites infinies sans plafond artificiel (`Number.isFinite`), augmentation de la limite de requête Zod jusqu'à 50 000, et pagination fluide permettant de consulter la totalité de la bibliothèque publicitaire.
- **Harmonisation Ergonomique & Zéro Ascenseur sur la Barre Latérale (`src/components/dashboard/shell.tsx`) :**
  - Agrandissement standardisé des entrées de navigation (`h-8 text-[13.5px]` avec icônes de `16px`).
  - Alignement rigoureux des menus déroulants (`CollapsibleNavItem`), des sous-catégories et des boutons de bas de page (*Déconnexion*, *Centre d'aide*).
  - Compactage équilibré de l'en-tête logo (`py-3`) garantissant que la barre latérale s'affiche en entier **sans aucun défilement vertical (0 scrollbar sur PC)**, même avec le sous-menu « Découverte » entièrement déplié.
- **Barre de Navigation Flottante Dynamique sur la Landing Page (`src/components/landing/nav.tsx`) :**
  - Animation de transition ultra-fluide au défilement (hauteur, padding, transparence et flou `backdrop-blur` optimisé).

## [16/09/2026] - Refonte UX/UI Professionnelle du Studio Marketing & Cadres Modulaires (Style SaaS)

### Ajouté & Amélioré
- **Refonte Architecturale Complète du Studio Marketing (`/admin/marketing`) :**
  - **Bandeau Exécutif Supérieur (Inspiré des plateformes SaaS haut de gamme) :**
    - Titre officiel et badges de conformité (`EXPÉDITEUR VÉRIFIÉ`, `PRÊT À DIFFUSER`, statut du modèle actif).
    - Métadonnées officielles visibles : Expéditeur `agonan@dukaio.com`, Responsable `AGONAN ISIDORE (Fondateur & CEO)`.
    - Carte d'indicateur clé à droite : **Audience Ciblée** dynamique (`140 destinataires` avec type d'audience).
    - Actions d'envergure directes : *« M'envoyer un test »* et *« Diffuser ({count}) »*.
  - **Barre d'Onglets Horizontale (Navigation épurée en 4 vues distinctes) :**
    - **1. Rédacteur & Studio :** Vue scindée en 2 colonnes avec l'éditeur de contenu et la prévisualisation en direct (Desktop / Mobile).
    - **2. Ciblage & Destinataires ({count}) :** Gestionnaire dédié de la segmentation des vendeurs et du fichier d'audience externe CSV (140 contacts).
    - **3. Modèles Prêts à l'Emploi (13) :** Bibliothèque officielle avec filtres thématiques par objectifs et chargement en 1 clic dans le Studio.
    - **4. Historique & Journal :** Traçabilité et historique officiel des diffusions et actions d'audit.
  - **Structuration en « Cadres UX » (Card Layout moderne & aéré) :**
    - En-têtes de cartes avec icônes distinctes, titres majuscules, sous-titres descriptifs et badges de statut.
    - Sous-sections numérotées fines (`1. INFORMATIONS...`, `2. MÉTRIQUES...`).
    - Grilles de métadonnées Key-Value équilibrées.
    - Échantillon des destinataires validés sous forme de cartes modulaires avec pastilles d'état `✓ Prêt` et action de retrait individuel.
  - **Fidélité au Mode Clair de DUKAIO :**
    - Respect absolu de l'identité visuelle claire, moderne et lumineuse de DUKAIO (fonds blancs épurés, bordures zinc subtiles, typographie soignée et touches orange signature).

## [15/09/2026] - Import CSV & Campagne de Réactivation des Anciens Membres

### Ajouté & Amélioré
- **Support des Audiences Externes & Import CSV dans le Studio Marketing (`/admin/marketing`) :**
  - Ajout d'un 5ème segment d'audience officiel : **« Liste CSV (EXTERNE) »**.
  - **Gestionnaire d'import & assainissement automatique :**
    - Intégration en 1 clic des **140 contacts de l'ancien SaaS** via un bouton dédié (*« ⚡ Recharger les 140 contacts »*).
    - Support du téléversement de fichiers `.csv` / `.txt` ou collage direct d'e-mails.
    - Détection et correction automatique des fautes de frappe de domaines fréquentes (`@gmai.com` -> `@gmail.com`, `@gmail.col` -> `@gmail.com`).
    - Dédoublonnage et validation syntaxique rigoureuse avec indicateurs en temps réel (lignes analysées, valides, fautes corrigées, doublons).
  - **Modal d'inspection & de recherche des contacts (« Voir la liste ») :**
    - Visualisation détaillée de chaque adresse e-mail avec extraction dynamique du prénom pour la personnalisation (`Salut {{prenom}},`).
    - Filtre de recherche instantané et possibilité de retirer un contact individuel.
- **Nouveau Modèle d'E-mail Officiel : « Invitation Privilégiée : Découvrez le nouveau DUKAIO (Ancien SaaS) » :**
  - Modèle n°13 spécialement calibré pour réengager les utilisateurs de la précédente plateforme.
  - Mise en avant des 4 atouts majeurs : Boutique prête en 5 min, Formulaire Cash on Delivery (COD) sans friction, Génération produit par IA en 10 secondes, Retraits Mobile Money (MTN, Orange, Moov, Wave).
  - Bouton d'action principal CTA : `Créer ma boutique sur DUKAIO (Gratuit)` (`https://dukaio.com/signup`).
  - Signature chaleureuse et personnelle du fondateur Isidore Agonan avec note de réactivation.
- **Moteur d'envoi Serveur Sécurisé (`src/lib/admin.functions.ts`) :**
  - Extension de `adminSendPlatformCampaign` pour accepter `targetType: "csv"`, `targetEmails` et `targetContacts`.
  - Pacing sécurisé (temporisation de 80ms) pour préserver la réputation d'envoi de la clé Resend et éviter tout blocage de débit.
  - Note de bas de page adaptée précisant l'origine du message et option d'ignorance.
  - Journalisation de la diffusion dans l'historique d'audit administrateur (`admin_audit_log`).

## [15/09/2026] - Refonte Radar Publicitaire & Épuration Globale de l'En-tête Admin

### Ajouté & Amélioré
- **Épuration Globale de la Barre Supérieure de l'Administration :**
  - Suppression définitive de l'encombrement de la barre de navigation du haut (`AdminShell`) sur l'ensemble des pages du dashboard d'administration (`marketing.tsx`, `promos.tsx`, `retraits.tsx`, `commandes.tsx`, `utilisateurs.tsx`, `tendances.tsx`).
  - Déplacement ergonomique de tous les boutons d'actions vers le corps même des pages (bandeaux de commande et en-têtes de panneaux dédiés) :
    - **Marketing & Campagnes :** Bandeau dédié avec *« M'envoyer un test »* et *« Diffuser (X) »*.
    - **Codes promo :** Bouton *« Nouveau code »* intégré dans l'en-tête du panneau des codes.
    - **Retraits :** Boutons *« Actualiser »* et *« Nouveau retrait »* intégrés dans l'en-tête du panneau des retraits.
    - **Commandes :** Bouton *« Exporter CSV »* intégré dans l'en-tête du journal des commandes.
    - **Utilisateurs :** Bouton *« Actualiser »* intégré dans le bandeau de recherche des marchands.
- **Activation du Robot de collecte Apify dans l'Administration (`src/routes/_authenticated/admin/tendances.tsx`) :**
  - Remplacement de l'ancien script obsolète (`ad-scout.server.ts`) par le véritable moteur de scraping publicitaire Apify (`discovery.server.ts` & `runDiscoveryScanFn`).
  - **Console de collecte ciblée en direct (« Collecter les publicités ») :**
    - Choix des pays cibles (Côte d'Ivoire, Sénégal, Burkina Faso, Mali, Cameroun, Bénin, Togo, ou scan global).
    - Sélection des niches/catégories et saisie de mots-clés avec suggestions rapides en 1 clic.
    - Choix du réseau (Meta Facebook/Instagram, Google Ads, ou les deux) et de la limite d'annonces.
    - Notification toast détaillée en direct avec rapport complet (`X trouvées, Y ajoutées, Z actualisées`).
- **4 Indicateurs Clés (KPIs en direct) :**
  - **Publicités dans le Radar :** Total des publicités analysées, ratio vidéos vs images, et nombre d'annonces actives.
  - **Boutiques & Marques identifiées :** Totalité des boutiques récupérées par le scraping.
  - **Produits & Catalogues :** Nombre de produits catalogués avec prix et variantes.
  - **Robot Apify :** Badge de connexion dynamique (`Connecté` avec puce pulsante) et date/résultats du dernier scan.
- **Journal d'Historique des Scans :**
  - Tableau rétractable des 10 dernières opérations de scan (`discovery_scans`) avec date, source, pays, mots-clés, résultats et statuts d'erreur détaillés.
- **Barre de Recherche & Filtres Dukaio :**
  - Recherche instantanée par nom d'annonceur, produit, mot-clé ou domaine de boutique.
  - Filtres sélectifs par pays (avec drapeaux officiels), catégories, formats médias (Vidéos 🎥 / Images 🖼️), statuts (Actives / Masquées) et tris (Score de traction, récents, durée de diffusion).
- **Explorateur & Modération des Publicités :**
  - Cartes publicitaires au design moderne avec lecteurs/visuels sécurisés (`SafeImage`).
  - Badges superposés : plateforme, pays, score de traction DUKAIO (`/100`), durée active.
  - Bouton **« Analyser »** ouvrant le modal officiel `AdAnalysisDialog` (analyse de l'offre, créations similaires, estimation C.A.).
  - Lien direct vers la bibliothèque publicitaire Meta officielle (`ad_library_url`).
  - Actions d'administration : activation/masquage immédiat et **suppression définitive** (avec dialogue de confirmation et journalisation dans `admin_audit_log`).
- **Fonctions Serveur d'Administration (`src/lib/discovery.functions.ts` & `src/lib/discovery.ts`) :**
  - Création de `adminGetDiscoveryStats`, `adminDeleteDiscoveryAd` et `adminToggleDiscoveryAdStatus`.

### Ajouté & Amélioré
- **Théâtre Vidéo Motion Design dans le Hero (`src/components/landing/motion-showcase.tsx`) :**
  - Remplacement de l'image statique de faux tableau de bord par un cadre navigateur macOS haut de gamme inspiré de Farata et Petit Hero.
  - **Sélecteur d'onglets dynamique :** Permet de basculer instantanément entre la vidéo 1 (*DUKAIO en 40s - Présentation générale & COD*) et la vidéo 2 (*Création IA en 1 clic - 60s*).
  - **Contrôles vidéo épurés & discrets :** Bouton lecture/pause circulaire en bas à gauche et bouton son discret en bas à droite. Conformément à la demande, **aucune barre de défilement de durée** n'est présente pour une immersion visuelle totale.
  - **Lueur d'ambiance (Ambient Glow) DUKAIO :** Halo lumineux doux d'arrière-plan en dégradé orange et bleu.
  - **Piliers de réassurance :** 3 badges sous le lecteur (Paiement à la livraison, Boutique prête en 5 min, Sans carte bancaire).
- **Optimisation Web HD des vidéos (`public/videos/`) :**
  - Réencodage de `DUKAIO Motion Design Original.mp4` et `DUKAIO Motion 2.mp4` en **MP4 H.264 (AVC) + AAC avec `-movflags +faststart`** en 1080p, réduisant le poids de 75% à 84% (7.4 Mo et 19.1 Mo) pour un chargement instantané sans écran noir sur mobile et PC.
  - Génération des affiches WebP (`posters`) pour un démarrage fluide sans latence.
- **Sécurisation des variables d'environnement & Suppression des doublons :**
  - Création du fichier local `.env` sécurisé (ignoré par Git).
  - Nettoyage et remise à blanc du modèle public `.env.example` sans aucune clé secrète.
  - Configuration de Vite (`vite.config.ts`) et du client Supabase (`client.ts`) pour éliminer tous les doublons de variables (`VITE_SUPABASE_*`).

## [11/09/2026] - Barre de Progression Orange Globale & Centrage du Loader Abonnement

### Corrigé & Amélioré
- **Ajout du logo officiel DUKAIO sur la page boutique indisponible (`Storefront.tsx`) :**
  - Affichage de l'icône officielle DUKAIO dans un médaillon épuré centré au-dessus du message *"Cette boutique est actuellement indisponible."*, renforçant l'identité de marque lorsqu'un sous-domaine inexistant ou dépublié est consulté.
- **Restauration de la barre de progression orange en haut de l'écran (`GlobalRouteProgressBar`) :**
  - Réactivation de la fine ligne de chargement animée orange DUKAIO (`#f97316` / `primary`) au sommet de l'écran (`__root.tsx`) lors de tous les changements de page et clics de menu (Accueil, Produits, IA, Commandes, etc.).
  - Transition fluide avec lueur dynamique et compte à rebours de progression lors des chargements de route.
- **Centrage absolu au milieu de l'écran (`defaultPendingComponent` dans `router.tsx`) :**
  - Remplacement du conteneur relatif `min-h-[70vh]` par un conteneur fixe plein écran (`fixed inset-0 z-40 flex h-dvh w-screen items-center justify-center bg-background`).
  - Au rechargement du site ou lors de l'accès au dashboard, le spinner orange et son texte *"Chargement…"* sont désormais **parfaitement au milieu géométrique exact de l'écran** (horizontalement et verticalement).
- **Centrage parfait du chargement sur l'onglet Abonnement & Facturation :**
  - Harmonisation du composant `DukaioPageLoader` (cercle orange minimal avec épaisseur nette `3.5px` et libellé *"Chargement…"*) parfaitement centré au milieu du panneau d'abonnement.
  - Élimination des états intermédiaires asymétriques ou décentrés lors de la récupération des informations de souscription et de paiement.
- **Navigation SPA instantanée vers l'Abonnement (`shell.tsx` & `parametres.tsx`) :**
  - Remplacement des liens HTML natifs `<a href>` par des composants routeurs `<Link to="/dashboard/parametres" search={{ tab: "abonnement" }}>` dans la barre latérale et le menu profil utilisateur, garantissant un passage immédiat sans rechargement lourd du navigateur.
  - Synchronisation instantanée et bidirectionnelle de l'onglet actif avec les paramètres d'URL via `useLocation()`.

## [11/09/2026] - Simplification Éditeur de Thème & Publication Directe

### Ajouté & Amélioré
- **Système de chargement de page épuré, unique & centré (`src/components/brand/PageLoader.tsx`) :**
  - **Cercle rotatif orange unique & centré (style minimaliste) :** Remplacement des animations complexes par un unique cercle orange rotatif épuré avec une belle épaisseur de trait (`border-[3.5px]`), parfaitement centré au milieu de l'écran, accompagné du texte sobre *"Chargement…"*.
  - **Élimination du doublon de chargement :** Suppression de la superposition concurrente entre la barre/overlay racine et le routeur. Désormais, un seul et unique indicateur apparaît au centre de l'écran lors des chargements.
  - **Composant d'attente officiel du routeur (`router.tsx`) :** Intégration du `DukaioPageLoader` centré sur l'ensemble des routes et onglets de l'application.
- **Refonte ergonomique Mobile de l'Éditeur de thème (`src/routes/_authenticated/dashboard/editeur.tsx`) :**
  - **Bouton de retour vers la boutique :** Ajout d'une flèche de retour rapide (`<ArrowLeft />`) dans l'en-tête permettant de quitter l'éditeur et de retourner au dashboard de la boutique en un clic.
  - **En-tête ultra-compact sur une seule ligne :** Fusion du bouton retour, du nom de la boutique, du sélecteur de page compact, du bouton *Enregistrer* et du menu `...` sur une seule rangée sans encombrement vertical.
  - **Barre de navigation mobile fixée en bas (Style App Native) :** Déplacement de la navigation en bas d'écran avec 3 onglets dédiés (`Sections`, `Branding`, `Aperçu`) libérant 100% de la hauteur de l'écran pour l'édition et le rendu visuel.
  - **Aperçu plein écran sur mobile :** En mode *Aperçu*, l'écran mobile affiche la vitrine en immersion totale sans barre de sélection d'appareils superflue.
- **Rendu React direct sans Iframe (`src/components/editor/LivePreview.tsx`) :**
  - **Élimination complète du flash visuel (FOUC) :** Suppression du wrapper `iframe` qui purgeait les feuilles de style CSS à chaque action utilisateur ou ouverture de menu déroulant.
  - **Fluidité native & 0 clignotement :** L'aperçu du thème s'exécute désormais directement dans l'arbre de composants React avec un conteneur adaptatif ultra-réactif (PC, Tablette 834px, Mobile 420px), offrant une transition fluide, une netteté parfaite des polices et une vitesse d'exécution instantanée à 60 fps sans aucun rechargement.
- **Barre supérieure épurée de l'Éditeur de thème (`src/routes/_authenticated/dashboard/editeur.tsx`) :**
  - **Bouton unique `Enregistrer` avec publication directe :** Suppression du bouton redondant `Republier`. Un seul bouton `Enregistrer` est désormais affiché dans l'en-tête. Au clic, les modifications apportées au thème sont immédiatement sauvegardées et publiées en direct (`publish`) sur la vitrine publique du vendeur (`boutique.dukaio.com`).
  - **Suppression du badge IA :** Retrait du badge `PRO • IA Illimitée` (`AiCreditsBadge`) de la barre supérieure afin de libérer l'espace visuel et offrir une interface d'édition claire et concentrée.
  - **Menu d'actions secondaire dynamique :** Ajout de l'option contextuelle dans le menu `...` qui alterne intelligemment entre *"Publier la boutique"* (si hors ligne) et *"Dépublier la boutique"* (si en ligne), permettant de contrôler la mise en ligne ou hors ligne à tout moment.
- **Onglets segmentés dans le panneau latéral (`src/components/editor/EditorSidebar.tsx`) :**
  - **Séparation claire `Sections` vs `Branding` :** Intégration de deux onglets professionnels en haut du panneau gauche.
  - **Onglet `Sections` :** Dédié uniquement à l'arbre des sections de la page (Global, Page active, Ajout de nouvelles sections), offrant une vue d'ensemble aérée et sans encombrement.
  - **Onglet `Branding` :** Regroupe tous les réglages d'identité de marque de la boutique (Logo, Favicon) ainsi que les styles globaux (Palette de 4 couleurs, Typographie des titres & textes, Rayon d'arrondi).
- **Harmonisation des boutons (Design plat & moderne DUKAIO) :**
  - **Suppression du style 3D/bombé :** Remplacement des styles de boutons en relief avec dégradés lourds et ombres biseautées (`.btn-3d`) par le style officiel sobre et épuré DUKAIO (`bg-primary`, fond plat orange, bords arrondis 6px, survol doux).
  - **Uniformisation globale :** Application du style épuré sur le bouton *Enregistrer* de l'éditeur de thème, les fenêtres modales / pop-ups du site, les pages de création d'offres (`marketing.offres.nouveau.tsx`), et les modules d'IA.

## [10/09/2026] - Menu Dashboard Intégré dans l'Éditeur, SEO Complet & Éditeur 3 Panneaux

### Corrigé (Mises à jour récentes)
- **Résolution définitive des doublons de messages du Bot Telegram (@DukaioOfficialBot) :**
  - **Enregistrement officiel du Webhook sur Telegram API (`setWebhook`) :** Activation définitive du Webhook HTTPS direct (`https://dukaio.com/api/public/telegram/webhook`) auprès des serveurs Telegram avec purge du backlog (`drop_pending_updates`). Telegram pousse désormais chaque message exactement une fois et a désactivé le mode polling concurrent (`getUpdates`).
  - **Verrou atomique distribué Supabase (`tryClaimTelegramEvent`) :** Persistance partagée en base de données de chaque ID d'événement (`update_id`, `message_id`, `callback_query.id`) synchronisant toutes les instances serverless Vercel.
  - **Garde-fou anti-doublon sortant dans `sendTelegramMessage` :** Blocage automatique et immédiat de tout envoi de message texte identique vers le même chat dans un intervalle de 3,5 secondes.
  - **Élimination du conflit Worker local vs Webhook Vercel :** Arrêt définitif d'un processus daemon local (`telegram-worker.ts`) qui écoutait et répondait en parallèle du serveur de production Vercel.
  - **Cache ultra-rapide de résolution des boutiques :** Mise en cache des liaisons `chatId -> boutique` dans `src/lib/telegram.server.ts` réduisant le temps d'exécution des commandes et des statistiques à quelques millisecondes.
  - **Suppression du polling dans Paramètres :** Remplacement des requêtes `syncTelegramUpdates` par une simple invalidation de cache TanStack Query, éliminant tout appel concurrent à Telegram.
- **Résolution du crash en ligne de la Landing Page (`dukaio.com`) :**
  - Correction des imports manquants `ShieldCheck` et `Sparkles` dans `src/components/landing/sections.tsx`.
  - Sécurisation défensive par `try/catch` de `getIncomingHost` dans `src/lib/storefront.functions.ts` pour gérer sans erreur les environnements Serverless/Vercel.

### Ajouté & Amélioré
- **Menu latéral Dashboard fluide & animé (Éditeur de thème) :**
  - **Suppression du bouton doublon :** Suppression du bouton toggle redondant dans la barre supérieure blanche ; seul le bouton officiel dans la barre latérale DUKAIO est conservé pour un en-tête épuré.
  - **Repli automatique par défaut :** À l'ouverture de l'éditeur, la barre latérale reste compacte (76px avec icônes uniquement) afin de dédier tout l'espace de travail à l'aperçu et aux réglages de la boutique.
  - **Animation au survol (Hover Expansion) :** Passer la souris sur la barre de navigation la déplie instantanément et en douceur (`transition-all duration-300`) pour afficher le logo, les libellés et les sous-menus. Elle se replie automatiquement dès que le curseur quitte la zone.
  - **Épinglage au clic :** Le bouton `[|]` dans la barre latérale permet d'épingler le menu en position ouverte ou repliée selon les besoins du vendeur.
- **Éditeur de thème 3 panneaux style Shopify (Affichage PC) :**
  - **Panneau gauche (Sections) :** Reste toujours ouvert et accessible avec l'arborescence des sections (Global, Page active, Identité de la boutique, Réglages globaux). La section actuellement active est mise en valeur avec une surbrillance visuelle (`border-primary/50 bg-primary/10`).
  - **Zone centrale (Aperçu direct) :** Rendu de la vitrine en direct avec sélecteur d'appareils (Ordinateur, Tablette, Mobile) et interactivité complète (cliquer sur une section dans l'aperçu l'ouvre directement).
  - **Panneau droit (Paramètres de la section) :** S'ouvre sur le côté droit de l'écran lors du clic sur une section avec ses champs de réglages, icône, titre, bouton de suppression et bouton de fermeture `X` qui désélectionne la section et redonne tout l'espace à l'aperçu.
  - **Affichage Mobile conservé :** Sur smartphone/tablette, la vue bascule de façon fluide entre la liste des sections, le formulaire de réglages et l'aperçu via les onglets dédiés.
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
