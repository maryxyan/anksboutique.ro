<?php
$pageTitle = 'Admin - Utilizatori';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/admin-utils.php';
requireAdmin();

$db = getDB();
$users = $db->query("SELECT id, email, first_name, last_name, phone, is_admin, created_at FROM users ORDER BY created_at DESC");
?>


<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="logo">Anks<span>Boutique</span></div>
        <ul class="admin-nav">
            <li><a href="/admin/"><span class="icon">📊</span>Dashboard</a></li>
            <li><a href="/admin/products.php"><span class="icon">📦</span>Produse</a></li>
            <li><a href="/admin/orders.php"><span class="icon">📋</span>Comenzi</a></li>
            <li><a href="/admin/users.php" class="active"><span class="icon">👥</span>Utilizatori</a></li>
            <li><a href="/"><span class="icon">←</span>Înapoi la site</a></li>
        </ul>
    </aside>
    
    <div class="admin-main">
        <div class="admin-header">
            <h2>Utilizatori</h2>
        </div>
        
        <div class="admin-content">
            <div class="table-container">
                <div class="table-header">
                    <h3>Toți utilizatorii</h3>
                    <span style="font-size:0.85rem;color:var(--color-text-muted)"><?= $db->querySingle("SELECT COUNT(*) FROM users") ?> utilizatori</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nume</th>
                            <th>Email</th>
                            <th>Telefon</th>
                            <th>Admin</th>
                            <th>Înregistrat</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($u = $users->fetchArray(SQLITE3_ASSOC)): ?>
                        <tr>
                            <td><?= $u['id'] ?></td>
                            <td style="font-weight:600"><?= escape($u['first_name']) ?> <?= escape($u['last_name']) ?></td>
                            <td><?= escape($u['email']) ?></td>
                            <td><?= escape($u['phone'] ?? '—') ?></td>
                            <td><?= $u['is_admin'] ? '✅' : '—' ?></td>
                            <td><?= date('d.m.Y', strtotime($u['created_at'])) ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
