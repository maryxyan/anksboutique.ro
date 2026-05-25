import { Link } from "wouter";
import { useListInventory, getListInventoryQueryKey } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { AlertTriangle, Pencil, ImageIcon } from "lucide-react";

export default function AdminInventory() {
  const { data: inventory, isLoading } = useListInventory({
    query: { queryKey: getListInventoryQueryKey() },
  });

  const lowStock = inventory?.filter((i) => i.stock <= 5) ?? [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-serif">Inventory</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {inventory?.length ?? 0} products — {lowStock.length} low stock
        </p>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{lowStock.length} {lowStock.length === 1 ? "product is" : "products are"} running low on stock (5 or fewer units).</span>
        </div>
      )}

      <div className="border border-border bg-background overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading inventory...</div>
        ) : !inventory?.length ? (
          <div className="p-12 text-center text-muted-foreground text-sm">No products found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground w-14">Image</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden lg:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Price</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => {
                const isLow = item.stock <= 5;
                return (
                  <tr key={item.id} className={`border-b border-border/40 ${isLow ? "bg-red-50/50" : "hover:bg-muted/30"} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="w-10 h-12 bg-muted overflow-hidden shrink-0">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-3 h-3 text-border" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{item.title}</p>
                      {item.badge && (
                        <span className="text-[9px] uppercase tracking-wider bg-accent/30 px-1.5 py-0.5 border border-accent">
                          {item.badge}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">
                      {item.sku || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{item.categoryName || "—"}</td>
                    <td className="px-4 py-3">{item.price.toFixed(2)} RON</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium flex items-center gap-1.5 ${isLow ? "text-destructive" : "text-green-700"}`}>
                        {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${item.id}/edit`} className="p-2 hover:bg-muted rounded transition-colors inline-block">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
