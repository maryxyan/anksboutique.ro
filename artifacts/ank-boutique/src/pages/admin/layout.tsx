import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, Archive, Tag, LogOut, Menu, X } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Panou de Control", icon: LayoutDashboard },
  { href: "/admin/products", label: "Produse", icon: Package },
  { href: "/admin/orders", label: "Comenzi", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categorii", icon: Tag },
  { href: "/admin/inventory", label: "Inventar", icon: Archive },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsAuth(localStorage.getItem("adminAuthenticated") === "true");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") {
      localStorage.setItem("adminAuthenticated", "true");
      setIsAuth(true);
      setError("");
    } else {
      setError("Parolă incorectă.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setIsAuth(false);
    navigate("/");
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="bg-background border border-border p-10 w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif">Ank's Boutique</h1>
            <p className="text-muted-foreground text-sm mt-1">Acces Admin</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                placeholder="Introduceți parola admin"
                autoFocus
              />
              {error && <p className="text-xs text-destructive mt-1">{error}</p>}
            </div>
            <button
              type="submit"
              className="w-full h-11 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
            >
              Autentificare
            </button>
          </form>
          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Înapoi la Magazin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-60 bg-background border-r border-border z-50 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        <div className="h-16 flex items-center px-6 border-b border-border">
          <span className="font-serif text-lg">Ank's Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-sm ${
                location === href ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Înapoi la Magazin
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Deconectare
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-background border-b border-border flex items-center px-6 gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2">
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
