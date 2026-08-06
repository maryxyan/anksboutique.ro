import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingBag, X, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetCart,
  getGetCartQueryKey,
  useUpdateCartItem,
  useRemoveCartItem,
} from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";

export default function Cart() {
  const sessionId = useSessionId();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  const handleQuantity = (itemId: number, qty: number) => {
    if (qty < 1) return;
    updateItem.mutate(
      { itemId, data: { quantity: qty } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) }) }
    );
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate(
      { itemId },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) }) }
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <><Helmet><title>Cosul Meu | Anks Boutique</title><meta name="robots" content="noindex, nofollow" /></Helmet><Layout>
      <div className="container mx-auto px-4 py-10 lg:py-20">
        <h1 className="text-3xl lg:text-4xl font-serif mb-8 lg:mb-12">Geanta Ta</h1>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-6 pb-6 border-b border-border/40">
                <div className="w-28 h-36 bg-muted shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted w-1/2" />
                  <div className="h-4 bg-muted w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-24">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <ShoppingBag className="w-16 h-16 mx-auto text-border mb-6" strokeWidth={1} />
              <h2 className="text-xl font-serif mb-3">Geanta ta este goală</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
                Nu ai adăugat nimic încă. Explorează colecția pentru a găsi ceva care îți place.
              </p>
              <Link
                href="/shop"
                className="inline-block bg-foreground text-background px-10 py-3.5 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
              >
                Descoperă Colecția
              </Link>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 space-y-0">
              <AnimatePresence>
                {cart.items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-4 sm:gap-6 py-6 sm:py-8 border-b border-border/40"
                  >
                    <Link href={`/product/${item.productId}`} className="shrink-0">
                      <img
                        src={
                          item.productImage ||
                          "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=200&auto=format&fit=crop"
                        }
                        alt={item.productTitle}
                        loading="lazy"
                        className="w-24 h-32 sm:w-28 sm:h-36 object-cover bg-muted"
                      />
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-sm mb-1">{item.productTitle}</h3>
                          {item.size && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              Mărime: {item.size}
                            </p>
                          )}
                          {item.color && (
                            <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                              Culoare: {item.color}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={`Elimină ${item.productTitle} din coș`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() => handleQuantity(item.id, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label={`Scade cantitatea pentru ${item.productTitle}`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantity(item.id, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label={`Crește cantitatea pentru ${item.productTitle}`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="font-medium text-sm">
                          {(item.price * item.quantity).toFixed(2)} RON
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-muted p-6 sm:p-8 lg:sticky lg:top-24">
                <h2 className="text-lg font-medium mb-6">Sumar Comandă</h2>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.itemCount} {cart.itemCount === 1 ? "produs" : "produse"})</span>
                    <span>{cart.subtotal.toFixed(2)} RON</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livrare</span>
                    <span>Calculat la finalizare</span>
                  </div>
                </div>
                <div className="border-t border-border pt-4 mb-8">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>{cart.total.toFixed(2)} RON</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-foreground text-background py-4 text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 transition-colors"
                >
                  Finalizează Comanda
                </Link>
                <Link
                  href="/shop"
                  className="block w-full text-center text-muted-foreground mt-4 text-sm hover:text-foreground transition-colors"
                >
                  Continuă Cumpărăturile
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout></>
  );
}
