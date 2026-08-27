# mock-payment

Service Node.js/Express conforme au contrat canonique `CONTRACTS.md` section 4.
Il **simule** Paygate Global pendant le MVP. À la bascule (avant le 19 décembre 2026),
seules les URLs changent — ni le back-end ni le front-end ne sont modifiés.

## Démarrage

```bash
cd mock-payment
cp .env.example .env
# éditer .env : MOCK_WEBHOOK_SECRET, BACKEND_WEBHOOK_URL, DATABASE_URL
npm install
npm start
```

Le service écoute sur `PORT` (défaut `4001`).

### Health check

```bash
curl http://localhost:4001/health
# → {"ok":true,"service":"mock-payment"}
```

### Provisionnement de la table

La table `mock_transactions` est créée automatiquement au démarrage
(`CREATE TABLE IF NOT EXISTS`). Pour une création explicite :

```bash
npm run migrate
```

Si la base n'est pas joignable, le service démarre quand même en **mode dégradé**
(les webhooks fonctionnent, seule la persistance mock est désactivée — un warning
apparaît dans les logs).

## Endpoints

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/mock/payments/initiate` | Déclenche une simulation de paiement |
| `POST` | `/mock/payments/webhook` | (voir note ci-dessous) |
| `GET` | `/mock/payments/:transaction_id/status` | Consultation du statut mock |

> **Note** sur `POST /mock/payments/webhook` : cette route figure dans la spec
> pour la symétrie avec les 3 routes §4. En exploitation, c'est **ce service**
> qui **émet** le webhook vers le back-end (`POST /api/webhooks/paiement`), pas
> l'inverse. La route renvoie 200 + un avertissement pour les curieux qui
> pinguent l'URL inverse.

## Payload webhook émis (canonique)

Identique mock ↔ Paygate, conforme à `CONTRACTS.md` §4 (v1.1) :

```json
{
  "transaction_id": "<Transaction.id du back-end>",
  "reference_externe": "pg_ref_<uuid côté mock>",
  "event_id": "<UUID>",
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
  "provider": "mock",
  "timestamp": "ISO8601"
}
```

**v1.1 — la signature ne fait plus partie du corps JSON.** Un HMAC ne peut pas
se signer sur un corps qui se contient lui-même (référence circulaire). La
signature voyage désormais dans un header HTTP dédié :

```
X-Signature: <hmac_sha256_hex>
```

Signature = `HMAC-SHA256(MOCK_WEBHOOK_SECRET, raw_body)` calculée sur le corps
brut exact tel qu'envoyé sur le fil (une seule sérialisation). Comparée en
`timingSafeEqual` côté back-end.

## Scénarios simulés

Pilotés par le champ `scenario` du body de `/initiate` (défaut : `success`).

| `scenario` | Comportement |
|---|---|
| `success` (défaut) | Webhook envoyé après `WEBHOOK_DELAY_MS` avec `status: success` |
| `failure` | Webhook envoyé après `WEBHOOK_DELAY_MS` avec `status: failed` + `failure_reason` |
| `pending` | **Aucun** webhook émis — valide que rien n'est confirmé sans retour prestataire |

Le champ `scenario` n'existe que dans le mock ; il disparaît à la bascule.

## Test manuel (curl)

Récupérer un UUID valide (le back-end en génère un à chaque création de commande
billet/vendeur — endpoint `POST /api/billets/commandes`). Pour les tests isolés
du mock, on en forge un :

```bash
TX_ID=$(uuidgen | tr 'A-Z' 'a-z')
EVT_ID=$(uuidgen | tr 'A-Z' 'a-z')
```

### 1. Scénario success

```bash
curl -X POST http://localhost:4001/mock/payments/initiate \
  -H "Content-Type: application/json" \
  -d "{\"transaction_id\":\"$TX_ID\",\"event_id\":\"$EVT_ID\",\"amount_total\":15000,\"currency\":\"XOF\",\"scenario\":\"success\"}"
# → 201 { transaction_id, reference_externe: "pg_ref_...", status: "succes", scenario: "success", provider: "mock" }
```

Après ~1.5s, le mock POST sur `BACKEND_WEBHOOK_URL` avec `status: success`.
Vérifier côté back-end : `GET /api/billets/:id/qrcode` doit maintenant renvoyer
un QR code non null (la Transaction est passée à `succes`).

### 2. Scénario failure

```bash
curl -X POST http://localhost:4001/mock/payments/initiate \
  -H "Content-Type: application/json" \
  -d "{\"transaction_id\":\"$TX_ID\",\"event_id\":\"$EVT_ID\",\"amount_total\":15000,\"currency\":\"XOF\",\"scenario\":\"failure\"}"
```

Après ~1.5s, webhook `status: failed` + `failure_reason: "Simulated failure..."`.
Côté back-end : la Transaction passe à `echec`, aucun QR code généré (règle §1).

### 3. Scénario pending

```bash
curl -X POST http://localhost:4001/mock/payments/initiate \
  -H "Content-Type: application/json" \
  -d "{\"transaction_id\":\"$TX_ID\",\"event_id\":\"$EVT_ID\",\"amount_total\":15000,\"currency\":\"XOF\",\"scenario\":\"pending\"}"
```

**Aucun** webhook émis. Vérifier côté back-end : la Transaction reste `en_attente`,
aucun billet n'a de QR code. C'est précisément le test qui valide la règle §1 du
contrat (« une Transaction n'est jamais validée à l'initiate »).

### Consultation de statut

```bash
curl http://localhost:4001/mock/payments/$TX_ID/status
# → { transaction_id, reference_externe, status, scenario, webhook_sent_at, created_at }
```

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `PORT` | Port HTTP d'écoute (défaut `4001`) |
| `MOCK_WEBHOOK_SECRET` | Secret HMAC pour signer les webhooks émis |
| `BACKEND_WEBHOOK_URL` | URL que le mock POST (ex: `http://localhost:3000/api/webhooks/paiement`) |
| `WEBHOOK_DELAY_MS` | Délai avant émission du webhook (défaut `1500`) |
| `DATABASE_URL` | Connexion PG — absente ⇒ mode dégradé |

## Points bloquants / à signaler

- **Connexion DB** : par défaut le mock tente la même base que le back-end.
  Si la base n'est pas accessible depuis le poste qui exécute le mock, le
  service démarre en mode dégradé (cf. warning au démarrage). La persistance
  `mock_transactions` est alors désactivée mais les webhooks continuent
  d'être émis — le contrat §4 reste respecté.
- **Split** : les valeurs `0/0/0` sont des placeholders. Les taux définitifs
  (6% billetterie / 8-12% vente marchande) sont marqués « provisoires » dans
  le champ `split.note` tant que l'équipe n'a pas tranché (cf. CONTRACTS.md §4).
