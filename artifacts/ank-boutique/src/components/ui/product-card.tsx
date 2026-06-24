import { Link } from "wouter";
import { Heart } from "lucide-react";
import { Product } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { useToggleWishlist, useGetWishlist, getGetWishlistQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";

export function ProductCard({ product }: { product: Product }) {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  
  const { data: wishlist } = useGetWishlist(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetWishlistQueryKey({ sessionId }) } }
  );

  const toggleWishlist = useToggleWishlist();
  
  const isWishlisted = wishlist?.some(item => item.productId === product.id) || false;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sessionId) return;
    
    toggleWishlist.mutate({ data: { sessionId, productId: product.id } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey({ sessionId }) });
      }
    });
  };

  const image = product.images?.[0] || "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=600&auto=format&fit=crop";
  const hoverImage = product.images?.[1] || image;

  return (
    <Link href={`/product/${product.id}`} className="group block cursor-pointer">
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-muted mb-4"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img 
          src={isHovered ? hoverImage : image} 
          alt={product.title}
          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
        />
        
        {product.badge && (
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur text-foreground text-[10px] uppercase tracking-wider px-2 py-1 z-10">
            {product.badge}
          </div>
        )}
        
        <button 
          onClick={handleWishlist}
          className="absolute top-3 right-3 p-2 z-10 rounded-full bg-background/50 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <motion.div whileTap={{ scale: 0.8 }}>
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-accent text-accent' : 'text-foreground'}`} />
          </motion.div>
        </button>

        {!product.inStock && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-background text-foreground text-xs uppercase tracking-widest px-4 py-2">
              Stoc Epuizat
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-medium text-foreground truncate">{product.title}</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className={product.comparePrice ? "text-destructive" : "text-foreground"}>
            {product.price} RON
          </span>
          {product.comparePrice && (
            <span className="text-muted-foreground line-through text-xs">
              {product.comparePrice} RON
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
