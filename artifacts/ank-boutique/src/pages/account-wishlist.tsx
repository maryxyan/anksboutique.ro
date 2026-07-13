import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Heart, ShoppingBag, Bell, BellOff, Eye, Trash2 } from "lucide-react";
import type { ClientUser } from "./account-types";

// Define locally since it's only used here
interface WishlistItem {
  id: number;
  productId: number;
  productTitle: string;
  productImage: string;
  productPrice: number;
  productStock: number;
  alertOnRestock: boolean;
  alertOnPriceDrop: boolean;
}

export default function WishlistTab({ user }: { user: ClientUser }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage wishlist alerts
    const stored = localStorage.getItem("wishlist_alerts");
    const alerts = stored ? JSON.parse(stored) : {};
    
    // Try to fetch real wishlist
    const fetchWishlist = async () => {
      try {
        const sessionId = localStorage.getItem("sessionId") || "";
        const res = await fetch("/api/wishlist?sessionId=" + encodeURIComponent(sessionId));
        if (res.ok) {
          const data = await res.json();
          // Map to our format with alerts from localStorage
          const mapped = data.map((item: any) => ({
            id: item.id || item.productId,
            productId: item.productId,
            productTitle: item.productTitle || item.product?.title || "",
            productImage: item.productImage || item.product?.images?.[0] || "",
            productPrice: item.productPrice || parseFloat(item.product?.price || "0"),
            productStock: item.productStock || item.product?.stock || 0,
            alertOnRestock: alerts[item.productId]?.restock || false,
            alertOnPriceDrop: alerts[item.productId]?.priceDrop || false,
          }));
          setItems(mapped);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchWishlist();
  }, []);

  const toggleAlert = (productId: number, type: "restock" | "priceDrop") => {
    setItems((prev) => {
      const updated = prev.map((item) => {
        if (item.productId !== productId) return item;
        if (type === "restock") return { ...item, alertOnRestock: !item.alertOnRestock };
        return { ...item, alertOnPriceDrop: !item.alertOnPriceDrop };
      });
      // Save to localStorage
      const alerts: Record<number, { restock: boolean; priceDrop: boolean }> = {};
      updated.forEach((item) => {
        if (item.alertOnRestock || item.alertOnPriceDrop) {
          alerts[item.productId] = { restock: item.alertOnRestock, priceDrop: item.alertOnPriceDrop };
        }
      });
      localStorage.setItem("wishlist_alerts", JSON.stringify(alerts));
      return updated;
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Se incarca lista de dorinte...</div>;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center gap-2"><Heart className="w-4 h-4" /> Lista de Dorinte</h2>
        <span className="text-xs text-muted-foreground">{items.length} produse</span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border border-border">
          <Heart className="w-10 h-10 mx-auto text-border mb-4" strokeWidth={1} />
          <p className="text-muted-foreground text-sm mb-4">Lista de dorinte este goala.</p>
          <Link href="/shop" className="text-sm border-b border-foreground pb-0.5 uppercase tracking-widest font-medium">
            Descopera produse
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.productId} className="border border-border overflow-hidden group">
              <Link href={"/product/" + item.productId}>
                <div className="aspect-[3/4] bg-muted overflow-hidden">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productTitle} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-border">
                      <Heart className="w-8 h-8" strokeWidth={1} />
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3 space-y-2">
                <Link href={"/product/" + item.productId} className="text-sm font-medium block truncate hover:underline">
                  {item.productTitle}
                </Link>
                <p className="text-sm font-medium">{item.productPrice.toFixed(2)} RON</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <div className="flex gap-1">
                    <button onClick={() => toggleAlert(item.productId, "restock")}
                      title={item.alertOnRestock ? "Alerta stoc activa" : "Primeste alerta la re-aprovizionare"}
                      className={"p-1.5 rounded transition-colors " + (item.alertOnRestock ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}>
                      {item.alertOnRestock ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => toggleAlert(item.productId, "priceDrop")}
                      title={item.alertOnPriceDrop ? "Alerta pret activa" : "Primeste alerta la reducere de pret"}
                      className={"p-1.5 rounded transition-colors " + (item.alertOnPriceDrop ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}>
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.productId)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors" title="Elimina">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex text-[10px] text-muted-foreground gap-2">
                  {item.alertOnRestock && <span className="flex items-center gap-1"><Bell className="w-3 h-3" /> Stoc</span>}
                  {item.alertOnPriceDrop && <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Pret</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
