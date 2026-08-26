# PAY-ON — Contrat technique de référence

**Ce fichier est la SEULE source de vérité pour le modèle de données, les endpoints API et le contrat de paiement.**
Chaque agent (back-end, front-end, mock paiement) doit lire ce fichier en entier avant de coder, et s'y conformer strictement plutôt que de reconstruire une structure de mémoire ou à partir du cahier des charges original.

En cas de conflit entre ce fichier et toute autre source (cahier des charges, conversation passée), **ce fichier fait foi**. Toute modification nécessaire doit être proposée à la coordination, pas appliquée unilatéralement par un agent.

- Version : 1.0
- Date de figeage : 26 août 2026
- Stack confirmée : **Node.js/Express + PostgreSQL** (back-end), **React** (front-end), mobile-first
- Statut projet : cadrage validé, contact Paygate Global lancé, MVP visé mi-octobre 2026 (paiement en mock), bascule Paygate réelle avant le 19 décembre 2026

---

## 1. Règle métier non négociable

**Une Transaction n'est jamais validée à l'appel `initiate`. Elle n'est validée qu'à réception du webhook de paiement avec `status: success`, signature vérifiée.** Aucun billet, aucun QR code, aucune commande vendeur ne doit être confirmé avant ce webhook. Cette règle s'applique identiquement au mock aujourd'hui et à Paygate Global demain — c'est elle qui garantit que la bascule ne changera rien à la logique métier.

---

## 2. Modèle de données

### Utilisateur
| Champ | Type |
|---|---|
| id | UUID (PK) |
| email | string, unique |
| telephone | string, unique, nullable |
| password_hash | string |
| nom_complet | string |
| role | enum(participant, organisateur, vendeur, staff_scan) |
| created_at | datetime |
| is_active | boolean |

*Rôle unique par compte pour le MVP — pas de table many-to-many.*

### Événement
| Champ | Type |
|---|---|
| id | UUID (PK) |
| organisateur_id | UUID (FK → Utilisateur) |
| titre | string |
| description | text |
| statut | enum(brouillon, publie, presale, live, cloture, annule) |
| lieu_nom | string |
| adresse | string |
| ville | string |
| date_debut | datetime |
| date_fin | datetime |
| created_at / updated_at | datetime |

*Pas d'entité `Organisation` pour le MVP — un seul organisateur pilote, `organisateur_id` directement sur Événement. À réintroduire seulement si plusieurs organisateurs tiers arrivent, après validation équipe.*

### TierBillet
| Champ | Type |
|---|---|
| id | UUID (PK) |
| event_id | UUID (FK → Événement) |
| nom | string (Standard, VIP, Backstage…) |
| prix | decimal(10,2) |
| devise | string (ex: XOF) |
| quantite_totale | integer |
| quantite_vendue | integer |
| ventes_debut / ventes_fin | datetime |
| is_active | boolean |

### Billet
| Champ | Type |
|---|---|
| id | UUID (PK) |
| tier_id | UUID (FK → TierBillet) |
| proprietaire_user_id | UUID (FK → Utilisateur) |
| qr_code | string, unique, indexé, nullable (généré seulement après paiement confirmé) |
| statut | enum(valide, scanne, annule, rembourse) |
| transaction_id | UUID (FK → Transaction) |
| scanned_at | datetime, nullable |
| scanned_by_user_id | UUID (FK → Utilisateur, staff_scan), nullable |
| point_entree | string, nullable |
| created_at | datetime |

### Transaction (générique, indépendante du prestataire)
| Champ | Type |
|---|---|
| id | UUID (PK) |
| user_id | UUID (FK → Utilisateur, acheteur) |
| montant | decimal(10,2) |
| devise | string |
| statut | enum(en_attente, succes, echec, rembourse) |
| reference_externe | string, nullable — id côté prestataire (mock ou Paygate) |
| provider | string, nullable (mock / paygate) |
| split_organisateur | decimal(10,2), nullable |
| split_vendeur | decimal(10,2), nullable |
| split_plateforme | decimal(10,2), nullable |
| split_note | text, nullable |
| failure_reason | text, nullable |
| confirmed_at | datetime, nullable |
| created_at / updated_at | datetime |

*Une transaction peut couvrir plusieurs Billet et/ou CommandeVendeur (relation 1-N). Aucun champ spécifique à un prestataire donné.*

### VoteOption
| Champ | Type |
|---|---|
| id | UUID (PK) |
| event_id | UUID (FK → Événement) |
| libelle | string |
| created_at | datetime |

### Vote
| Champ | Type |
|---|---|
| id | UUID (PK) |
| billet_id | UUID (FK → Billet, doit être statut `scanne`) |
| event_id | UUID (FK → Événement) |
| vote_option_id | UUID (FK → VoteOption) |
| created_at | datetime |

*Contrainte unique (billet_id, event_id) — un vote par billet scanné et par événement. Pas de pondération pour le MVP.*

### ProduitVendeur
| Champ | Type |
|---|---|
| id | UUID (PK) |
| vendeur_user_id | UUID (FK → Utilisateur, role=vendeur) |
| event_id | UUID (FK → Événement) |
| nom | string |
| description | text |
| prix | decimal(10,2) |
| devise | string |
| stock | integer |
| statut | enum(presale, live, epuise, ferme) — **bascule manuelle uniquement pour le MVP, pas automatique** |
| created_at / updated_at | datetime |

### CommandeVendeur
| Champ | Type |
|---|---|
| id | UUID (PK) |
| produit_id | UUID (FK → ProduitVendeur) |
| acheteur_user_id | UUID (FK → Utilisateur) |
| quantite | integer |
| montant_total | decimal(10,2) |
| statut | enum(en_attente, payee, prete_retrait, remise, annulee) |
| transaction_id | UUID (FK → Transaction) |
| qr_code_retrait | string, unique, nullable |
| retrait_scanned_at | datetime, nullable |
| created_at / updated_at | datetime |

---

## 3. Endpoints API (back-end)

### 1. Créer un événement
`POST /api/events`
Entrée : `{ organisateur_id, titre, description, lieu_nom, adresse, ville, date_debut, date_fin }`
Sortie 201 : `{ id, statut: "brouillon", ...champs }`
Erreurs : 400, 401, 403 (rôle ≠ organisateur)

### 2. Publier un événement
`PATCH /api/events/:id/publish`
Entrée : `{}`
Sortie 200 : `{ id, statut: "publie" }`
Erreurs : 404, 403 (pas propriétaire), 409 (déjà publié/annulé, ou aucun tier actif défini)

### 3. Lister les tiers de billets
`GET /api/events/:id/tiers`
Sortie 200 : `[{ id, nom, prix, devise, quantite_totale, quantite_vendue, quantite_disponible, ventes_debut, ventes_fin, is_active }]`
Erreurs : 404

### 4. Créer une commande de billet(s)
`POST /api/billets/commandes`
Entrée : `{ user_id, items: [{ tier_id, quantite }] }`
Logique : vérifie stock, verrouille les lignes (transaction SQL), calcule montant total, crée `Transaction(statut: en_attente)`, pré-crée les `Billet(statut: valide, qr_code: null)`, appelle `paiement.initiate(...)`.
Sortie 201 : `{ transaction_id, statut: "en_attente", billets: [{id, tier_id}], montant_total, paiement_url_ou_ref }`
Erreurs : 400, 409 (stock insuffisant), 404, 502 (échec appel paiement → rollback)

### 5. Webhook paiement (contrat canonique — voir section 4)
`POST /api/webhooks/paiement`
Monté avec `express.raw({ type: 'application/json' })` sur cette route précise, **avant** tout `express.json()` global — la signature se calcule sur le corps brut.
Logique : vérifie signature (timing-safe) → parse JSON → cherche Transaction → vérifie cohérence event_id → idempotence (statut déjà terminal → 200 sans rejouer) → applique les effets selon `status` (voir section 4).
Sortie 200 : `{ received: true }`
Erreurs : 400, 401 (signature invalide), 404, 409 (event_id incohérent)

### 6. Consulter le QR code d'un billet
`GET /api/billets/:id/qrcode`
Sortie 200 : `{ billet_id, qr_code, statut }` (qr_code null si paiement pas encore confirmé)
Erreurs : 404, 409

### 7. Scanner un billet à l'entrée
`POST /api/billets/scan`
Entrée : `{ qr_code, scanned_by_user_id, point_entree }`
Logique : vérifie rôle staff_scan/organisateur, cherche billet par qr_code, vérifie statut = valide, passe à scanne.
Sortie 200 : `{ billet_id, statut: "scanne", tier_nom, scanned_at }`
Erreurs : 404, 409 (déjà scanné/annulé/remboursé), 403

### 8. Soumettre un vote
`POST /api/votes`
Entrée : `{ billet_id, vote_option_id }`
Logique : vérifie Billet.statut = scanne, vérifie vote_option appartient au même event, contrainte unique (billet_id, event_id).
Sortie 201 : `{ vote_id, event_id, vote_option_id, created_at }`
Erreurs : 403 (non scanné), 404, 409 (déjà voté)

### 9. Lister le catalogue vendeur
`GET /api/events/:id/produits`
Query optionnelle : `?statut=live`
Sortie 200 : `[{ id, vendeur_user_id, nom, description, prix, devise, stock, statut }]`
Erreurs : 404

### 10. Créer une commande vendeur
`POST /api/vendeur/commandes`
Entrée : `{ acheteur_user_id, produit_id, quantite }`
Logique : identique à #4 (vérifie statut live/presale, stock, verrouille, crée Transaction + CommandeVendeur en_attente, appelle paiement.initiate).
Sortie 201 : `{ transaction_id, commande_id, statut: "en_attente", montant_total }`
Erreurs : 400, 404, 409, 502

---

## 4. Contrat de paiement (mock aujourd'hui, Paygate Global demain)

### Principe directeur
Le mock expose exactement le contrat que Paygate Global exposera. À la bascule, seule l'implémentation change côté prestataire — ni le back-end ni le front-end ne modifient leur code.

### Endpoints du mock
- `POST /mock/payments/initiate` — déclenche une tentative de paiement
- `POST /mock/payments/webhook` — émis par le mock vers le back-end (pas par le front)
- `GET /mock/payments/:transaction_id/status` — consultation à la demande

### Payload webhook (canonique, identique mock et Paygate)
```json
{
  "transaction_id": "notre id interne (= Transaction.id)",
  "reference_externe": "id côté prestataire (pg_ref_xxx en mock, vrai id Paygate en prod)",
  "event_id": "uuid",
  "status": "success | failed | pending",
  "amount_total": 15000,
  "currency": "XOF",
  "split": {
    "organisateur": 0,
    "vendeur": 0,
    "plateforme": 0,
    "note": "calculé selon split_config, taux provisoires"
  },
  "failure_reason": null,
  "provider": "mock | paygate",
  "timestamp": "ISO8601",
  "signature": "hmac_signature"
}
```

Traduction `status` (entrant) → `Transaction.statut` (interne) :
| status | Transaction.statut |
|---|---|
| success | succes |
| failed | echec |
| pending | en_attente (aucun changement) |

### Signature — HMAC-SHA256
- Algorithme : **SHA-256**, calculé sur le corps brut (Buffer) avant tout `JSON.parse`
- Secret : variable d'environnement — `MOCK_WEBHOOK_SECRET` en mock, `PAYGATE_WEBHOOK_SECRET` à la bascule. Le nom de variable utilisé en interne côté back-end (ex. `WEBHOOK_SECRET`) ne change pas — seule sa source change.
- Comparaison en temps constant (`crypto.timingSafeEqual`), jamais `===`

```js
const crypto = require('crypto');
function verifyWebhookSignature(rawBody, receivedSignature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(receivedSignature, 'hex'));
}
```

### Cas simulés par le mock
| Cas | Déclenchement | Comportement |
|---|---|---|
| Succès | `scenario=success` ou défaut | Webhook envoyé après délai court, `status: success` |
| Échec | `scenario=failure` | Webhook avec `status: failed` + `failure_reason` |
| Attente / timeout | `scenario=pending` | Pas de webhook dans la fenêtre de test — valide que rien n'est délivré sans confirmation |

*Le paramètre `scenario` n'existe que dans le mock — il disparaît naturellement à la bascule.*

### Split de paiement
Taux **jamais codés en dur** — vivent dans un fichier de config externe (`split_config.json` ou variable d'env), chargé au runtime. Les taux du §10 du cahier des charges (6% billetterie / 8-12% vente marchande) sont des valeurs de travail, **non validées** — à utiliser comme placeholder seulement, avec mention explicite "provisoire" tant que l'équipe n'a pas tranché.

### Stockage du mock
Table PostgreSQL `mock_transactions` (même base que le reste) :
| Champ | Type |
|---|---|
| transaction_id | UUID |
| reference_externe | VARCHAR(64), généré à l'initiate (`pg_ref_${crypto.randomUUID()}`) |
| status | string |
| scenario | string |
| created_at | datetime |
| webhook_sent_at | datetime, nullable |

### Ce qui ne change PAS à la bascule Paygate
- Le contrat JSON du webhook
- La logique `verifyWebhookSignature` côté back-end (seul le secret change de source)
- Le handler qui reçoit le webhook côté back-end

### Ce qui change à la bascule
- Les 3 routes `/mock/payments/*` disparaissent, remplacées par les vraies URLs Paygate Global

---

## 5. Écrans front-end (référence pour cohérence avec l'API)

| # | Écran | Endpoint(s) consommé(s) |
|---|---|---|
| 1 | Sélection du tier de billet | GET /api/events/:id/tiers |
| 2 | Récapitulatif de commande | — |
| 3 | Paiement (3 états : attente/succès/échec) | POST /api/billets/commandes, statut transmis par le module paiement |
| 4 | Confirmation avec QR code | GET /api/billets/:id/qrcode |
| 5 | Dashboard organisateur | (endpoints de lecture agrégée à définir en implémentation) |
| 6 | Catalogue vendeur | GET /api/events/:id/produits |
| 7 | Vote (3 cas : non scanné / disponible / déjà soumis) | POST /api/votes |
| 8 | Création d'événement (organisateur) | POST /api/events, PATCH /api/events/:id/publish |
| 9 | App de scan (staff) | POST /api/billets/scan |

*Détail complet des maquettes disponible dans l'historique de cadrage — ce fichier ne reprend que la correspondance écran ↔ endpoint pour éviter les divergences d'intégration.*

---

## 6. Périmètre par agent (rappel)

- **Agent back-end** : modèle de données, endpoints section 3, logique métier, vérification signature. Ne construit pas le mock lui-même, ne dessine pas d'interface.
- **Agent front-end** : écrans section 5, consomme l'API telle que documentée ici. Ne conçoit pas le modèle de données, n'affiche que le résultat transmis par le paiement.
- **Agent paiement/coordination** : service mock section 4, préparation bascule Paygate, suivi de calendrier. Ne tranche pas seul les décisions de scope ou de taux — remonte à la coordination humaine.

**Toute divergence constatée entre ce fichier et le comportement réel du code doit être signalée à la coordination avant d'être corrigée unilatéralement.**
