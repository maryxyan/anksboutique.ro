<?php
/**
 * Database Setup Script - Create labels table
 *
 * Access via browser: https://anksboutique.ro/db-setup.php
 * Delete this file after running!
 */

// Use the same DB credentials as the app
// The API proxy connects to Node.js which uses DATABASE_URL
// For direct DB access via PHP, we need pg_connect

$dbUrl = getenv('DATABASE_URL') ?: '';

// Parse DATABASE_URL (postgresql://user:pass@host:5432/dbname)
if (empty($dbUrl)) {
    // Try to read from .env or use default cPanel PostgreSQL settings
    $dbHost = 'localhost';
    $dbPort = 5432;
    $dbName = 'anksboutique';
    $dbUser = 'anksboutique';
    $dbPass = '';
    
    echo "<div style='font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;'>";
    echo "<h2>Database Setup</h2>";
    echo "<p style='color: #666;'>DATABASE_URL not found in environment.</p>";
    
    // Try to detect from common cPanel PostgreSQL env vars
    if (getenv('PGHOST')) $dbHost = getenv('PGHOST');
    if (getenv('PGPORT')) $dbPort = getenv('PGPORT');
    if (getenv('PGDATABASE')) $dbName = getenv('PGDATABASE');
    if (getenv('PGUSER')) $dbUser = getenv('PGUSER');
    if (getenv('PGPASSWORD')) $dbPass = getenv('PGPASSWORD');
    
} else {
    $parts = parse_url($dbUrl);
    $dbHost = $parts['host'] ?? 'localhost';
    $dbPort = $parts['port'] ?? 5432;
    $dbUser = $parts['user'] ?? 'anksboutique';
    $dbPass = $parts['pass'] ?? '';
    $dbName = ltrim($parts['path'] ?? '/anksboutique', '/');
}

echo "<h2>Database Setup</h2>";
echo "<p>Host: $dbHost:$dbPort</p>";
echo "<p>Database: $dbName</p>";
echo "<p>User: $dbUser</p>";
echo "<hr>";

// Connect to PostgreSQL
$conn = @pg_connect("host=$dbHost port=$dbPort dbname=$dbName user=$dbUser password=$dbPass");

if (!$conn) {
    echo "<p style='color: red; font-weight: bold;'>Failed to connect: " . pg_last_error() . "</p>";
    echo "<p>To create the table manually, open phpMyAdmin (or PostgreSQL admin in cPanel) and run:</p>";
    echo "<pre style='background: #f5f5f5; padding: 15px; overflow-x: auto; font-size: 13px;'>";
} else {
    echo "<p style='color: green;'>✓ Connected to PostgreSQL successfully!</p>";

    // Create labels table
    $sql = "
CREATE TABLE IF NOT EXISTS labels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);";

    $result = @pg_query($conn, $sql);
    if ($result) {
        echo "<p style='color: green;'>✓ 'labels' table created successfully!</p>";
    } else {
        echo "<p style='color: orange;'>Table creation: " . pg_last_error($conn) . "</p>";
        echo "<p>(May already exist — that's fine)</p>";
    }

    // Seed default labels
    $seedSQL = "
INSERT INTO labels (name, slug, description, sort_order, status) VALUES
  ('New', 'new', 'Eticheta pentru produse noi', 1, 'active'),
  ('Best Seller', 'best-seller', 'Cele mai vandute produse', 2, 'active'),
  ('Limited', 'limited', 'Colectie limitata', 3, 'active')
ON CONFLICT (slug) DO NOTHING;";

    $result = @pg_query($conn, $seedSQL);
    if ($result) {
        echo "<p style='color: green;'>✓ Default labels seeded successfully!</p>";
    } else {
        echo "<p style='color: orange;'>Seed: " . pg_last_error($conn) . "</p>";
    }

    // Grant permissions
    $permSQL = "GRANT ALL PRIVILEGES ON TABLE labels TO $dbUser;";
    @pg_query($conn, $permSQL);
    $permSQL2 = "GRANT USAGE, SELECT ON SEQUENCE labels_id_seq TO $dbUser;";
    @pg_query($conn, $permSQL2);

    pg_close($conn);
    echo "<hr><p style='color: green; font-weight: bold;'>✓ Setup complete!</p>";
    echo "<p><strong>Next step:</strong> Upload the updated dist files to the server.</p>";
    echo "<p>1. Copy the contents of <code>artifacts/api-server/dist/</code> to your server</p>";
    echo "<p>2. Restart the Node.js API server (via cPanel -> Setup Node.js App -> Restart)</p>";
}

// Show the SQL for manual execution
echo "<h3>Manual SQL (if needed):</h3>";
echo "<pre style='background: #f5f5f5; padding: 15px; overflow-x: auto; font-size: 13px;'>";
echo htmlspecialchars("
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
");
echo "</pre>";
echo "<p style='color: #999; font-size: 12px;'>Delete this file after setup: <code>db-setup.php</code></p>";
echo "</div>";
