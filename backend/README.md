# PAY-ON Backend

Ce dossier contient le squelette du backend Node.js/Express pour PAY-ON, avec connexion PostgreSQL via Prisma.

## Stack choisie

- Express : framework HTTP minimaliste et familier pour le MVP
- Prisma : ORM moderne avec migration schema-first, typage fort et support PostgreSQL fiable pour ce projet
- PostgreSQL : base de données pilotée par le contrat technique

## Prérequis

- Node.js 18+
- PostgreSQL 14+ en local ou accessible via réseau
- npm

## Installation locale

1. Installer les dépendances :

```bash
npm install
```

2. Copier le fichier d'environnement :

```bash
cp .env.example .env
```

3. Ajuster les variables dans `.env` selon votre instance PostgreSQL locale. Ne commitez jamais de vraie valeur, et conservez uniquement le fichier `.env.example` dans le dépôt.

4. Créer la base de données PostgreSQL si elle n'existe pas :

```sql
CREATE DATABASE payon_dev;
```

5. Appliquer les migrations Prisma :

```bash
npx prisma migrate dev --name init
```

6. Générer le client Prisma :

```bash
npx prisma generate
```

7. Démarrer le serveur en mode développement :

```bash
npm run dev
```

Le serveur écoute par défaut sur le port défini dans `.env` (par défaut `3000`).

## Structure du projet

```text
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── server.js
├── .env.example
├── README.md
├── package.json
└── .gitignore
```

## Notes de conception

- Le projet n'implémente pas encore les endpoints métier : seul le squelette technique et le schéma DB sont présents.
- Le webhook paiement repose sur la vérification HMAC SHA-256 sur le corps brut, conformément au contrat technique.
- La validation métier des règles de business sera ajoutée dans le prochain cycle de développement.

## Commandes utiles

```bash
npm run prisma:validate
npm run prisma:studio
npm run start
```
