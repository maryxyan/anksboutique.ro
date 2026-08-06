import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Heart, Search } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { useEffect } from "react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const sessionId = useSessionId();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  
  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 w-full pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      <Footer />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-background border-t border-border flex items-center justify-around px-2 z-50">
        <Link href="/" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/shop" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.startsWith('/shop') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-medium">Shop</span>
        </Link>
        <Link href="/wishlist" className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location === '/wishlist' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Heart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        <Link href="/cart" className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${location === '/cart' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-3.5 w-3.5 flex items-center justify-center bg-primary text-primary-foreground text-[9px] rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
      </div>

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/40720180186" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-20 lg:bottom-6 right-6 z-50 bg-[#25D366] text-white p-3.5 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      </a>
    </div>
  );
}
