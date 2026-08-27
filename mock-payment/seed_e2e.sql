-- Seed E2E pour tester le webhook paiement
-- Idempotent: nettoie les enregistrements de test avant de recréer.

BEGIN;

-- UUIDs fixes pour pouvoir les réutiliser depuis les 3 scénarios
-- TX_SUCCESS  -> scenario success
-- TX_FAILURE  -> scenario failure
-- TX_PENDING  -> scenario pending
-- Les 3 transactions partagent le même EVENT_ID pour valider la cohérence event_id

DELETE FROM billets WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333'
);
DELETE FROM transactions WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
DELETE FROM tier_billets WHERE id = '99999999-9999-9999-9999-999999999999';
DELETE FROM evenements WHERE id = '88888888-8888-8888-8888-888888888888';
DELETE FROM utilisateurs WHERE id IN (
  '77777777-7777-7777-7777-777777777777',
  '66666666-6666-6666-6666-666666666666'
);
DELETE FROM mock_transactions WHERE transaction_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);

-- Utilisateur organisateur
INSERT INTO utilisateurs (id, email, password_hash, nom_complet, role, is_active, created_at)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'org-e2e@payon.test',
  'seed_dummy_hash',
  'Org E2E',
  'organisateur',
  true,
  now()
);

-- Utilisateur acheteur
INSERT INTO utilisateurs (id, email, password_hash, nom_complet, role, is_active, created_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'buyer-e2e@payon.test',
  'seed_dummy_hash',
  'Buyer E2E',
  'participant',
  true,
  now()
);

-- Événement (partagé par les 3 transactions)
INSERT INTO evenements (
  id, organisateur_id, titre, description, statut,
  lieu_nom, adresse, ville, date_debut, date_fin,
  created_at, updated_at
) VALUES (
  '88888888-8888-8888-8888-888888888888',
  '77777777-7777-7777-7777-777777777777',
  'E2E Concert', 'Evenement pour test webhook',
  'publie',
  'Salle E2E', '1 rue du Test', 'Dakar', now(), now() + interval '7 day',
  now(), now()
);

-- Tier de billet
INSERT INTO tier_billets (
  id, event_id, nom, prix, devise, quantite_totale, quantite_vendue, is_active
) VALUES (
  '99999999-9999-9999-9999-999999999999',
  '88888888-8888-8888-8888-888888888888',
  'Standard', 15000, 'XOF', 100, 0, true
);

-- 3 Transactions en_attente
INSERT INTO transactions (id, user_id, montant, devise, statut, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 15000, 'XOF', 'en_attente', now(), now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '66666666-6666-6666-6666-666666666666', 15000, 'XOF', 'en_attente', now(), now()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 15000, 'XOF', 'en_attente', now(), now());

-- 3 Billets pré-créés (1 par transaction, statut valide, qr_code null)
INSERT INTO billets (id, tier_id, proprietaire_user_id, transaction_id, statut, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999',
   '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'valide', now()),
  ('22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999',
   '66666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'valide', now()),
  ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999',
   '66666666-6666-6666-6666-666666666666', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'valide', now());

COMMIT;

-- Vérification
SELECT id, statut, montant FROM transactions WHERE id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
SELECT id, transaction_id, statut FROM billets WHERE transaction_id IN (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'
);
