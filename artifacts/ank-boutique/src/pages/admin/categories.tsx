import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";
import {
  useListCategories,
  useCreateCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "./layout";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Form state for new/edit
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formError, setFormError] = useState("");

  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormError("");
    setShowNew(false);
    setEditingId(null);
  };

  const handleCreate = () => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError("Numele și slug-ul sunt obligatorii");
      return;
    }
    setFormError("");

    createCategory.mutate(
      { data: { name: formName.trim(), slug: formSlug.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          resetForm();
        },
        onError: () => {
          setFormError("Eroare la crearea categoriei");
        },
      }
    );
  };

  const handleUpdate = async (id: number) => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError("Numele și slug-ul sunt obligatorii");
      return;
    }
    setFormError("");

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), slug: formSlug.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la actualizare");
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      resetForm();
    } catch (e: any) {
      setFormError(e.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la ștergere");
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setShowNew(false);
    setFormError("");
  };

  const startNew = () => {
    setShowNew(true);
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormError("");
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif">Categorii</h1>
          <p className="text-muted-foreground text-sm mt-1">{categories?.length ?? 0} categorii total</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adaugă Categorie
        </button>
      </div>

      {/* New Category Form */}
      {showNew && (
        <div className="border border-border bg-background p-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Categorie Nouă</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Nume</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingId) setFormSlug(slugify(e.target.value));
                }}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="ex. Accesorii"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm font-mono focus:border-foreground outline-none transition-colors"
                placeholder="ex. accesorii"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleCreate}
                disabled={createCategory.isPending}
                className="h-[42px] flex-1 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors"
              >
                {createCategory.isPending ? "Se creează..." : "Creează"}
              </button>
              <button
                onClick={resetForm}
                className="h-[42px] px-4 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
          {formError && <p className="text-xs text-destructive mt-1">{formError}</p>}
        </div>
      )}

      {/* Categories List */}
      <div className="border border-border bg-background overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Se încarcă categoriile...</div>
        ) : !categories?.length ? (
          <div className="p-12 text-center">
            <Tag className="w-10 h-10 mx-auto text-border mb-4" strokeWidth={1} />
            <p className="text-muted-foreground text-sm mb-4">Nicio categorie încă.</p>
            <button onClick={startNew} className="text-sm border-b border-foreground pb-0.5 uppercase tracking-widest font-medium">
              Adaugă prima categorie
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Nume</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden md:table-cell">Slug</th>
                <th className="text-left px-4 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground hidden sm:table-cell">Produse</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  {editingId === cat.id ? (
                    <>
                      <td className="px-4 py-2" colSpan={4}>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="flex-1 min-w-[200px]">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Nume</label>
                            <input
                              type="text"
                              value={formName}
                              onChange={(e) => setFormName(e.target.value)}
                              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors"
                            />
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Slug</label>
                            <input
                              type="text"
                              value={formSlug}
                              onChange={(e) => setFormSlug(e.target.value)}
                              className="w-full border border-border bg-background px-3 py-2 text-sm font-mono focus:border-foreground outline-none transition-colors"
                            />
                          </div>
                          <div className="flex gap-2 pb-0.5">
                            <button
                              onClick={() => handleUpdate(cat.id)}
                              className="h-9 px-4 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Salvează
                            </button>
                            <button
                              onClick={resetForm}
                              className="h-9 px-4 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Anulează
                            </button>
                          </div>
                          {formError && <p className="text-xs text-destructive w-full">{formError}</p>}
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <p className="font-medium">{cat.name}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{cat.slug}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs font-medium">{cat.productCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => startEdit(cat)}
                            className="p-2 hover:bg-muted rounded transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === cat.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="px-2 py-1 text-[10px] bg-destructive text-white uppercase tracking-wider"
                              >
                                Confirmă
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-[10px] border border-border uppercase tracking-wider"
                              >
                                Anulează
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(cat.id)}
                              className="p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-destructive"
                              disabled={(cat.productCount ?? 0) > 0}
                              title={(cat.productCount ?? 0) > 0 ? "Nu se poate șterge - are produse asociate" : "Șterge categoria"}
                            >
                              <Trash2 className={`w-3.5 h-3.5 ${(cat.productCount ?? 0) > 0 ? "opacity-30" : ""}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
