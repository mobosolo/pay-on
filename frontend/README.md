# PAY-ON — Front-end

Front-end React (Vite) de l'application PAY-ON. Consomme l'API back-end décrite dans `../CONTRACTS.md` (section 3) et implémente les écrans de la section 5.

## Stack

- Vite 5
- React 18
- React Router 6
- Pas de CSS framework pour le moment (CSS plat, mobile-first)

## Prérequis

- Node.js 18+ (idéalement 20 LTS)
- npm 9+

## Installation

```bash
cd frontend
npm install
cp .env.example .env
```

## Variables d'environnement

Voir `.env.example` :

| Variable | Rôle | Défaut |
|---|---|---|
| `VITE_API_BASE_URL` | URL du back-end | `http://localhost:3000` |
| `VITE_USE_MOCK` | Active les réponses mockées locales (`true` / `false`) | `true` |

> Tant que `VITE_USE_MOCK=true`, les fonctions de `src/api/*.js` renvoient des fixtures sans appeler le réseau — le back-end peut être absent sans bloquer le développement UI.

## Lancer en dev

```bash
npm run dev
```

Le serveur démarre sur http://localhost:5173.

## Build de prod

```bash
npm run build
npm run preview
```

## Structure

```
src/
  main.jsx                  Point d'entrée, monte <App> dans BrowserRouter
  App.jsx                   Définition de toutes les routes
  components/               Éléments réutilisables (Layout, etc.)
  pages/                    Un dossier par écran de la section 5 de CONTRACTS.md
    TierSelection/          1. Sélection du tier de billet
    OrderSummary/           2. Récapitulatif de commande
    Payment/                3. Paiement (attente/succès/échec)
    Confirmation/           4. Confirmation avec QR code
    OrganizerDashboard/     5. Dashboard organisateur
    VendorCatalog/          6. Catalogue vendeur
    Vote/                   7. Vote (non scanné / disponible / déjà soumis)
    EventCreation/          8. Création d'événement (organisateur)
    Scan/                   9. App de scan (staff)
    NotFound/               404
  api/                      Fonctions d'appel à l'API back-end
    client.js               Wrapper fetch + gestion d'erreurs
    mock.js                 Fixtures partagées par tous les écrans
    billets.js              GET tiers, POST commande, GET QR, POST scan
    votes.js                POST /api/votes
    vendor.js               GET produits, POST commande vendeur
    events.js               POST event, PATCH publish
  styles/global.css         Reset minimal + variables CSS
```

## Routes actuelles

Toutes les pages existent et affichent leur titre + l'endpoint consommé — le détail visuel viendra dans un round ultérieur.

| Route | Écran |
|---|---|
| `/` | Redirige vers `/events/demo/tiers` |
| `/events/:eventId/tiers` | 1. Sélection du tier |
| `/events/:eventId/commande/recap` | 2. Récapitulatif |
| `/events/:eventId/commande/paiement` | 3. Paiement |
| `/events/:eventId/billets/:billetId/confirmation` | 4. Confirmation QR |
| `/events/:eventId/organisateur` | 5. Dashboard organisateur |
| `/events/:eventId/vendeurs` | 6. Catalogue vendeur |
| `/events/:eventId/vote` | 7. Vote |
| `/events/nouveau` | 8. Création d'événement |
| `/scan` | 9. App de scan |
| `*` | 404 |

## Conventions

- Mobile-first : largeur max du contenu `720px`, layout sticky header.
- Aucun framework UI installé pour le moment — à décider au prochain round.
- Pas de tests automatisés configurés à ce stade.
