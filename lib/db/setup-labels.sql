-- Run this as a superuser or postgres admin to set up the labels table and permissions
-- psql -U postgres -d anksboutique -f setup-labels.sql

-- Create the labels table
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions to anksboutique user
GRANT ALL PRIVILEGES ON TABLE labels TO anksboutique;
GRANT USAGE, SELECT ON SEQUENCE labels_id_seq TO anksboutique;

-- Ensure the user has schema permissions
GRANT USAGE ON SCHEMA public TO anksboutique;
GRANT CREATE ON SCHEMA public TO anksboutique;

-- Seed default labels
INSERT INTO labels (name, slug, description, sort_order, status) VALUES
  ('New', 'new', 'Etichetă pentru produse noi', 1, 'active'),
  ('Best Seller', 'best-seller', 'Cele mai vândute produse', 2, 'active'),
  ('Limited', 'limited', 'Colecție limitată', 3, 'active')
ON CONFLICT (slug) DO NOTHING;

-- Commit
COMMIT;
