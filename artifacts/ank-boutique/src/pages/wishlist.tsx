import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  useGetWishlist,
  getGetWishlistQueryKey,
  useToggleWishlist,
  useAddToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { ProductCard } from "@/components/ui/product-card";

export default function Wishlist() {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useGetWishlist(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetWishlistQueryKey({ sessionId }) } }
  );

  const toggleWishlist = useToggleWishlist();
  const addToCart = useAddToCart();

  const handleRemove = (productId: number) => {
    if (!sessionId) return;
    toggleWishlist.mutate(
      { data: { sessionId, productId } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey({ sessionId }) }) }
    );
  };

  const isEmpty = !wishlist || wishlist.length === 0;

  return (
    <><Helmet><title>Lista de Dorinte | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><Layout>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="flex items-end justify-between mb-12">
          <h1 className="text-3xl lg:text-4xl font-serif">Listă de Dorințe</h1>
          {!isEmpty && (
            <p className="text-muted-foreground text-sm">{wishlist.length} {wishlist.length === 1 ? "articol" : "articole"}</p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <div className="aspect-[3/4] bg-muted mb-4" />
                <div className="h-4 bg-muted w-3/4 mb-2" />
                <div className="h-4 bg-muted w-1/4" />
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Heart className="w-16 h-16 mx-auto text-border mb-6" strokeWidth={1} />
              <h2 className="text-xl font-serif mb-3">Lista ta de dorințe este goală</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                Salvează piesele care îți plac pentru a le regăsi mai târziu.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-foreground text-background px-10 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
              >
                Explorează Colecția
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
            {wishlist.map((item) => (
              <ProductCard key={item.id} product={item.product} />
            ))}
          </div>
        )}
      </div>
    </Layout></>
  );
}
