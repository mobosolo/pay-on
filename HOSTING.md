# PAY-ON — Guide d'hébergement (validation d'équipe)

Objectif : que les 3 membres de l'équipe puissent ouvrir un lien et voir le projet tourner, sans rien installer localement. Hébergement gratuit, pas de carte bancaire nécessaire (Render/Vercel/Neon).

**Ce n'est pas l'hébergement final pour le test terrain du 19 décembre** — juste un pont pour valider en équipe pendant le développement. On changera d'hébergement (ou pas) le moment venu.

Ordre à respecter : la base de données d'abord, puis le back-end et le mock (ils en dépendent), puis le front-end (il dépend du back-end).

---

## 1. Base de données — Neon (gratuit, persistant)

1. Créer un compte sur [neon.tech](https://neon.tech) (connexion possible via GitHub)
2. **New Project** → nommez-le `payon-shared`
3. Neon affiche une chaîne de connexion du type :
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/payon?sslmode=require
   ```
4. **Copiez cette URL** — c'est le `DATABASE_URL` unique, partagé entre le back-end et le mock (exactement comme en local, mais cette fois une seule base pour toute l'équipe, plus de risque de désynchronisation entre deux `.env`)

---

## 2. Back-end — Render

1. Créer un compte sur [render.com](https://render.com) (connexion via GitHub recommandée — autorise l'accès au repo directement)
2. **New → Web Service** → sélectionnez le repo `pay-on`
3. Configuration :
   - **Root Directory** : `backend`
   - **Build Command** : `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command** : `npm start`
   - **Instance Type** : Free
4. Variables d'environnement (**Environment** → Add Environment Variable) :

   | Clé | Valeur |
   |---|---|
   | `DATABASE_URL` | l'URL Neon copiée à l'étape 1 |
   | `WEBHOOK_SECRET` | une chaîne aléatoire de votre choix (ex. générez-en une avec `openssl rand -hex 32`) — notez-la, elle doit être identique côté mock |
   | `FRONTEND_ORIGIN` | laissez vide pour l'instant, on la remplit à l'étape 4 |
   | `MOCK_SERVICE_URL` | laissez vide pour l'instant, on la remplit à l'étape 3 |

5. **Create Web Service** — Render déploie automatiquement. Notez l'URL générée (ex. `https://payon-backend.onrender.com`)

---

## 3. Mock paiement — Render (2ème service, même compte)

1. **New → Web Service** → même repo `pay-on`
2. Configuration :
   - **Root Directory** : `mock-payment`
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Instance Type** : Free
3. Variables d'environnement :

   | Clé | Valeur |
   |---|---|
   | `DATABASE_URL` | la **même** URL Neon que le back-end |
   | `MOCK_WEBHOOK_SECRET` | **exactement la même valeur** que `WEBHOOK_SECRET` côté back-end |
   | `BACKEND_WEBHOOK_URL` | `https://payon-backend.onrender.com/api/webhooks/paiement` (l'URL notée à l'étape 2) |

4. **Create Web Service** — notez cette URL aussi (ex. `https://payon-mock.onrender.com`)

5. **Retournez sur le service back-end** (étape 2) → mettez à jour `MOCK_SERVICE_URL` avec cette URL mock → sauvegardez (Render redéploie automatiquement)

---

## 4. Front-end — Vercel

1. Créer un compte sur [vercel.com](https://vercel.com) (connexion via GitHub)
2. **Add New → Project** → sélectionnez le repo `pay-on`
3. Configuration :
   - **Root Directory** : `frontend`
   - **Framework Preset** : Vite (détecté automatiquement normalement)
4. Variables d'environnement :

   | Clé | Valeur |
   |---|---|
   | `VITE_API_BASE_URL` | `https://payon-backend.onrender.com` (l'URL du back-end) |
   | `VITE_USE_MOCK` | `false` |

5. **Deploy** — Vercel donne une URL du type `https://pay-on.vercel.app`

6. **Retournez sur le service back-end (Render)** → mettez à jour `FRONTEND_ORIGIN` avec cette URL Vercel exacte → sauvegardez (redéploiement automatique)

---

## 5. Vérification finale

1. Ouvrez l'URL Vercel dans un navigateur
2. Testez le parcours déjà validé en local : créer un événement → tier → publier → acheter un billet → voir le QR
3. Premier appel un peu lent (10-20 secondes) si les services Render viennent de "se réveiller" — normal sur le gratuit, pas un bug

Si ça ne marche pas du premier coup, la cause la plus probable est une variable d'environnement mal recopiée (URL avec ou sans `/` final, secret différent entre back-end et mock) — comparez les 4 tableaux ci-dessus avec ce qui est réellement dans Render/Vercel.

---

## 6. Partager avec l'équipe

Une fois vérifié, partagez simplement l'URL Vercel (`https://pay-on.vercel.app` ou équivalent) à vos deux camarades. Ils n'ont rien à installer — juste ouvrir le lien et tester.

## URLs de ce déploiement (à compléter une fois fait)

| Service | URL |
|---|---|
| Front-end (à partager) | |
| Back-end | |
| Mock paiement | |
| Base de données | Neon — voir dashboard neon.tech |
