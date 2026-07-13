<?php
$pageTitle = 'Admin - Dashboard';
require_once __DIR__ . '/../includes/header.php';
requireAdmin();

$db = getDB();

// Get stats
$totalProducts = $db->querySingle("SELECT COUNT(*) FROM products");
$totalOrders = $db->querySingle("SELECT COUNT(*) FROM orders");
$totalRevenue = $db->querySingle("SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled'");
$totalUsers = $db->querySingle("SELECT COUNT(*) FROM users");
$pendingOrders = $db->querySingle("SELECT COUNT(*) FROM orders WHERE status = 'pending'");

// Recent orders
$recentOrders = $db->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5");
?>

<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="logo">Anks<span>Boutique</span></div>
        <ul class="admin-nav">
            <li><a href="/admin/" class="active"><span class="icon">📊</span>Dashboard</a></li>
            <li><a href="/admin/products.php"><span class="icon">📦</span>Produse</a></li>
            <li><a href="/admin/orders.php"><span class="icon">📋</span>Comenzi</a></li>
            <li><a href="/admin/users.php"><span class="icon">👥</span>Utilizatori</a></li>
            <li><a href="/"><span class="icon">←</span>Înapoi la site</a></li>
        </ul>
    </aside>
    
    <div class="admin-main">
        <div class="admin-header">
            <h2>Dashboard</h2>
            <div style="font-size:0.9rem;color:var(--color-text-light)">
                <?= date('d.m.Y H:i') ?> &nbsp;|&nbsp; 
                <a href="/logout.php" style="color:var(--color-accent)">Deconectare</a>
            </div>
        </div>
        
        <div class="admin-content">
            <!-- Stats -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2rem">
                <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.5rem">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem">Total Produse</p>
                    <p style="font-size:2rem;font-weight:700"><?= $totalProducts ?></p>
                </div>
                <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.5rem">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem">Total Comenzi</p>
                    <p style="font-size:2rem;font-weight:700"><?= $totalOrders ?></p>
                </div>
                <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.5rem">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem">Venit Total</p>
                    <p style="font-size:2rem;font-weight:700"><?= formatPrice($totalRevenue) ?></p>
                </div>
                <div style="background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);padding:1.5rem">
                    <p style="font-size:0.8rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.5rem">Utilizatori</p>
                    <p style="font-size:2rem;font-weight:700"><?= $totalUsers ?></p>
                </div>
            </div>
            
            <!-- Pending orders alert -->
            <?php if ($pendingOrders > 0): ?>
            <div class="alert alert-warning" style="margin-bottom:2rem">
                Ai <?= $pendingOrders ?> comandă(zi) în așteptare. 
                <a href="/admin/orders.php?status=pending" style="text-decoration:underline;font-weight:600">Vezi comenzile</a>
            </div>
            <?php endif; ?>
            
            <!-- Recent Orders -->
            <div class="table-container">
                <div class="table-header">
                    <h3>Comenzi recente</h3>
                    <a href="/admin/orders.php" class="btn btn-sm btn-secondary">Vezi toate</a>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Comandă</th>
                            <th>Client</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Dată</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($o = $recentOrders->fetchArray(SQLITE3_ASSOC)): ?>
                        <tr>
                            <td style="font-weight:600"><?= escape($o['order_number']) ?></td>
                            <td><?= escape($o['first_name']) ?> <?= escape($o['last_name']) ?></td>
                            <td><?= formatPrice($o['total']) ?></td>
                            <td>
                                <span class="badge badge-<?= $o['status'] ?>">
                                    <?= match($o['status']) {
                                        'pending' => 'În procesare',
                                        'confirmed' => 'Confirmată',
                                        'shipped' => 'Expediată',
                                        'delivered' => 'Livrată',
                                        'cancelled' => 'Anulată',
                                        default => $o['status']
                                    } ?>
                                </span>
                            </td>
                            <td><?= date('d.m.Y', strtotime($o['created_at'])) ?></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
