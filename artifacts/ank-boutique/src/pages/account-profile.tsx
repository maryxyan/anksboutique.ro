import { useState } from "react";
import { User, Phone, Calendar, Lock, ShieldCheck, Trash2, Eye, EyeOff, Mail } from "lucide-react";
import type { ClientUser } from "./account-types";

export default function ProfileTab({ user, setUser }: { user: ClientUser; setUser: (u: ClientUser) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [birthDate, setBirthDate] = useState(user.birthDate || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.twoFactorEnabled || false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  const allUsers = JSON.parse(localStorage.getItem("client_users") || "[]");

  const saveProfile = () => {
    setSaving(true); setSaved(false);
    const updatedUsers = allUsers.map((u: ClientUser) =>
      u.id === user.id ? { ...u, name: name.trim(), phone, birthDate } : u
    );
    localStorage.setItem("client_users", JSON.stringify(updatedUsers));
    const updated = { ...user, name: name.trim(), phone, birthDate };
    localStorage.setItem("client_user", JSON.stringify(updated));
    setUser(updated);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const changePassword = () => {
    setPasswordError(""); setPasswordSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError("Completeaza toate campurile."); return; }
    if (currentPassword !== user.password) { setPasswordError("Parola actuala este incorecta."); return; }
    if (newPassword.length < 6) { setPasswordError("Parola noua trebuie sa aiba cel putin 6 caractere."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Parolele noi nu coincid."); return; }
    const updatedUsers = allUsers.map((u: ClientUser) => u.id === user.id ? { ...u, password: newPassword } : u);
    localStorage.setItem("client_users", JSON.stringify(updatedUsers));
    const updated = { ...user, password: newPassword };
    localStorage.setItem("client_user", JSON.stringify(updated)); setUser(updated);
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPasswordSuccess(true); setTimeout(() => setPasswordSuccess(false), 3000);
  };

  const toggle2FA = () => {
    const newVal = !twoFactorEnabled; setTwoFactorEnabled(newVal);
    const updatedUsers = allUsers.map((u: ClientUser) => u.id === user.id ? { ...u, twoFactorEnabled: newVal } : u);
    localStorage.setItem("client_users", JSON.stringify(updatedUsers));
    const updated = { ...user, twoFactorEnabled: newVal };
    localStorage.setItem("client_user", JSON.stringify(updated)); setUser(updated);
  };

  const deleteAccount = () => {
    if (deleteEmail !== user.email) return;
    setDeleting(true);
    fetch("/api/account/delete?email=" + encodeURIComponent(user.email), { method: "DELETE" }).catch(() => {});
    const updatedUsers = allUsers.filter((u: ClientUser) => u.id !== user.id);
    localStorage.setItem("client_users", JSON.stringify(updatedUsers));
    localStorage.removeItem("clientAuthenticated");
    localStorage.removeItem("client_user");
    window.location.href = "/";
  };

  return (
    <div className="space-y-8">
      {/* Personal Data */}
      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Date Personale</h2>
        <div className="border border-border divide-y divide-border/40">
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Nume complet</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" />
          </div>
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2"><Mail className="w-3 h-3" /> Email</label>
            <p className="text-sm py-2 text-muted-foreground">{user.email}</p>
          </div>
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2"><Phone className="w-3 h-3" /> Telefon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" placeholder="07XX XXX XXX" />
          </div>
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2"><Calendar className="w-3 h-3" /> Data nasterii</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={saveProfile} disabled={saving}
            className="h-10 px-5 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors">
            {saving ? "Se salveaza..." : "Salveaza"}
          </button>
          {saved && <span className="text-xs text-green-600 font-medium">Modificarile au fost salvate</span>}
        </div>
      </section>

      {/* Password */}
      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> Resetare Parola</h2>
        <div className="border border-border divide-y divide-border/40">
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Parola actuala</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors" />
          </div>
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Parola noua</label>
            <div className="relative">
              <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors pr-10" />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="p-4 md:p-5">
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Confirma parola noua</label>
            <div className="relative">
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
        {passwordError && <p className="text-xs text-destructive mt-2">{passwordError}</p>}
        {passwordSuccess && <p className="text-xs text-green-600 mt-2">Parola a fost schimbata cu succes!</p>}
        <button onClick={changePassword}
          className="mt-4 h-10 px-5 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors">
          Schimba Parola
        </button>
      </section>

      {/* 2FA */}
      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Securitate</h2>
        <div className="border border-border p-4 md:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Autentificare in doi pasi (2FA)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Protejeaza-ti contul cu un al doilea factor de autentificare</p>
            </div>
            <button onClick={toggle2FA}
              className={"relative w-12 h-6 rounded-full transition-colors " + (twoFactorEnabled ? "bg-foreground" : "bg-muted border border-border")}>
              <span className={"absolute top-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform " + (twoFactorEnabled ? "translate-x-6" : "translate-x-0.5")} />
            </button>
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-3 bg-muted/40 text-xs text-muted-foreground">
              Autentificarea in doi pasi este activata. La urmatoarea autentificare vei primi un cod de verificare.
            </div>
          )}
        </div>
      </section>

      {/* GDPR */}
      <section>
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2 text-destructive"><Trash2 className="w-4 h-4" /> Stergere Cont (GDPR)</h2>
        <div className="border border-destructive/30 p-4 md:p-5">
          {!deleteConfirm ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Conform GDPR (UE 2016/679), ai dreptul de a solicita stergerea tuturor datelor personale.
                Aceasta actiune este <strong>ireversibila</strong>.
              </p>
              <button onClick={() => setDeleteConfirm(true)}
                className="h-10 px-5 bg-destructive text-white text-xs uppercase tracking-widest font-medium hover:bg-destructive/80 transition-colors">
                Sterge Contul
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-destructive font-medium mb-3">⚠️ Esti sigur ca vrei sa-ti stergi contul?</p>
              <p className="text-xs text-muted-foreground mb-3">Tasteaza <strong>{user.email}</strong> pentru a confirma:</p>
              <input type="email" value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)}
                placeholder={user.email}
                className="w-full border border-destructive bg-background px-3 py-2 text-sm focus:border-destructive outline-none transition-colors mb-3" />
              <div className="flex gap-3">
                <button onClick={deleteAccount} disabled={deleteEmail !== user.email || deleting}
                  className="h-10 px-5 bg-destructive text-white text-xs uppercase tracking-widest font-medium hover:bg-destructive/80 disabled:opacity-40 transition-colors">
                  {deleting ? "Se sterge..." : "Confirm Stergerea"}
                </button>
                <button onClick={() => { setDeleteConfirm(false); setDeleteEmail(""); }}
                  className="h-10 px-5 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors">Anuleaza</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
