-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('participant', 'organisateur', 'vendeur', 'staff_scan');

-- CreateEnum
CREATE TYPE "EventStatut" AS ENUM ('brouillon', 'publie', 'presale', 'live', 'cloture', 'annule');

-- CreateEnum
CREATE TYPE "BilletStatut" AS ENUM ('valide', 'scanne', 'annule', 'rembourse');

-- CreateEnum
CREATE TYPE "TransactionStatut" AS ENUM ('en_attente', 'succes', 'echec', 'rembourse');

-- CreateEnum
CREATE TYPE "ProduitVendeurStatut" AS ENUM ('presale', 'live', 'epuise', 'ferme');

-- CreateEnum
CREATE TYPE "CommandeVendeurStatut" AS ENUM ('en_attente', 'payee', 'prete_retrait', 'remise', 'annulee');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "password_hash" TEXT NOT NULL,
    "nom_complet" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" UUID NOT NULL,
    "organisateur_id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "statut" "EventStatut" NOT NULL DEFAULT 'brouillon',
    "lieu_nom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tier_billets" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "devise" TEXT NOT NULL,
    "quantite_totale" INTEGER NOT NULL,
    "quantite_vendue" INTEGER NOT NULL DEFAULT 0,
    "ventes_debut" TIMESTAMP(3),
    "ventes_fin" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tier_billets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billets" (
    "id" UUID NOT NULL,
    "tier_id" UUID NOT NULL,
    "proprietaire_user_id" UUID NOT NULL,
    "qr_code" TEXT,
    "statut" "BilletStatut" NOT NULL DEFAULT 'valide',
    "transaction_id" UUID NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "scanned_by_user_id" UUID,
    "point_entree" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "devise" TEXT NOT NULL,
    "statut" "TransactionStatut" NOT NULL DEFAULT 'en_attente',
    "reference_externe" TEXT,
    "provider" TEXT,
    "split_organisateur" DECIMAL(10,2),
    "split_vendeur" DECIMAL(10,2),
    "split_plateforme" DECIMAL(10,2),
    "split_note" TEXT,
    "failure_reason" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_options" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "libelle" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "billet_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "vote_option_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits_vendeur" (
    "id" UUID NOT NULL,
    "vendeur_user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "prix" DECIMAL(10,2) NOT NULL,
    "devise" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "statut" "ProduitVendeurStatut" NOT NULL DEFAULT 'presale',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produits_vendeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes_vendeur" (
    "id" UUID NOT NULL,
    "produit_id" UUID NOT NULL,
    "acheteur_user_id" UUID NOT NULL,
    "quantite" INTEGER NOT NULL,
    "montant_total" DECIMAL(10,2) NOT NULL,
    "statut" "CommandeVendeurStatut" NOT NULL DEFAULT 'en_attente',
    "transaction_id" UUID NOT NULL,
    "qr_code_retrait" TEXT,
    "retrait_scanned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_vendeur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_transactions" (
    "transaction_id" UUID NOT NULL,
    "reference_externe" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scenario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhook_sent_at" TIMESTAMP(3),

    CONSTRAINT "mock_transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_telephone_key" ON "utilisateurs"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "billets_qr_code_key" ON "billets"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "votes_billet_id_event_id_key" ON "votes"("billet_id", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "commandes_vendeur_qr_code_retrait_key" ON "commandes_vendeur"("qr_code_retrait");

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_organisateur_id_fkey" FOREIGN KEY ("organisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tier_billets" ADD CONSTRAINT "tier_billets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "evenements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billets" ADD CONSTRAINT "billets_tier_id_fkey" FOREIGN KEY ("tier_id") REFERENCES "tier_billets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billets" ADD CONSTRAINT "billets_proprietaire_user_id_fkey" FOREIGN KEY ("proprietaire_user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billets" ADD CONSTRAINT "billets_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billets" ADD CONSTRAINT "billets_scanned_by_user_id_fkey" FOREIGN KEY ("scanned_by_user_id") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_options" ADD CONSTRAINT "vote_options_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "evenements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_billet_id_fkey" FOREIGN KEY ("billet_id") REFERENCES "billets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "evenements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_vote_option_id_fkey" FOREIGN KEY ("vote_option_id") REFERENCES "vote_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_vendeur" ADD CONSTRAINT "produits_vendeur_vendeur_user_id_fkey" FOREIGN KEY ("vendeur_user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits_vendeur" ADD CONSTRAINT "produits_vendeur_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "evenements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_vendeur" ADD CONSTRAINT "commandes_vendeur_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produits_vendeur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_vendeur" ADD CONSTRAINT "commandes_vendeur_acheteur_user_id_fkey" FOREIGN KEY ("acheteur_user_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes_vendeur" ADD CONSTRAINT "commandes_vendeur_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

