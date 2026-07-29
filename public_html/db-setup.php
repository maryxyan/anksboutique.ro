<?php
/**
 * Database Setup Script - Create labels table
 *
 * IMPORTANT: This PHP setup failed because pg_connect is not available.
 * 
 * The GOOD NEWS: The code now auto-creates the table on server startup!
 * 
 * What you need to do:
 * 1. Upload the updated dist/ folder (from artifacts/api-server/dist/)
 * 2. Restart the Node.js API server
 * 3. That's it! The server will create the labels table automatically
 *
 * ================================================
 * MANUAL SQL (if auto-creation doesn't work):
 * Go to cPanel -> PostgreSQL Databases -> phpPgAdmin
 * Or use the PostgreSQL section in cPanel to run:
 * ================================================
 *
 * CREATE TABLE IF NOT EXISTS labels (
 *   id SERIAL PRIMARY KEY,
 *   name TEXT NOT NULL,
 *   slug TEXT NOT NULL UNIQUE,
 *   description TEXT,
 *   sort_order INTEGER NOT NULL DEFAULT 0,
 *   status TEXT NOT NULL DEFAULT 'active',
 *   created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
 * );
 *
 * INSERT INTO labels (name, slug, description, sort_order, status) VALUES
 *   ('New', 'new', 'Eticheta pentru produse noi', 1, 'active'),
 *   ('Best Seller', 'best-seller', 'Cele mai vandute produse', 2, 'active'),
 *   ('Limited', 'limited', 'Colectie limitata', 3, 'active')
 * ON CONFLICT (slug) DO NOTHING;
 */
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<title>Database Setup - Labels Table</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; }
  h2 { color: #333; }
  .step { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .step h3 { margin: 0 0 8px 0; color: #166534; }
  .step p { margin: 4px 0; color: #166534; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .warning h3 { margin: 0 0 8px 0; color: #92400e; }
  .warning p { margin: 4px 0; color: #92400e; }
  .error-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .error-box h3 { margin: 0 0 8px 0; color: #991b1b; }
  .error-box p { margin: 4px 0; color: #991b1b; }
</style>
</head>
<body>
  <h2>Configurare Database - Etichete (Labels)</h2>

  <div class="step">
    <h3>✅ Pasul 1: Incarca fisierele actualizate</h3>
    <p>Urcati continutul din folderul <code>artifacts/api-server/dist/</code> pe server, in locatia unde ruleaza API-ul.</p>
  </div>

  <div class="step">
    <h3>✅ Pasul 2: Restartati API-ul Node.js</h3>
    <p>Din cPanel → Setup Node.js App → dati restart.</p>
    <p>Dupa restart, serverul va crea automat tabela <code>labels</code> si o va popula cu cele 3 etichete implicite.</p>
  </div>

  <div class="step">
    <h3>✅ Pasul 3: Verificati</h3>
    <p>Accesati pagina de etichete din admin. Ar trebui sa se incarce corect acum.</p>
  </div>

  <hr>

  <div class="error-box">
    <h3>⚠️ PHP PostgreSQL Extension (pg_connect) nu este disponibila</h3>
    <p>Scriptul PHP nu poate crea tabela direct.</p>
  </div>

  <div class="warning">
    <h3>🛠 Daca auto-crearea nu functioneaza (sql manual)</h3>
    <p>1. Accesati cPanel → PostgreSQL Databases → phpPgAdmin</p>
    <p>2. Selectati baza de date <code>anksboutique</code></p>
    <p>3. Deschideti tab-ul "SQL" si rulati:</p>
  </div>

  <pre>
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO labels (name, slug, description, sort_order, status) VALUES
  ('New', 'new', 'Eticheta pentru produse noi', 1, 'active'),
  ('Best Seller', 'best-seller', 'Cele mai vandute produse', 2, 'active'),
  ('Limited', 'limited', 'Colectie limitata', 3, 'active')
ON CONFLICT (slug) DO NOTHING;</pre>

  <hr>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">
    Stergeti acest fisier dupa ce ati rezolvat setup-ul: <code>db-setup.php</code>
  </p>
</body>
</html>
