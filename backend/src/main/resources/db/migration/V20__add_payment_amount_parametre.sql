INSERT INTO parametres (cle, valeur, description) VALUES
  ('payment_amount', '5000', 'Montant en FCFA requis pour obtenir un certificat numérique')
ON CONFLICT (cle) DO NOTHING;
