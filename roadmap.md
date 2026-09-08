# Roadmap DUKAIO

## Terminé
- [x] Déplacer « Abonnement » du menu latéral vers un onglet de la page Paramètres
- [x] Harmoniser les icônes du menu latéral et des sous-menus
- [x] Améliorer l'état replié : tooltip au survol, logo centré en haut

## À faire
- [x] Conserver les visuels déjà générés après un retour vers la fiche et ignorer leur régénération
- [x] Conserver et signaler toute création IA quittée avant son envoi dans l'éditeur
- [x] Alléger le chargement de la bande du haut pendant la refonte du menu
- [x] Améliorer le menu latéral mobile (hamburger + tiroir)
- [x] Ajuster le bas du menu déplié avec profil carré
- [x] Refaire le menu replié selon la capture fournie
- [x] Remettre le bloc profil comme avant et restaurer le déplieur du menu
- [x] Retirer le Centre d'aide placé sous Abonnement
- [x] Simplifier tous les boutons du tableau de bord sans modifier la page d'accueil

## Boutique publique (fait)
- Catalogue `/s/:handle/produits` avec filtres collection + catégorie, badges remise.
- Panier persistant (localStorage), tiroir avec quantités et code promo.
- Page produit : packs d'offre réels, sélecteur de quantité, achat direct, rupture de stock.
- Commande réelle (paiement à la livraison) : `orders` + `order_items`, totaux recalculés serveur, code promo consommé côté serveur.

## Tableau de bord (fait)
- Collections : création, édition, suppression, publication, sélection des produits.
- Codes promo : création, édition, suppression, %/fixe, panier mini, limite d'usage, date de fin, produit ciblé.
- Offres & packs : paliers quantité, X acheté / Y offert, livraison offerte, activation.

## Tableau de bord pro (fait)
- Accueil : KPI réels (revenus brut/livrés, taux de livraison, panier moyen), courbes revenus + visiteurs, à traiter, dernières commandes, métriques COD, top produits.
- Commandes : recherche, filtres statut/ville/période, regroupement par jour, export CSV, fiche commande (articles, totaux, acheteur, appel/WhatsApp, statuts, note, suppression).

## Abonnements (fait)
- Formules Découverte (0 F), Starter (4 900 F), Pro (14 900 F), annuel = 2 mois offerts, essai 14 jours en Pro.
- Quotas appliqués côté serveur : créations IA, produits, boutiques, équipe, domaine personnalisé.
- Paiement mobile money (pawaPay) et carte bancaire 3D Secure (LigdiCash), webhooks + revérification, reçu par e-mail.

## Comptes & sécurité (fait)
- Inscription validée par code à 6 chiffres envoyé par e-mail, puis onboarding.
- Mot de passe oublié : code à 6 chiffres + nouveau mot de passe, connexion immédiate.
- Double authentification par application (Google Authenticator / TOTP réel) dans Paramètres > Sécurité, exigée à la connexion.

## Robot WhatsApp (fait)
- Connexion du numéro WhatsApp du vendeur (API officielle Meta) dans Paramètres > Robot WhatsApp : webhook, jeton de vérification, identifiant du numéro, jeton d'accès, message d'accueil, questions fréquentes, test d'envoi.
- Robot conversationnel : catalogue numéroté, quantité, nom, ville, adresse, code promo, récapitulatif, confirmation.
- Commande WhatsApp réelle : fiche client, commande + articles dans le tableau de bord, offres et codes promo appliqués, e-mails vendeur/client.
- Suivi de commande par numéro de commande ou téléphone, et réponses aux questions fréquentes.

## Reste à faire
- Livraison / frais d'expédition par zone.
- Clés pawaPay + LigdiCash à renseigner pour activer les paiements réels.

- [x] Favoris de la Découverte (cœur + onglet Mes Favoris)
- [x] Collecte publicitaire 100 % Meta (TikTok/Google en archives)
- [x] Vue tableau de l'onglet Produits

- [x] Limites de formule appliquées dans la base (produits, boutiques, domaine Pro)
- [x] Visite guidée du tableau de bord pour les nouveaux comptes

- [x] Connecter Apify dans le nouvel espace de travail (compte isidoreagonan verifie)
- [x] Fournir schema.sql + export des donnees pour la reprise sur Vercel/Supabase
- [x] Reconnecter Apify apres le second changement d'espace de travail (connexion DUKAIO liee)
- [x] Livrer schema.sql + data.sql valides (0 erreur, 43 tables identiques), .env.example, MIGRATION.md, prompt Antigravity
