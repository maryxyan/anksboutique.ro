import { Link, useLocation } from "wouter";
import { ShoppingBag, Heart, Menu, Search, User } from "lucide-react";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [location] = useLocation();
  const sessionId = useSessionId();
  
  const { data: cart } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const itemCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 lg:hidden">
          <button className="p-2 -ml-2" aria-label="Menu">
            <Menu className="w-5 h-5" />
          </button>
          <button className="p-2" aria-label="Search">
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/shop" className="hover:text-primary/70 transition-colors">Shop</Link>
          <Link href="/shop?category=new" className="hover:text-primary/70 transition-colors">New Arrivals</Link>
          <Link href="/contact" className="hover:text-primary/70 transition-colors">Contact</Link>
        </div>

        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif text-2xl tracking-wide font-medium">
          Ank's Boutique
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-4">
            <button className="p-2" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
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
    </header>
  );
}
