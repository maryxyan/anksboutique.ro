import { Link, useLocation } from "wouter";
import { ShoppingBag, Heart, Menu, Search, User, X, LogIn, UserPlus } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useCallback } from "react";

export function Navbar() {
  const [location, navigate] = useLocation();
  const sessionId = useSessionId();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  // Check if client is authenticated
  const isClientAuth = typeof window !== "undefined" && localStorage.getItem("clientAuthenticated") === "true";
  const clientUser = typeof window !== "undefined" ? localStorage.getItem("client_user") : null;
  let clientName: string | null = null;
  if (clientUser) {
    try {
      clientName = JSON.parse(clientUser).name ?? null;
    } catch {
      localStorage.removeItem("clientAuthenticated");
      localStorage.removeItem("client_user");
    }
  }

  const openSearch = useCallback(() => {
    setMenuOpen(false);
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) { closeSearch(); return; }
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    closeSearch();
  }, [query, navigate, closeSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") closeSearch();
  };

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    closeSearch();
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  const navLinks = [
    { href: "/shop", label: "Magazin" },
    { href: "/shop?category=new", label: "Noutăți" },
    { href: "/shop?category=dresses", label: "Rochii" },
    { href: "/shop?category=blouses", label: "Bluze" },
    { href: "/shop?category=outerwear", label: "Jachete" },
    { href: "/shop?category=accessories", label: "Accesorii" },
    { href: "/shop?category=bags", label: "Genți" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container relative mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left — mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            className="p-2 -ml-2"
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
            onClick={() => { setMenuOpen((o) => !o); closeSearch(); }}
          >
            {menuOpen ? (
                <span className="block animate-in fade-in zoom-in duration-150">
                  <X className="w-5 h-5" />
                </span>
              ) : (
                <span className="block animate-in fade-in zoom-in duration-150">
                  <Menu className="w-5 h-5" />
                </span>
              )}
          </button>
          <button
            className="p-2"
            aria-label="Caută"
            onClick={searchOpen ? handleSearch : openSearch}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Left — desktop nav */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/shop" className="hover:text-primary/70 transition-colors">Magazin</Link>
          <Link href="/shop?category=new" className="hover:text-primary/70 transition-colors">Noutăți</Link>
          <Link href="/contact" className="hover:text-primary/70 transition-colors">Contact</Link>
        </div>

        {/* Center — logo */}
        <Link
          href="/"
          className="absolute left-1/2 top-1/2 w-max -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-xl leading-none sm:text-2xl tracking-wide font-medium"
        >
          Ank's Boutique
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center">
                {searchOpen && (
                  <div className="w-[220px] overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
                    <div className="flex items-center border-b border-foreground mx-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Caută produse…"
                        className="w-full bg-transparent text-sm outline-none py-1 placeholder:text-muted-foreground"
                      />
                      {query && (
                        <button onClick={() => setQuery("")} className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              <button
                className="p-2 hover:text-primary/70 transition-colors"
                aria-label={searchOpen ? "Caută" : "Deschide căutarea"}
                onClick={searchOpen ? handleSearch : openSearch}
                onMouseEnter={!searchOpen ? openSearch : undefined}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* User dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                className="p-2 hover:text-primary/70 transition-colors relative"
                aria-label="Contul meu"
                onClick={() => setUserMenuOpen((o) => !o)}
                onMouseEnter={() => setUserMenuOpen(true)}
              >
                <User className="w-5 h-5" />
                {isClientAuth && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 w-56 bg-background border border-border shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    {isClientAuth ? (
                      <>
                        <div className="px-4 py-3 border-b border-border/40">
                          <p className="text-xs font-medium truncate">{clientName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">Cont client</p>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="w-4 h-4" /> Contul Meu
                        </Link>
                        <button
                          onClick={() => {
                            localStorage.removeItem("clientAuthenticated");
                            localStorage.removeItem("client_user");
                            setUserMenuOpen(false);
                            navigate("/");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <LogIn className="w-4 h-4 rotate-180" /> Deconectare
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-border/40">
                          <p className="text-xs font-medium">Cont Client</p>
                          <p className="text-[10px] text-muted-foreground">Autentifică-te sau înregistrează-te</p>
                        </div>
                        <Link
                          href="/login"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LogIn className="w-4 h-4" /> Autentificare
                        </Link>
                        <Link
                          href="/register"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserPlus className="w-4 h-4" /> Înregistrare
                        </Link>
                      </>
                    )}
                  </div>
                )}
            </div>
          </div>

          <Link href="/wishlist" aria-label="Lista de favorite" className="p-2 hover:text-primary/70 transition-colors hidden sm:block">
            <Heart className="w-5 h-5" />
          </Link>

          <Link href="/cart" aria-label={`Coș de cumpărături${itemCount ? `, ${itemCount} produse` : ""}`} className="p-2 hover:text-primary/70 transition-colors relative flex items-center">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[10px] rounded-full">
                {itemCount}
              </Badge>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile menu drawer */}
        {menuOpen && (
          <div className="lg:hidden overflow-hidden bg-background border-t border-border/40 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-0">
              {navLinks.map((link, i) => (
                <div
                  key={link.href}
                >
                  <Link
                    href={link.href}
                    className="block py-3.5 border-b border-border/30 text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </div>
              ))}

              <div className="flex items-center gap-6 mt-6 pt-2">
                <Link href="/wishlist" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Heart className="w-4 h-4" /> Favorite
                </Link>
                {isClientAuth ? (
                  <Link href="/account" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <User className="w-4 h-4" /> Contul Meu
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <LogIn className="w-4 h-4" /> Autentificare
                    </Link>
                    <Link href="/register" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <UserPlus className="w-4 h-4" /> Înregistrare
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}

      {/* Mobile search bar */}
        {searchOpen && (
          <div className="lg:hidden overflow-hidden border-t border-border/40 bg-background animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Caută produse…"
                autoFocus
                className="flex-1 bg-transparent text-sm outline-none border-b border-foreground py-1 placeholder:text-muted-foreground"
              />
              <button onClick={handleSearch} aria-label="Caută" className="shrink-0">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={closeSearch} aria-label="Închide căutarea" className="shrink-0 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
    </header>
  );
}
