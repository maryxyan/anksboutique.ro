import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Parse token and email from URL query params
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") || "";
    const e = params.get("email") || "";
    if (!t || !e) {
      setError("Link invalid sau expirat. Solicita un nou link de resetare.");
    }
    setToken(t);
    setEmail(e);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newPassword || !confirmPassword) {
      setError("Completeaza toate campurile.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Parola trebuie sa aiba cel putin 6 caractere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la resetarea parolei");
      }

      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (e: any) {
      setError(e.message || "Eroare de retea.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <><Helmet><title>Resetare Parola | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-serif mb-3">Parola Resetata</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Parola ta a fost schimbata cu succes. Vei fi redirectionat catre pagina de autentificare.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 h-11 px-6 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Mergi la Autentificare
          </Link>
        </div>
      </div></>
    );
  }

  return (
    <><Helmet><title>Resetare Parola | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-serif">Reseteaza Parola</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Alege o parola noua pentru contul tau.
          </p>
          {email && (
            <p className="text-xs text-muted-foreground mt-1">
              Pentru: <span className="font-medium">{email}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Parola Noua</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-10 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="cel putin 6 caractere"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Confirma Parola</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-10 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="repetă parola"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token || !email}
            className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors"
          >
            {loading ? "Se reseteaza..." : "Reseteaza Parola"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3 h-3 inline" /> Inapoi la Autentificare
          </Link>
        </div>
      </div>
    </div></>
  );
}
