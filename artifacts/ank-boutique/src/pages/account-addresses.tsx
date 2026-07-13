import { useState } from "react";
import { MapPin, Plus, Pencil, X, Check, Trash2 } from "lucide-react";
import type { ClientUser, SavedAddress } from "./account-types";

export default function AddressesTab({ user }: { user: ClientUser }) {
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => {
    try { return JSON.parse(localStorage.getItem("saved_addresses") || "[]"); }
    catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ label: "", fullName: "", phone: "", address: "", city: "", county: "", postalCode: "", isDefault: false, isBilling: false });

  const saveAddresses = (updated: SavedAddress[]) => {
    setAddresses(updated);
    localStorage.setItem("saved_addresses", JSON.stringify(updated));
  };

  const resetForm = () => {
    setForm({ label: "", fullName: "", phone: "", address: "", city: "", county: "", postalCode: "", isDefault: false, isBilling: false });
    setShowForm(false); setEditId(null);
  };

  const openNew = () => {
    resetForm();
    setForm({ ...form, fullName: user.name });
    setShowForm(true);
  };

  const openEdit = (addr: SavedAddress) => {
    setForm(addr); setEditId(addr.id); setShowForm(true);
  };

  const handleSave = () => {
    if (!form.label || !form.fullName || !form.address || !form.city) return;

    if (editId) {
      const updated = addresses.map((a) => a.id === editId ? { ...form, id: editId } : a);
      saveAddresses(updated);
    } else {
      const newAddr = { ...form, id: "addr_" + Date.now() };
      const updated = form.isDefault
        ? [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
        : [...addresses, newAddr];
      saveAddresses(updated);
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    saveAddresses(addresses.filter((a) => a.id !== id));
  };

  const setAsDefault = (id: string) => {
    saveAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const f = (field: keyof typeof form, label: string) => (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</label>
      <input type="text" value={form[field] as string} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
        className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" />
    </div>
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Adresele Mele</h2>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Adauga Adresa
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-border p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {f("label", "Eticheta (ex: Acasa, Birou)")}
            {f("fullName", "Numele destinatarului")}
            {f("phone", "Telefon")}
            {f("city", "Oras")}
            {f("county", "Judet")}
            {f("postalCode", "Cod postal")}
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">Adresa</label>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" placeholder="Strada, numar, bloc, apartament" />
            </div>
            <div className="flex items-center gap-6 sm:col-span-2 pt-1">
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Adresa implicita de livrare
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.isBilling} onChange={(e) => setForm({ ...form, isBilling: e.target.checked })} />
                Adresa de facturare
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave}
              className="h-9 px-4 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Salveaza
            </button>
            <button onClick={resetForm}
              className="h-9 px-4 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Anuleaza
            </button>
          </div>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 border border-border">
          <MapPin className="w-10 h-10 mx-auto text-border mb-4" strokeWidth={1} />
          <p className="text-muted-foreground text-sm">Nu ai adrese salvate. Adauga o adresa de livrare.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className={"border p-4 relative " + (addr.isDefault ? "border-foreground" : "border-border")}>
              {addr.isDefault && (
                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-widest bg-foreground text-background px-2 py-0.5">Implicita</span>
              )}
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium">{addr.label}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(addr)} className="p-1 hover:bg-muted rounded transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(addr.id)} className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-sm">{addr.fullName}</p>
              <p className="text-xs text-muted-foreground">{addr.phone}</p>
              <p className="text-xs text-muted-foreground mt-1">{addr.address}, {addr.city}, {addr.county}{addr.postalCode ? ", " + addr.postalCode : ""}</p>
              {!addr.isDefault && (
                <button onClick={() => setAsDefault(addr.id)}
                  className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border-b border-dotted pb-0.5">
                  Seteaza ca implicita
                </button>
              )}
              {addr.isBilling && <p className="text-[10px] text-muted-foreground mt-1 italic">Si adresa de facturare</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
