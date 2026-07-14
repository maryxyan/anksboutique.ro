<?php
$pageTitle = 'Admin - Produse';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/admin-utils.php';
requireAdmin();

$db = getDB();
$message = getFlash('success');
$error = getFlash('error');

// Handle delete (POST + CSRF)
if (admin_require_post_action('delete_product')) {
    admin_csrf_or_forbidden();

    $id = admin_post_int('id', 0);
    if ($id > 0) {
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->bindValue(1, $id, SQLITE3_INTEGER);
        $stmt->execute();
    }

    admin_set_flash_and_redirect('/admin/products.php', 'Produsul a fost șters.', 'success');
}

// Handle delete color variant image (POST + CSRF)
if (admin_require_post_action('delete_color')) {
    admin_csrf_or_forbidden();

    $colorId = admin_post_int('delete_color', 0);
    $productId = admin_post_int('product_id', 0);

    if ($colorId > 0 && $productId > 0) {
        $stmt = $db->prepare("DELETE FROM product_variant_images WHERE id = ? AND product_id = ?");
        $stmt->bindValue(1, $colorId, SQLITE3_INTEGER);
        $stmt->bindValue(2, $productId, SQLITE3_INTEGER);
        $stmt->execute();
    }

    admin_set_flash_and_redirect('/admin/products.php?edit=' . $productId, 'Imaginea pentru culoare a fost ștearsă.', 'success');
}

// Handle add/edit form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && !empty($_POST['action'])) {
    admin_csrf_or_forbidden();

    $name = trim(admin_post_string('name', ''));
    $category_id = admin_post_int('category_id', 0);
    $description = trim(admin_post_string('description', ''));
    $price = (float)($_POST['price'] ?? 0);
    $compare_price = (float)($_POST['compare_price'] ?? 0);
    $stock = admin_post_int('stock', 0);
    $featured = isset($_POST['featured']) ? 1 : 0;
    $slug = slugify($name);

    // Handle file upload for image_url
    $image_url = trim(admin_post_string('image_url', ''));
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
        $uploaded = handleImageUpload($_FILES['image_file']);
        if ($uploaded) {
            $image_url = $uploaded;
        }
    }

    // Handle file upload for image_url_2
    $image_url_2 = trim(admin_post_string('image_url_2', ''));
    if (isset($_FILES['image_file_2']) && $_FILES['image_file_2']['error'] === UPLOAD_ERR_OK) {
        $uploaded = handleImageUpload($_FILES['image_file_2']);
        if ($uploaded) {
            $image_url_2 = $uploaded;
        }
    }

    $action = (string)$_POST['action'];

    if ($action === 'edit' && isset($_POST['id'])) {
        $id = admin_post_int('id', 0);
        $stmt = $db->prepare("UPDATE products SET name=?, slug=?, category_id=?, description=?, price=?, compare_price=?, image_url=?, image_url_2=?, stock=?, featured=? WHERE id=?");
        $stmt->bindValue(11, $id, SQLITE3_INTEGER);
    } else {
        $stmt = $db->prepare("INSERT INTO products (name, slug, category_id, description, price, compare_price, image_url, image_url_2, stock, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
    }

    $stmt->bindValue(1, $name, SQLITE3_TEXT);
    $stmt->bindValue(2, $slug, SQLITE3_TEXT);
    $stmt->bindValue(3, $category_id ?: null, SQLITE3_INTEGER);
    $stmt->bindValue(4, $description, SQLITE3_TEXT);
    $stmt->bindValue(5, $price, SQLITE3_FLOAT);
    $stmt->bindValue(6, $compare_price ?: null, SQLITE3_FLOAT);
    $stmt->bindValue(7, $image_url ?: null, SQLITE3_TEXT);
    $stmt->bindValue(8, $image_url_2 ?: null, SQLITE3_TEXT);
    $stmt->bindValue(9, $stock, SQLITE3_INTEGER);
    $stmt->bindValue(10, $featured, SQLITE3_INTEGER);
    $stmt->execute();

    // If adding new product, get the new ID
    if ($action !== 'edit') {
        $id = $db->lastInsertRowID();
    }

    admin_set_flash_and_redirect('/admin/products.php' . ($action === 'edit' ? '?edit=' . $id : ''), 'Produs salvat cu succes.', 'success');
}

// Handle add color variant image
if (admin_require_post_action('add_color')) {
    admin_csrf_or_forbidden();

    $productId = admin_post_int('product_id', 0);
    $colorName = trim(admin_post_string('color_name', ''));
    // Support both URL and file upload for color image
    $imageUrl = trim(admin_post_string('image_url', ''));
    if (isset($_FILES['color_image_file']) && $_FILES['color_image_file']['error'] === UPLOAD_ERR_OK) {
        $uploaded = handleImageUpload($_FILES['color_image_file']);
        if ($uploaded) {
            $imageUrl = $uploaded;
        }
    }

    if ($productId && $colorName && $imageUrl) {
        // Check if this color already exists for this product
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM product_variant_images WHERE product_id = ? AND color_name = ?");
        $stmt->bindValue(1, $productId, SQLITE3_INTEGER);
        $stmt->bindValue(2, $colorName, SQLITE3_TEXT);
        $existing = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

        if ($existing['count'] > 0) {
            $error = 'Culoarea "' . escape($colorName) . '" există deja pentru acest produs.';
        } else {
            // Get next sort order
            $stmt = $db->prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM product_variant_images WHERE product_id = ?");
            $stmt->bindValue(1, $productId, SQLITE3_INTEGER);
            $nextSort = $stmt->execute()->fetchArray(SQLITE3_ASSOC)['next_sort'];

            $stmt = $db->prepare("INSERT INTO product_variant_images (product_id, color_name, image_url, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->bindValue(1, $productId, SQLITE3_INTEGER);
            $stmt->bindValue(2, $colorName, SQLITE3_TEXT);
            $stmt->bindValue(3, $imageUrl, SQLITE3_TEXT);
            $stmt->bindValue(4, $nextSort, SQLITE3_INTEGER);
            $stmt->execute();

            admin_set_flash_and_redirect('/admin/products.php?edit=' . $productId, 'Imaginea pentru culoare "' . escape($colorName) . '" a fost adăugată.', 'success');
        }
    } else {
        $error = 'Toate câmpurile pentru culoare sunt obligatorii.';
    }
}


// Get edit product
$editProduct = null;
$variantImages = [];
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->bindValue(1, (int)$_GET['edit'], SQLITE3_INTEGER);
    $editProduct = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
    
    if ($editProduct) {
        // Fetch color variant images
        $stmt = $db->prepare("SELECT * FROM product_variant_images WHERE product_id = ? ORDER BY sort_order ASC");
        $stmt->bindValue(1, $editProduct['id'], SQLITE3_INTEGER);
        $result = $stmt->execute();
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $variantImages[] = $row;
        }
    }
}

// Get all products
$products = $db->query("
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
");

// Get categories for dropdown
$categories = $db->query("SELECT * FROM categories ORDER BY sort_order ASC");
?>

<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="logo">Anks<span>Boutique</span></div>
        <ul class="admin-nav">
            <li><a href="/admin/"><span class="icon">📊</span>Dashboard</a></li>
            <li><a href="/admin/products.php" class="active"><span class="icon">📦</span>Produse</a></li>
            <li><a href="/admin/orders.php"><span class="icon">📋</span>Comenzi</a></li>
            <li><a href="/admin/users.php"><span class="icon">👥</span>Utilizatori</a></li>
            <li><a href="/"><span class="icon">←</span>Înapoi la site</a></li>
        </ul>
    </aside>
    
    <div class="admin-main">
        <div class="admin-header">
            <h2>Produse</h2>
            <button onclick="document.getElementById('productForm').scrollIntoView({behavior:'smooth'})" class="btn btn-primary btn-sm">
                <?= $editProduct ? 'Editează produs' : 'Adaugă produs' ?>
            </button>
        </div>
        
        <div class="admin-content">
            <?php if ($message): ?>
            <div class="alert alert-success"><?= escape($message) ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="alert alert-error"><?= escape($error) ?></div>
            <?php endif; ?>
            
            <!-- Product Form -->
            <div id="productForm" class="table-container" style="margin-bottom:2rem">
                <div class="table-header">
                    <h3><?= $editProduct ? 'Editează produsul' : 'Adaugă produs nou' ?></h3>
                </div>
                <form method="POST" enctype="multipart/form-data" style="padding:1.5rem">
                    <input type="hidden" name="action" value="<?= $editProduct ? 'edit' : 'add' ?>">
                    <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">

                    <?php if ($editProduct): ?>
                    <input type="hidden" name="id" value="<?= $editProduct['id'] ?>">
                    <?php endif; ?>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nume produs *</label>
                            <input type="text" name="name" class="form-input" required value="<?= escape($editProduct['name'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Categorie</label>
                            <select name="category_id" class="form-select">
                                <option value="">Fără categorie</option>
                                <?php while ($cat = $categories->fetchArray(SQLITE3_ASSOC)): ?>
                                <option value="<?= $cat['id'] ?>" <?= ($editProduct['category_id'] ?? '') == $cat['id'] ? 'selected' : '' ?>>
                                    <?= escape($cat['name']) ?>
                                </option>
                                <?php endwhile; ?>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Descriere</label>
                        <textarea name="description" class="form-textarea"><?= escape($editProduct['description'] ?? '') ?></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Preț *</label>
                            <input type="number" name="price" class="form-input" step="0.01" min="0.01" required value="<?= $editProduct['price'] ?? '' ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Preț comparativ (înainte)</label>
                            <input type="number" name="compare_price" class="form-input" step="0.01" min="0" value="<?= $editProduct['compare_price'] ?? '' ?>">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Stoc</label>
                            <input type="number" name="stock" class="form-input" min="0" value="<?= $editProduct['stock'] ?? '0' ?>">
                        </div>
                        <div class="form-group" style="display:flex;align-items:center;gap:0.5rem;padding-top:1.5rem">
                            <input type="checkbox" name="featured" id="featured" value="1" <?= ($editProduct['featured'] ?? 0) ? 'checked' : '' ?>>
                            <label for="featured" class="form-label" style="margin-bottom:0">Produs featured</label>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Imagine principală (URL)</label>
                            <input type="url" name="image_url" class="form-input" placeholder="https://..." value="<?= escape($editProduct['image_url'] ?? '') ?>">
                            <label class="form-label" style="margin-top:0.5rem;font-size:0.8rem;color:var(--color-text-muted)">Sau încarcă fișier</label>
                            <input type="file" name="image_file" class="form-input" accept="image/jpeg,image/png,image/gif,image/webp" style="padding:0.5rem;font-size:0.85rem">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Imagine secundară (URL)</label>
                            <input type="url" name="image_url_2" class="form-input" placeholder="https://..." value="<?= escape($editProduct['image_url_2'] ?? '') ?>">
                            <label class="form-label" style="margin-top:0.5rem;font-size:0.8rem;color:var(--color-text-muted)">Sau încarcă fișier</label>
                            <input type="file" name="image_file_2" class="form-input" accept="image/jpeg,image/png,image/gif,image/webp" style="padding:0.5rem;font-size:0.85rem">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <?= $editProduct ? 'Salvează modificările' : 'Adaugă produsul' ?>
                    </button>
                    <?php if ($editProduct): ?>
                    <a href="/admin/products.php" class="btn btn-secondary" style="margin-left:0.5rem">Anulează</a>
                    <?php endif; ?>
                </form>
            </div>
            
            <?php if ($editProduct): ?>
            <!-- Color Variant Images -->
            <div id="colorImages" class="table-container" style="margin-bottom:2rem">
                <div class="table-header">
                    <h3>🌈 Imagini pentru culori</h3>
                    <span style="font-size:0.85rem;color:var(--color-text-muted)"><?= count($variantImages) ?> culori</span>
                </div>
                
                <?php if (count($variantImages) > 0): ?>
                <div style="padding:1.5rem;display:flex;flex-wrap:wrap;gap:1rem">
                    <?php foreach ($variantImages as $vi): ?>
                    <div style="position:relative;width:160px;border:1px solid var(--color-border);border-radius:var(--radius-md);overflow:hidden;background:var(--color-bg-alt)">
                        <div style="aspect-ratio:3/4;overflow:hidden;background:var(--color-bg-alt)">
                            <?php
                            // Safe fallback: avoid innerHTML injection in error handlers.
                            renderImageWithFallback($vi['image_url'] ?? '', $vi['color_name'] ?? '', 'Fără imagine', ['width:100%','height:100%','object-fit:cover']);
                            ?>
                        </div>
                        <div style="padding:0.75rem;display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:0.85rem;font-weight:600"><?= escape($vi['color_name']) ?></span>
                            <form method="POST" action="/admin/products.php" style="display:inline" onsubmit="return confirm('Ștergi imaginea pentru culoarea „<?= escape($vi['color_name']) ?>”?')">
                                <input type="hidden" name="action" value="delete_color">
                                <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">
                                <input type="hidden" name="delete_color" value="<?= (int)$vi['id'] ?>">
                                <input type="hidden" name="product_id" value="<?= (int)$editProduct['id'] ?>">
                                <button type="submit" style="background:none;border:none;color:var(--color-accent);font-size:0.75rem;cursor:pointer;padding:0">✕</button>
                            </form>

                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php else: ?>
                <div style="padding:1.5rem;text-align:center;color:var(--color-text-muted);font-size:0.9rem">
                    Nu ai adăugat încă imagini pentru culori.
                </div>
                <?php endif; ?>
                
                <div style="padding:1rem 1.5rem;border-top:1px solid var(--color-border);background:var(--color-bg-alt)">
                    <form method="POST" enctype="multipart/form-data" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end">
                        <input type="hidden" name="action" value="add_color">
                        <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">

                        <input type="hidden" name="product_id" value="<?= $editProduct['id'] ?>">
                        <div style="flex:1;min-width:150px">
                            <label style="display:block;font-size:0.8rem;font-weight:600;margin-bottom:0.25rem;color:var(--color-text-light)">Nume culoare</label>
                            <input type="text" name="color_name" class="form-input" placeholder="ex: Negru, Alb, Roșu..." required style="font-size:0.85rem">
                        </div>
                        <div style="flex:2;min-width:200px">
                            <label style="display:block;font-size:0.8rem;font-weight:600;margin-bottom:0.25rem;color:var(--color-text-light)">URL imagine</label>
                            <input type="url" name="image_url" class="form-input" placeholder="https://..." style="font-size:0.85rem">
                            <label style="display:block;font-size:0.75rem;color:var(--color-text-muted);margin-top:0.25rem">Sau încarcă fișier</label>
                            <input type="file" name="color_image_file" accept="image/jpeg,image/png,image/gif,image/webp" style="font-size:0.85rem;padding:0.25rem 0">
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm" style="white-space:nowrap">+ Adaugă</button>
                    </form>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Products Table -->
            <div class="table-container">
                <div class="table-header">
                    <h3>Toate produsele</h3>
                    <span style="font-size:0.85rem;color:var(--color-text-muted)"><?= $db->querySingle("SELECT COUNT(*) FROM products") ?> produse</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Categorie</th>
                            <th>Preț</th>
                            <th>Stoc</th>
                            <th>Featured</th>
                            <th>Status</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($p = $products->fetchArray(SQLITE3_ASSOC)): ?>
                        <tr>
                            <td style="font-weight:600"><?= escape($p['name']) ?></td>
                            <td><?= escape($p['category_name'] ?? '—') ?></td>
                            <td><?= formatPrice($p['price']) ?></td>
                            <td><?= $p['stock'] ?></td>
                            <td><?= $p['featured'] ? '⭐' : '—' ?></td>
                            <td><span class="badge badge-<?= $p['status'] === 'active' ? 'active' : 'pending' ?>"><?= $p['status'] ?></span></td>
                            <td>
                                <a href="/admin/products.php?edit=<?= $p['id'] ?>" style="color:var(--color-primary);font-size:0.85rem">Editează</a>
                                &nbsp;|&nbsp;
                            <form method="POST" action="/admin/products.php" style="display:inline" onsubmit="return confirm('Ștergi acest produs?')">
                                <input type="hidden" name="action" value="delete_product">
                                <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">
                                <input type="hidden" name="id" value="<?= (int)$p['id'] ?>">
                                <button type="submit" style="background:none;border:none;color:var(--color-accent);font-size:0.85rem;cursor:pointer;padding:0">Șterge</button>
                            </form>

                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
