<?php
$pageTitle = 'Admin - Comenzi';
require_once __DIR__ . '/../includes/header.php';
requireAdmin();

$db = getDB();
$message = getFlash('success');
$statusFilter = $_GET['status'] ?? '';

// Handle status update
if (isset($_GET['update_status']) && isset($_GET['id'])) {
    $newStatus = $_GET['update_status'];
    $orderId = (int)$_GET['id'];
    $allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    
    if (in_array($newStatus, $allowedStatuses)) {
        $stmt = $db->prepare("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
        $stmt->bindValue(1, $newStatus, SQLITE3_TEXT);
        $stmt->bindValue(2, $orderId, SQLITE3_INTEGER);
        $stmt->execute();
        setFlash('Statusul comenzii a fost actualizat.', 'success');
    }
    redirect('/admin/orders.php');
}

// Build query
$where = '';
if ($statusFilter) {
    $where = "WHERE o.status = :status";
}

$orders = $db->prepare("
    SELECT o.* FROM orders o $where 
    ORDER BY o.created_at DESC 
    LIMIT 50
");
if ($statusFilter) {
    $orders->bindValue(':status', $statusFilter, SQLITE3_TEXT);
}
$result = $orders->execute();
?>

<div class="admin-layout">
    <aside class="admin-sidebar">
        <div class="logo">Anks<span>Boutique</span></div>
        <ul class="admin-nav">
            <li><a href="/admin/"><span class="icon">📊</span>Dashboard</a></li>
            <li><a href="/admin/products.php"><span class="icon">📦</span>Produse</a></li>
            <li><a href="/admin/orders.php" class="active"><span class="icon">📋</span>Comenzi</a></li>
            <li><a href="/admin/users.php"><span class="icon">👥</span>Utilizatori</a></li>
            <li><a href="/"><span class="icon">←</span>Înapoi la site</a></li>
        </ul>
    </aside>
    
    <div class="admin-main">
        <div class="admin-header">
            <h2>Comenzi</h2>
        </div>
        
        <div class="admin-content">
            <?php if ($message): ?>
            <div class="alert alert-success"><?= escape($message) ?></div>
            <?php endif; ?>
            
            <!-- Status Filter -->
            <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;flex-wrap:wrap">
                <a href="/admin/orders.php" class="btn btn-sm <?= !$statusFilter ? 'btn-primary' : 'btn-secondary' ?>">Toate</a>
                <a href="/admin/orders.php?status=pending" class="btn btn-sm <?= $statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary' ?>">În procesare</a>
                <a href="/admin/orders.php?status=confirmed" class="btn btn-sm <?= $statusFilter === 'confirmed' ? 'btn-primary' : 'btn-secondary' ?>">Confirmate</a>
                <a href="/admin/orders.php?status=shipped" class="btn btn-sm <?= $statusFilter === 'shipped' ? 'btn-primary' : 'btn-secondary' ?>">Expediate</a>
                <a href="/admin/orders.php?status=delivered" class="btn btn-sm <?= $statusFilter === 'delivered' ? 'btn-primary' : 'btn-secondary' ?>">Livrate</a>
                <a href="/admin/orders.php?status=cancelled" class="btn btn-sm <?= $statusFilter === 'cancelled' ? 'btn-primary' : 'btn-secondary' ?>">Anulate</a>
            </div>
            
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Comandă</th>
                            <th>Client</th>
                            <th>Email</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Dată</th>
                            <th>Acțiuni</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php 
                        $hasOrders = false;
                        while ($o = $result->fetchArray(SQLITE3_ASSOC)): 
                            $hasOrders = true;
                        ?>
                        <tr>
                            <td style="font-weight:600"><?= escape($o['order_number']) ?></td>
                            <td><?= escape($o['first_name']) ?> <?= escape($o['last_name']) ?></td>
                            <td><?= escape($o['email']) ?></td>
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
                            <td><?= date('d.m.Y H:i', strtotime($o['created_at'])) ?></td>
                            <td>
                                <select onchange="if(this.value) window.location.href=this.value" class="form-select" style="width:auto;padding:0.3rem 0.5rem;font-size:0.8rem">
                                    <option value="">Schimbă status</option>
                                    <option value="/admin/orders.php?update_status=pending&id=<?= $o['id'] ?>">În procesare</option>
                                    <option value="/admin/orders.php?update_status=confirmed&id=<?= $o['id'] ?>">Confirmată</option>
                                    <option value="/admin/orders.php?update_status=shipped&id=<?= $o['id'] ?>">Expediată</option>
                                    <option value="/admin/orders.php?update_status=delivered&id=<?= $o['id'] ?>">Livrată</option>
                                    <option value="/admin/orders.php?update_status=cancelled&id=<?= $o['id'] ?>">Anulată</option>
                                </select>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                        <?php if (!$hasOrders): ?>
                        <tr>
                            <td colspan="7" style="text-align:center;color:var(--color-text-muted);padding:2rem">
                                Nu există comenzi.
                            </td>
                        </tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
