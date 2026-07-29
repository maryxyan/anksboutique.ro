<?php
/**
 * Database Setup - Create labels table on live database
 * 
 * This script tries multiple approaches to create the labels table:
 * 1. Via psql command line
 * 2. Via Node.js from the project directory (where pg module exists)
 * 3. Falls back to showing the SQL for manual execution
 * 
 * Access: https://anksboutique.ro/db-setup.php
 * ⚠️ DELETE THIS FILE AFTER RUNNING! ⚠️
 */

header('Content-Type: text/html; charset=utf-8');

// The SQL to run
$sql = "
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
ON CONFLICT (slug) DO NOTHING;
";
?>
<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<title>Database Setup - Labels Table</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #333; }
  h2 { color: #111; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
  .box { border-radius: 8px; padding: 16px; margin: 16px 0; }
  .success { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
  .error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }
  .info { background: #eff6ff; border: 1px solid #93c5fd; color: #1e40af; }
  .warning { background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
</style>
</head>
<body>
  <h2>Configurare Database - Etichete (Labels)</h2>

<?php
$success = false;

// ── Approach 1: Try Node.js from the project directory ──
$projectDirs = [
    '/home/r142031anks/temp_repo',
    '/home/r142031anks/anks',
    getenv('HOME') . '/temp_repo',
    getenv('HOME') . '/anks',
];

$nodePaths = [
    '/home/r142031anks/node-v22.14.0-linux-x64/bin/node',
    '/home/r142031anks/node-v22.14-linux-x64/bin/node',
    '/usr/local/bin/node',
    '/usr/bin/node',
    '/home/r142031anks/.nvm/versions/node/v22/bin/node',
];

exec('which node 2>/dev/null', $whichOutput, $whichCode);
if ($whichCode === 0 && !empty($whichOutput[0])) {
    array_unshift($nodePaths, $whichOutput[0]);
}

$nodeBin = null;
foreach ($nodePaths as $p) {
    if (file_exists($p)) { $nodeBin = $p; break; }
}

$projectDir = null;
foreach ($projectDirs as $d) {
    if (is_dir($d) && file_exists($d . '/node_modules/.pnpm/pg')) { $projectDir = $d; break; }
}

if ($nodeBin && $projectDir) {
    echo '<div class="info">✅ Found Node.js at: ' . htmlspecialchars($nodeBin) . '</div>';
    echo '<div class="info">✅ Found project at: ' . htmlspecialchars($projectDir) . '</div>';

    $tmpScript = $projectDir . '/db-setup-tmp.mjs';
    $scriptContent = <<<'JAVASCRIPT'
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://anksboutique@localhost:5432/anksboutique' });

async function main() {
  const sql = `
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
    ON CONFLICT (slug) DO NOTHING;
  `;
  try {
    await pool.query(sql);
    console.log('SUCCESS: Labels table created and seeded');
    const r = await pool.query('SELECT id, name, slug FROM labels ORDER BY sort_order');
    console.log('Labels in database:');
    r.rows.forEach(row => console.log(`  - ${row.name} (${row.slug})`));
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
main();
JAVASCRIPT;

    file_put_contents($tmpScript, $scriptContent);

    $cmd = sprintf(
        'cd %s && DATABASE_URL="postgresql://anksboutique@localhost:5432/anksboutique" %s %s 2>&1',
        escapeshellarg($projectDir),
        escapeshellcmd($nodeBin),
        escapeshellarg($tmpScript)
    );
    
    $output = []; $exitCode = 0;
    exec($cmd, $output, $exitCode);
    @unlink($tmpScript);

    if ($exitCode === 0) {
        $success = true;
        echo '<div class="success"><h3>✅ Succes!</h3>';
        echo implode('<br>', array_map('htmlspecialchars', $output));
        echo '</div>';
    } else {
        echo '<div class="error"><h3>❌ Node.js approach failed</h3>';
        echo '<pre>' . htmlspecialchars(implode("\n", $output)) . '</pre></div>';
    }
}

// ── Approach 2: Try psql ──
if (!$success) {
    exec('which psql 2>/dev/null', $psqlOut, $psqlCode);
    if ($psqlCode === 0 && !empty($psqlOut[0])) {
        echo '<div class="info">✅ Found psql at: ' . htmlspecialchars($psqlOut[0]) . '</div>';
        
        $tmpSqlFile = '/tmp/db-setup-' . uniqid() . '.sql';
        file_put_contents($tmpSqlFile, $sql);
        
        $cmd = sprintf(
            'psql postgresql://anksboutique@localhost:5432/anksboutique -f %s 2>&1',
            escapeshellarg($tmpSqlFile)
        );
        
        $output = []; $exitCode = 0;
        exec($cmd, $output, $exitCode);
        @unlink($tmpSqlFile);
        
        echo '<pre>' . htmlspecialchars(implode("\n", $output)) . '</pre>';
        
        if ($exitCode === 0) {
            $success = true;
            echo '<div class="success"><h3>✅ Labels table created successfully via psql!</h3></div>';
        } else {
            echo '<div class="error"><h3>❌ psql approach failed</h3></div>';
        }
    }
}

// ── Final result ──
if ($success) {
    echo '<hr>';
    echo '<div class="success"><h3>✅ Setup complet!</h3>';
    echo '<p><strong>Acum restartati API-ul Node.js:</strong></p>';
    echo '<p>cPanel → <strong>Setup Node.js App</strong> → Restart</p>';
    echo '<p>Apoi verificati pagina de etichete din admin.</p></div>';
} else {
    echo '<hr>';
    echo '<div class="warning"><h3>📋 Pentru executie manuala in cPanel</h3>';
    echo '<p>Mergeti la <strong>cPanel → PostgreSQL Databases</strong> si cautati optiunea <strong>phpPgAdmin</strong> sau <strong>Manage PostgreSQL</strong>.</p>';
    echo '<p>Deschideti baza de date si rulati acest SQL in tab-ul "SQL":</p></div>';
}

// Always show the SQL
echo '<h3>SQL to run:</h3>';
echo '<pre>' . htmlspecialchars($sql) . '</pre>';

echo '<hr>';
echo '<p style="color: #999; font-size: 12px; margin-top: 32px;">⚠️ Stergeti acest fisier dupa ce ati terminat: <code>db-setup.php</code></p>';
?>
</body>
</html>
