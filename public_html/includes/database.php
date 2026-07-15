<?php
/**
 * Database initialization and helper functions
 */

function getDB() {
    static $db = null;
    if ($db === null) {
        $dbPath = defined('DB_PATH') ? DB_PATH : __DIR__ . '/../../data/anksboutique.db';
        $dbDir = dirname($dbPath);
        if (!is_dir($dbDir)) {
            mkdir($dbDir, 0755, true);
        }
        try {
            $db = new SQLite3($dbPath);
            $db->enableExceptions(true);
            $db->exec('PRAGMA journal_mode=WAL');
            $db->exec('PRAGMA foreign_keys=ON');
        } catch (Exception $e) {
            die('Database connection failed: ' . $e->getMessage());
        }
    }
    return $db;
}

function initializeDatabase() {
    $db = getDB();

    // Fast idempotency guard: avoid re-running schema+seeding checks on every request.
    // If the schema marker exists, assume initialization already happened.
    $marker = 'schema_initialized';
    $chk = $db->prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='app_meta'");
    $hasMeta = $chk->execute()->fetchArray(SQLITE3_ASSOC);

    if ($hasMeta) {
        $stmt = $db->prepare("SELECT 1 FROM app_meta WHERE key = ? LIMIT 1");
        $stmt->bindValue(1, $marker, SQLITE3_TEXT);
        $res = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
        if ($res) {
            return;
        }
    }

    // Create tables

    $db->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            image_url TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    $db->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            compare_price DECIMAL(10,2),
            image_url TEXT,
            image_url_2 TEXT,
            stock INTEGER DEFAULT 0,
            featured INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
    ");
    
    // Product Variant Images: link a color name to a specific image URL
    $db->exec("
        CREATE TABLE IF NOT EXISTS product_variant_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            color_name TEXT NOT NULL,
            image_url TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(product_id, color_name, image_url)
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            country TEXT DEFAULT 'Romania',
            is_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS carts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            price DECIMAL(10,2) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            session_id TEXT,
            order_number TEXT NOT NULL UNIQUE,
            status TEXT DEFAULT 'pending',
            subtotal DECIMAL(10,2) NOT NULL,
            shipping DECIMAL(10,2) DEFAULT 0,
            tax DECIMAL(10,2) DEFAULT 0,
            total DECIMAL(10,2) NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            country TEXT DEFAULT 'Romania',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    $db->exec("
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER,
            product_name TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            quantity INTEGER NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
    ");
    
    // Insert default admin user if not exists
    $stmt = $db->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
    $stmt->bindValue(1, 'admin@anksboutique.ro', SQLITE3_TEXT);
    $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
    
    if ($result['count'] == 0) {
        $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt = $db->prepare("INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES (?, ?, ?, ?, 1)");
        $stmt->bindValue(1, 'admin@anksboutique.ro', SQLITE3_TEXT);
        $stmt->bindValue(2, $adminPassword, SQLITE3_TEXT);
        $stmt->bindValue(3, 'Admin', SQLITE3_TEXT);
        $stmt->bindValue(4, 'User', SQLITE3_TEXT);
        $stmt->execute();
    }
    
    // Insert default categories if not exists
    $count = $db->querySingle("SELECT COUNT(*) FROM categories");
    if ($count == 0) {
        $categories = [
            ['Women', 'women', 'Elegant women\'s fashion collection'],
            ['Men', 'men', 'Sophisticated men\'s fashion collection'],
            ['Accessories', 'accessories', 'Premium accessories to complete your look'],
            ['New Arrivals', 'new-arrivals', 'Latest additions to our collection'],
            ['Sale', 'sale', 'Discounted items - limited time offers'],
        ];
        
        $stmt = $db->prepare("INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)");
        foreach ($categories as $i => $cat) {
            $stmt->bindValue(1, $cat[0], SQLITE3_TEXT);
            $stmt->bindValue(2, $cat[1], SQLITE3_TEXT);
            $stmt->bindValue(3, $cat[2], SQLITE3_TEXT);
            $stmt->bindValue(4, $i + 1, SQLITE3_INTEGER);
            $stmt->execute();
        }
    }
    
    // Create app_meta marker table (used to avoid re-running init/seeding)
    $db->exec("CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT);");
    $db->exec("INSERT OR IGNORE INTO app_meta (key, value) VALUES ('schema_initialized', '1');");

    // Labels/tags
    $db->exec("
        CREATE TABLE IF NOT EXISTS labels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");


    // Insert sample products if not exists
    $count = $db->querySingle("SELECT COUNT(*) FROM products");
    if ($count == 0) {

        $products = [
            [1, 'Elegant Silk Blouse', 'elegant-silk-blouse', 'A beautiful silk blouse perfect for any occasion. Made from 100% premium silk with a relaxed fit.', 249.99, 329.99, 25, 1, 1],
            [1, 'Floral Summer Dress', 'floral-summer-dress', 'Light and airy summer dress with a beautiful floral pattern. Perfect for warm days.', 199.99, 279.99, 30, 1, 1],
            [1, 'Tailored Wool Blazer', 'tailored-wool-blazer', 'Classic tailored blazer made from premium Italian wool. Timeless elegance.', 449.99, 599.99, 15, 1, 1],
            [1, 'Cashmere Crew Neck Sweater', 'cashmere-crew-neck-sweater', 'Luxuriously soft cashmere sweater. A wardrobe essential for cooler months.', 389.99, 459.99, 20, 0, 1],
            [2, 'Linen Button-Down Shirt', 'linen-button-down-shirt', 'Premium linen shirt perfect for casual and formal occasions. Breathable and comfortable.', 179.99, 229.99, 35, 1, 1],
            [2, 'Slim Fit Chinos', 'slim-fit-chinos', 'Modern slim fit chinos in premium cotton twill. Versatile and comfortable.', 159.99, 199.99, 40, 1, 1],
            [2, 'Merino Wool Suit Jacket', 'merino-wool-suit-jacket', 'Elegant suit jacket crafted from fine Merino wool. Perfect for business and formal events.', 599.99, 799.99, 10, 1, 1],
            [2, 'Leather Bomber Jacket', 'leather-bomber-jacket', 'Genuine leather bomber jacket with a modern twist. A timeless investment piece.', 899.99, 1099.99, 8, 0, 1],
            [3, 'Italian Leather Belt', 'italian-leather-belt', 'Handcrafted Italian leather belt with a polished brass buckle.', 89.99, 119.99, 50, 1, 1],
            [3, 'Silk Twill Scarf', 'silk-twill-scarf', 'Luxurious silk twill scarf with hand-rolled edges. A versatile accessory.', 129.99, 169.99, 45, 1, 1],
            [3, 'Aviator Sunglasses', 'aviator-sunglasses', 'Classic aviator sunglasses with UV400 protection and gold-tone frame.', 149.99, 199.99, 30, 0, 1],
            [3, 'Leather Crossbody Bag', 'leather-crossbody-bag', 'Compact leather crossbody bag with adjustable strap and multiple compartments.', 299.99, 379.99, 20, 1, 1],
            [4, 'Limited Edition Chronograph Watch', 'limited-edition-chronograph-watch', 'Exclusive limited edition chronograph watch with Swiss movement. Only 100 pieces.', 1299.99, 1599.99, 5, 1, 1],
            [4, 'Designer Sneakers - Summer Collection', 'designer-sneakers-summer', 'Limited edition designer sneakers from our summer collaboration collection.', 459.99, 549.99, 15, 1, 1],
            [5, 'Last Season Silk Dress', 'last-season-silk-dress', 'Previous season silk dress at a reduced price. Still stunning and timeless.', 149.99, 349.99, 10, 0, 1],
            [5, 'Clearance Cotton Trousers', 'clearance-cotton-trousers', 'Premium cotton trousers at a clearance price. Limited sizes available.', 79.99, 189.99, 8, 0, 1],
        ];
        
        $stmt = $db->prepare("INSERT INTO products (category_id, name, slug, description, price, compare_price, stock, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        foreach ($products as $p) {
            $stmt->bindValue(1, $p[0], SQLITE3_INTEGER);
            $stmt->bindValue(2, $p[1], SQLITE3_TEXT);
            $stmt->bindValue(3, $p[2], SQLITE3_TEXT);
            $stmt->bindValue(4, $p[3], SQLITE3_TEXT);
            $stmt->bindValue(5, $p[4], SQLITE3_FLOAT);
            $stmt->bindValue(6, $p[5], SQLITE3_FLOAT);
            $stmt->bindValue(7, $p[6], SQLITE3_INTEGER);
            $stmt->bindValue(8, $p[7], SQLITE3_INTEGER);
            $stmt->execute();
        }
    }
}

/**
 * Cart helper functions
 */
function getOrCreateCart() {
    $db = getDB();
    session_start();
    
    $userId = $_SESSION['user_id'] ?? null;
    $sessionId = session_id();
    
    if ($userId) {
        $stmt = $db->prepare("SELECT id FROM carts WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1");
        $stmt->bindValue(1, $userId, SQLITE3_INTEGER);
        $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
        if ($result) {
            return $result['id'];
        }
    } else {
        $stmt = $db->prepare("SELECT id FROM carts WHERE session_id = ? AND user_id IS NULL ORDER BY updated_at DESC LIMIT 1");
        $stmt->bindValue(1, $sessionId, SQLITE3_TEXT);
        $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
        if ($result) {
            return $result['id'];
        }
    }
    
    // Create new cart
    $stmt = $db->prepare("INSERT INTO carts (user_id, session_id) VALUES (?, ?)");
    $stmt->bindValue(1, $userId, SQLITE3_INTEGER);
    $stmt->bindValue(2, $sessionId, SQLITE3_TEXT);
    $stmt->execute();
    return $db->lastInsertRowID();
}

function getCartCount() {
    $db = getDB();
    session_start();
    
    $cartId = getOrCreateCart();
    $stmt = $db->prepare("SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = ?");
    $stmt->bindValue(1, $cartId, SQLITE3_INTEGER);
    $result = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
    return $result['count'] ?? 0;
}

function getCartItems() {
    $db = getDB();
    $cartId = getOrCreateCart();
    
    $stmt = $db->prepare("
        SELECT ci.*, p.name, p.slug, p.image_url, p.stock 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at DESC
    ");
    $stmt->bindValue(1, $cartId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    
    $items = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $items[] = $row;
    }
    return $items;
}

function getCartTotal() {
    $items = getCartItems();
    $total = 0;
    foreach ($items as $item) {
        $total += $item['price'] * $item['quantity'];
    }
    return $total;
}

function clearCart() {
    $db = getDB();
    $cartId = getOrCreateCart();
    $stmt = $db->prepare("DELETE FROM cart_items WHERE cart_id = ?");
    $stmt->bindValue(1, $cartId, SQLITE3_INTEGER);
    $stmt->execute();
}
