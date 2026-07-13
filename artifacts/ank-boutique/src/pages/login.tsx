import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { User, Mail, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Completează toate câmpurile.");
      return;
    }

    // Simple client auth simulation
    const storedUser = localStorage.getItem("client_user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.email === email.trim() && user.password === password) {
        localStorage.setItem("clientAuthenticated", "true");
        navigate("/account");
        return;
      }
    }

    // Check if any user registered with this email
    const users = JSON.parse(localStorage.getItem("client_users") || "[]");
    const found = users.find((u: any) => u.email === email.trim() && u.password === password);
    if (found) {
      localStorage.setItem("clientAuthenticated", "true");
      localStorage.setItem("client_user", JSON.stringify(found));
      navigate("/account");
      return;
    }

    setError("Email sau parolă incorectă.");
  };

  return (
    <><Helmet><title>Autentificare | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <User className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-serif">Autentificare</h1>
          <p className="text-muted-foreground text-sm mt-2">Conectează-te la contul tău</p>
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
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Parolă</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="parola ta"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="text-right -mt-3">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-dotted pb-0.5">
              Ai uitat parola?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
          >
            Autentificare <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nu ai cont?{" "}
            <Link href="/register" className="text-foreground border-b border-foreground pb-0.5 font-medium">
              Înregistrează-te
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Înapoi la Magazin
          </Link>
        </div>
      </div>
    </div></>
  );
}
