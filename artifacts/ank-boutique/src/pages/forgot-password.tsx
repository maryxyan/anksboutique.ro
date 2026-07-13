import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Introdu adresa de email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Eroare la trimiterea emailului");
      }

      setSent(true);
    } catch (e: any) {
      setError(e.message || "Eroare de retea. Incearca din nou.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <><Helmet><title>Resetare Parola | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-6" strokeWidth={1.5} />
          <h1 className="text-2xl font-serif mb-3">Email Trimis</h1>
          <p className="text-muted-foreground text-sm mb-2">
            Am trimis un email de resetare a parolei la:
          </p>
          <p className="text-sm font-medium mb-6">{email}</p>
          <p className="text-xs text-muted-foreground mb-8">
            Verifica inbox-ul si urmeaza instructiunile din email pentru a-ti reseta parola.
            Daca nu primesti emailul in cateva minute, verifica si folderul Spam.
          </p>
          <Link href="/login"
            className="inline-flex items-center gap-2 h-11 px-6 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Inapoi la Autentificare
          </Link>
        </div>
      </div></>
    );
  }

  return (
    <><Helmet><title>Resetare Parola | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Mail className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-serif">Resetare Parola</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Introdu adresa de email asociata contului tau si iti vom trimite un link de resetare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="nume@exemplu.ro"
                autoFocus
              />
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
            disabled={loading}
            className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? "Se trimite..." : "Trimite Link de Resetare"}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Inapoi la Autentificare
          </Link>
          <div>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Inapoi la Magazin
            </Link>
          </div>
        </div>
      </div>
    </div></>
  );
}
