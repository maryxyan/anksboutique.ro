import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { AdminLayout } from "./layout";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Label {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  status: string;
  createdAt?: string;
}

export default function AdminLabels() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);

  // Form state for new/edit
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load labels from API
  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      setIsLoading(true);
      setApiError("");
      const res = await fetch("/api/labels");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
      }
      const data = await res.json();
      setLabels(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Failed to fetch labels:", e);
      setApiError(`Nu am putut încărca etichetele: ${e.message}`);
      setLabels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormSortOrder(0);
    setFormError("");
    setShowNew(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError("Numele și slug-ul sunt obligatorii");
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          sortOrder: formSortOrder,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la crearea etichetei");
      }
      await fetchLabels();
      resetForm();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError("Numele și slug-ul sunt obligatorii");
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/labels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          sortOrder: formSortOrder,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la actualizare");
      }
      await fetchLabels();
      resetForm();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Eroare la ștergere");
      }
      await fetchLabels();
      setDeleteConfirm(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startEdit = (label: Label) => {
    setEditingId(label.id);
    setFormName(label.name);
    setFormSlug(label.slug);
    setFormDescription(label.description || "");
    setFormSortOrder(label.sortOrder || 0);
    setShowNew(false);
    setFormError("");
  };

  const startNew = () => {
    setShowNew(true);
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormSortOrder(0);
    setFormError("");
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif">Etichete</h1>
          <p className="text-muted-foreground text-sm mt-1">{labels?.length ?? 0} etichete total</p>
        </div>
        <button
          onClick={startNew}
          disabled={isLoading || apiError !== ""}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Adaugă Etichetă
        </button>
      </div>

      {/* API Error */}
      {apiError && (
        <div className="border border-destructive/50 bg-destructive/10 text-destructive p-4 mb-6 rounded">
          <p className="text-sm">{apiError}</p>
          <button
            onClick={fetchLabels}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Încearcă din nou
          </button>
        </div>
      )}

      {/* New Label Form */}
      {showNew && (
        <div className="border border-border bg-background p-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Etichetă Nouă</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Nume</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setFormSlug(slugify(e.target.value));
                }}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="ex. Premium"
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="premium"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Ordine</label>
              <input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Descriere (opțional)</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
              placeholder="Descrierea etichetei..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          {formError && <div className="text-destructive text-sm mb-4">{formError}</div>}
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Salvează
            </button>
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 text-sm uppercase tracking-widest font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Edit Label Form */}
      {editingId && !showNew && (
        <div className="border border-border bg-background p-6 mb-6">
          <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Editează Etichetă</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Nume</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="ex. Premium"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Slug</label>
              <input
                type="text"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="premium"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Ordine</label>
              <input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="0"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Descriere (opțional)</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
              placeholder="Descrierea etichetei..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          {formError && <div className="text-destructive text-sm mb-4">{formError}</div>}
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdate(editingId)}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Salvează
            </button>
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-muted text-foreground px-4 py-2 text-sm uppercase tracking-widest font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Anulează
            </button>
          </div>
        </div>
      )}

      {/* Labels Table */}
      {!isLoading && labels.length > 0 && (
        <div className="border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-widest font-medium text-muted-foreground">Nume</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-widest font-medium text-muted-foreground">Slug</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-widest font-medium text-muted-foreground">Ordine</th>
                  <th className="px-6 py-3 text-left text-xs uppercase tracking-widest font-medium text-muted-foreground">Descriere</th>
                  <th className="px-6 py-3 text-right text-xs uppercase tracking-widest font-medium text-muted-foreground">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {labels.map((label) => (
                  <tr key={label.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                    <td className="px-6 py-3">{label.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">{label.slug}</td>
                    <td className="px-6 py-3">{label.sortOrder}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{label.description || "—"}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button
                          onClick={() => startEdit(label)}
                          className="text-foreground hover:text-foreground/70 transition-colors p-2"
                          title="Editează"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(label.id)}
                          className="text-destructive hover:text-destructive/70 transition-colors p-2"
                          title="Șterge"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {deleteConfirm === label.id && (
                          <div className="absolute right-0 top-full mt-2 bg-background border border-border shadow-lg p-3 rounded z-10 w-max">
                            <p className="text-sm mb-3 whitespace-nowrap">Ești sigur că vrei să ștergi aceasta etichetă?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDelete(label.id)}
                                className="bg-destructive text-background px-3 py-1 text-xs uppercase tracking-widest font-medium hover:bg-destructive/80"
                              >
                                Șterge
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-muted text-foreground px-3 py-1 text-xs uppercase tracking-widest font-medium hover:bg-muted/80"
                              >
                                Anulează
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && labels.length === 0 && !showNew && (
        <div className="border border-border p-8 text-center">
          <p className="text-muted-foreground mb-4">Nu sunt etichete încă</p>
          <button
            onClick={startNew}
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adaugă prima etichetă
          </button>
        </div>
      )}

      {isLoading && !apiError && (
        <div className="border border-border p-8 text-center">
          <p className="text-muted-foreground">Se încarcă...</p>
        </div>
      )}
    </AdminLayout>
  );
}
