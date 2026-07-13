import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProducts,
  getListProductsQueryKey,
  useDeleteProduct,
} from "@workspace/api-client-react";
import { AdminLayout } from "./layout";

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const { data, isLoading } = useListProducts(
    { page, limit: 20 },
    { query: { queryKey: getListProductsQueryKey({ page, limit: 20 }) } }
  );

  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: number) => {
    deleteProduct.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setDeleteConfirm(null);
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif">Produse</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.total ?? 0} produse total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă Produs
        </Link>
      </div>

      <div className="border border-border bg-background overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Se încarcă produsele...</div>
        ) : !data?.products?.length ? (
          <div className="p-12 text-center">
            <ImageIcon className="w-10 h-10 mx-auto text-border mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm mb-4">Niciun produs încă.</p>
            <Link href="/admin/products/new" className="text-sm border-b border-foreground pb-0.5 uppercase tracking-widest font-medium">
              Adaugă primul produs
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground w-16">Imagine</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Produs</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden md:table-cell">Categorie</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Preț</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden lg:table-cell">Stoc</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Etichetă</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((product) => (
                <tr key={product.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-14 bg-muted overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.title} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-border" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{product.title}</p>
                    {product.sku && <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{product.categoryName || "—"}</td>
                  <td className="px-4 py-3">{Number(product.price).toFixed(2)} RON</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-medium ${(product.stock ?? 0) <= 5 ? "text-destructive" : "text-green-700"}`}>
                      {product.stock ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {product.badge ? (
                      <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-accent/30 border border-accent">
                        {product.badge}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/products/${product.id}/edit`} className="p-2 hover:bg-muted rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </Link>
                      {deleteConfirm === product.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="px-2 py-1 text-[10px] bg-destructive text-white uppercase tracking-wider"
                          >
                            Confirmă
                          </button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[10px] border border-border uppercase tracking-wider">
                            Anulează
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(product.id)} className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 border border-border disabled:opacity-40 hover:bg-muted transition-colors">
            Anterior
          </button>
          <span className="text-muted-foreground text-xs">Pagina {page}</span>
          <button disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 border border-border disabled:opacity-40 hover:bg-muted transition-colors">
            Următor
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
