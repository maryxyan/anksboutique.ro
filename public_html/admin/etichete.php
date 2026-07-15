<?php
$pageTitle = 'Admin - Etichete';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/admin-utils.php';
requireAdmin();

$db = getDB();
$message = getFlash('success');
$error = getFlash('error');

// Handle delete (POST + CSRF)
if (admin_require_post_action('delete_label')) {
    admin_csrf_or_forbidden();

    $id = admin_post_int('id', 0);
    if ($id > 0) {
        $stmt = $db->prepare("DELETE FROM labels WHERE id = ?");
        $stmt->bindValue(1, $id, SQLITE3_INTEGER);
        $stmt->execute();
    }

    admin_set_flash_and_redirect('/admin/etichete.php', 'Eticheta a fost ștearsă.', 'success');
}

// Handle add/edit form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && !empty($_POST['action'])) {
    $action = (string)$_POST['action'];

    // Only support known actions
    if (!in_array($action, ['edit', 'add'], true)) {
        http_response_code(400);
        exit;
    }

    admin_csrf_or_forbidden();

    $name = trim(admin_post_string('name', ''));
    $description = trim(admin_post_string('description', ''));
    $slug = slugify($name);
    $sort_order = admin_post_int('sort_order', 0);

    if ($name === '') {
        $error = 'Numele etichetei este obligatoriu.';
    } else {
        if ($action === 'edit' && isset($_POST['id'])) {
            $id = admin_post_int('id', 0);
            $stmt = $db->prepare("UPDATE labels SET name=?, slug=?, description=?, sort_order=? WHERE id=?");
            $stmt->bindValue(1, $name, SQLITE3_TEXT);
            $stmt->bindValue(2, $slug, SQLITE3_TEXT);
            $stmt->bindValue(3, $description ?: null, SQLITE3_TEXT);
            $stmt->bindValue(4, $sort_order, SQLITE3_INTEGER);
            $stmt->bindValue(5, $id, SQLITE3_INTEGER);
            $stmt->execute();
        } else {
            $stmt = $db->prepare("INSERT INTO labels (name, slug, description, sort_order, status) VALUES (?, ?, ?, ?, 'active')");
            $stmt->bindValue(1, $name, SQLITE3_TEXT);
            $stmt->bindValue(2, $slug, SQLITE3_TEXT);
            $stmt->bindValue(3, $description ?: null, SQLITE3_TEXT);
            $stmt->bindValue(4, $sort_order, SQLITE3_INTEGER);
            $stmt->execute();
        }

        admin_set_flash_and_redirect('/admin/etichete.php', 'Eticheta salvată cu succes.', 'success');
    }
}

// Get edit label
$editLabel = null;
if (isset($_GET['edit'])) {
    $stmt = $db->prepare("SELECT * FROM labels WHERE id = ?");
    $stmt->bindValue(1, (int)$_GET['edit'], SQLITE3_INTEGER);
    $editLabel = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
}

// Get all labels
$labels = $db->query("SELECT * FROM labels ORDER BY sort_order ASC, created_at DESC");
?>

<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="logo">Anks<span>Boutique</span></div>
        <ul class="admin-nav">
            <li><a href="/admin/"><span class="icon">📊</span>Dashboard</a></li>
            <li><a href="/admin/products.php"><span class="icon">📦</span>Produse</a></li>
            <li><a href="/admin/orders.php"><span class="icon">📋</span>Comenzi</a></li>
            <li><a href="/admin/users.php"><span class="icon">👥</span>Utilizatori</a></li>
            <li><a href="/admin/etichete.php" class="active"><span class="icon">🏷️</span>Etichete</a></li>
            <li><a href="/"><span class="icon">←</span>Înapoi la site</a></li>
        </ul>
    </aside>

    <div class="admin-main">
        <div class="admin-header">
            <h2>Etichete</h2>
            <button onclick="document.getElementById('labelForm').scrollIntoView({behavior:'smooth'})" class="btn btn-primary btn-sm">
                <?= $editLabel ? 'Editează eticheta' : 'Adaugă etichetă' ?>
            </button>
        </div>

        <div class="admin-content">
            <?php if ($message): ?>
            <div class="alert alert-success"><?= escape($message) ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="alert alert-error"><?= escape($error) ?></div>
            <?php endif; ?>

            <div id="labelForm" class="table-container" style="margin-bottom:2rem">
                <div class="table-header">
                    <h3><?= $editLabel ? 'Editează eticheta' : 'Adaugă o etichetă nouă' ?></h3>
                </div>

                <form method="POST" enctype="multipart/form-data" style="padding:1.5rem">
                    <input type="hidden" name="action" value="<?= $editLabel ? 'edit' : 'add' ?>">
                    <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">

                    <?php if ($editLabel): ?>
                    <input type="hidden" name="id" value="<?= (int)$editLabel['id'] ?>">
                    <?php endif; ?>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nume etichetă *</label>
                            <input type="text" name="name" class="form-input" required value="<?= escape($editLabel['name'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Ordine</label>
                            <input type="number" name="sort_order" class="form-input" step="1" min="0" value="<?= (int)($editLabel['sort_order'] ?? 0) ?>">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Descriere</label>
                        <textarea name="description" class="form-textarea"><?= escape($editLabel['description'] ?? '') ?></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">
                        <?= $editLabel ? 'Salvează modificările' : 'Adaugă eticheta' ?>
                    </button>
                    <?php if ($editLabel): ?>
                    <a href="/admin/etichete.php" class="btn btn-secondary" style="margin-left:0.5rem">Anulează</a>
                    <?php endif; ?>
                </form>
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3>Toate etichetele</h3>
                    <span style="font-size:0.85rem;color:var(--color-text-muted)"><?= $db->querySingle('SELECT COUNT(*) FROM labels') ?> etichete</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Nume</th>
                            <th>Descriere</th>
                            <th>Slug</th>
                            <th>Ordine</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($l = $labels->fetchArray(SQLITE3_ASSOC)): ?>
                        <tr>
                            <td style="font-weight:600"><?= escape($l['name']) ?></td>
                            <td><?= escape($l['description'] ?? '—') ?></td>
                            <td><?= escape($l['slug']) ?></td>
                            <td><?= (int)$l['sort_order'] ?></td>
                            <td>
                                <a href="/admin/etichete.php?edit=<?= (int)$l['id'] ?>" style="color:var(--color-primary);font-size:0.85rem">Editează</a>
                                &nbsp;|&nbsp;
                                <form method="POST" action="/admin/etichete.php" style="display:inline" onsubmit="return confirm('Ștergi această etichetă?')">
                                    <input type="hidden" name="action" value="delete_label">
                                    <input type="hidden" name="csrf_token" value="<?= escape(getCsrfToken()) ?>">
                                    <input type="hidden" name="id" value="<?= (int)$l['id'] ?>">
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

