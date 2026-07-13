import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";
import { UserPlus, Mail, Lock, User as UserIcon, ArrowRight } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Completează toate câmpurile.");
      return;
    }

    if (password.length < 6) {
      setError("Parola trebuie să aibă cel puțin 6 caractere.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    // Check if email already exists
    const users = JSON.parse(localStorage.getItem("client_users") || "[]");
    if (users.some((u: any) => u.email === email.trim())) {
      setError("Acest email este deja înregistrat.");
      return;
    }

    // Save user
    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      password: password,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("client_users", JSON.stringify(users));
    localStorage.setItem("clientAuthenticated", "true");
    localStorage.setItem("client_user", JSON.stringify(newUser));

    navigate("/account");
  };

  return (
    <><Helmet><title>Inregistrare | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <UserPlus className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1} />
          <h1 className="text-2xl font-serif">Înregistrare</h1>
          <p className="text-muted-foreground text-sm mt-2">Creează-ți contul nou</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Nume</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="Numele tău"
              />
            </div>
          </div>

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
                placeholder="cel puțin 6 caractere"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Confirmă Parola</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="repetă parola"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <button
            type="submit"
            className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors flex items-center justify-center gap-2"
          >
            Creează Cont <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Ai deja cont?{" "}
            <Link href="/login" className="text-foreground border-b border-foreground pb-0.5 font-medium">
              Autentifică-te
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
