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
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
  }, []);

  const handleSearch = useCallback(() => {
    const q = query.trim();
    if (!q) {
      closeSearch();
      return;
    }
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    closeSearch();
  }, [query, navigate, closeSearch]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") closeSearch();
  };

  // Close search when navigating away
  useEffect(() => {
    closeSearch();
  }, [location]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left — mobile */}
        <div className="flex items-center gap-4 lg:hidden">
          <button className="p-2 -ml-2" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
          <button
            className="p-2"
            aria-label="Search"
            onClick={searchOpen ? handleSearch : openSearch}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Left — desktop nav */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/shop" className="hover:text-primary/70 transition-colors">Shop</Link>
          <Link href="/shop?category=new" className="hover:text-primary/70 transition-colors">New Arrivals</Link>
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
            {/* Search bar + icon */}
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
                        placeholder="Search products…"
                        className="w-full bg-transparent text-sm outline-none py-1 placeholder:text-muted-foreground"
                      />
                      {query && (
                        <button
                          onClick={() => setQuery("")}
                          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                className="p-2 hover:text-primary/70 transition-colors"
                aria-label={searchOpen ? "Submit search" : "Open search"}
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

      {/* Mobile search bar — drops below the header */}
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
                placeholder="Search products…"
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
