import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Package, ChevronDown, ChevronUp, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import type { ClientUser, Order } from "./account-types";

export default function OrdersTab({ user }: { user: ClientUser }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/account/orders?email=" + encodeURIComponent(user.email));
        if (res.ok) setOrders(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [user.email]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "confirmed": return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case "shipped": return <Truck className="w-4 h-4 text-purple-600" />;
      case "delivered": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "In asteptare", confirmed: "Confirmata", shipped: "Expediata",
      delivered: "Livrata", cancelled: "Anulata",
    };
    return map[status] || status;
  };

  const filteredOrders = orderFilter === "all"
    ? orders : orders.filter((o) => o.status === orderFilter);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Se incarca comenzile...</div>;
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-medium flex items-center gap-2"><Package className="w-4 h-4" /> Comenzile Mele</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {["all","pending","confirmed","shipped","delivered","cancelled"].map((f) => (
              <button key={f} onClick={() => setOrderFilter(f)}
                className={"px-3 py-1.5 text-xs uppercase tracking-wider font-medium whitespace-nowrap border transition-colors " +
                  (orderFilter === f ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                {f === "all" ? "Toate" : statusLabel(f)}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 border border-border">
            <Package className="w-10 h-10 mx-auto text-border mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm mb-4">Nu ai comenzi inca.</p>
            <Link href="/shop" className="text-sm border-b border-foreground pb-0.5 uppercase tracking-widest font-medium">
              Incepe cumparaturile
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border border-border">
                <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon(order.status)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Comanda #{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("ro-RO", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-medium uppercase tracking-wider">{statusLabel(order.status)}</span>
                    <span className="text-sm font-medium">{order.total.toFixed(2)} RON</span>
                    {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {expandedOrder === order.id && (
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-14 h-16 bg-muted shrink-0 overflow-hidden">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productTitle} loading="lazy" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-border text-xs">—</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.productTitle}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} buc × {item.price.toFixed(2)} RON{item.size && " | Marime: " + item.size}
                            </p>
                          </div>
                          <p className="text-sm font-medium shrink-0">{(item.price * item.quantity).toFixed(2)} RON</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground pt-2 border-t border-border/40">
                      <div>
                        <p className="uppercase tracking-widest mb-0.5">Livrare</p>
                        <p>{order.shippingAddress}, {order.city}, {order.county}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-widest mb-0.5">Plata</p>
                        <p>{order.paymentMethod === "card" ? "Card bancar" : order.paymentMethod} — {order.paymentStatus === "paid" ? "Platit" : "Neplatit"}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/40 flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Total comanda</span>
                      <span className="text-lg font-medium">{order.total.toFixed(2)} RON</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>


    </div>
  );
}
