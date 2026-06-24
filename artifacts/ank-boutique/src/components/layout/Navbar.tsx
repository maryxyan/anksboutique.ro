import { Link, useLocation } from "wouter";
import { ShoppingBag, Heart, Menu, Search, User, X } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [location, navigate] = useLocation();
  const sessionId = useSessionId();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

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

  useEffect(() => {
    closeSearch();
    setMenuOpen(false);
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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left — mobile */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            className="p-2 -ml-2"
            aria-label={menuOpen ? "Închide meniul" : "Deschide meniul"}
            onClick={() => { setMenuOpen((o) => !o); closeSearch(); }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
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
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl tracking-wide font-medium"
        >
          Ank's Boutique
        </Link>

        {/* Right */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-2">
            <div className="flex items-center">
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    key="search-input"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                className="p-2 hover:text-primary/70 transition-colors"
                aria-label={searchOpen ? "Caută" : "Deschide căutarea"}
                onClick={searchOpen ? handleSearch : openSearch}
                onMouseEnter={!searchOpen ? openSearch : undefined}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
            <Link href="/admin" className="p-2 hover:text-primary/70 transition-colors">
              <User className="w-5 h-5" />
            </Link>
          </div>

          <Link href="/wishlist" className="p-2 hover:text-primary/70 transition-colors hidden sm:block">
            <Heart className="w-5 h-5" />
          </Link>

          <Link href="/cart" className="p-2 hover:text-primary/70 transition-colors relative flex items-center">
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
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-background border-t border-border/40"
          >
            <nav className="container mx-auto px-4 py-6 flex flex-col gap-0">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={link.href}
                    className="block py-3.5 border-b border-border/30 text-sm uppercase tracking-widest font-medium text-foreground hover:text-muted-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <div className="flex items-center gap-6 mt-6 pt-2">
                <Link href="/wishlist" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Heart className="w-4 h-4" /> Favorite
                </Link>
                <Link href="/admin" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <User className="w-4 h-4" /> Admin
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile search bar */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="mobile-search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden border-t border-border/40 bg-background"
          >
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
              <button onClick={handleSearch} className="shrink-0">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={closeSearch} className="shrink-0 text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
