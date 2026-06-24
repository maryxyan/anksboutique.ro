import { Layout } from "@/components/layout/Layout";
import { useParams } from "wouter";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check, Star, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetProduct,
  getGetProductQueryKey,
  useAddToCart,
  useToggleWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
  getGetCartQueryKey,
  useListProductReviews,
  getListProductReviewsQueryKey,
  useCreateReview,
} from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { Link } from "wouter";

export default function Product() {
  const { id } = useParams();
  const productId = parseInt(id as string, 10);
  const sessionId = useSessionId();
  const queryClient = useQueryClient();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [currentImage, setCurrentImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const { data: wishlist } = useGetWishlist(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetWishlistQueryKey({ sessionId }) } }
  );

  const { data: reviews } = useListProductReviews(productId, {
    query: { enabled: !!productId, queryKey: getListProductReviewsQueryKey(productId) },
  });

  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const createReview = useCreateReview();

  const isWishlisted = wishlist?.some((item) => item.productId === productId) || false;

  const handleAddToCart = () => {
    if (!sessionId || !product) return;
    if (product.sizes && product.sizes.length > 0 && !selectedSize) return;
    if (product.colors && product.colors.length > 0 && !selectedColor) return;

    addToCart.mutate(
      { data: { sessionId, productId, quantity: 1, size: selectedSize || undefined, color: selectedColor || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId }) });
          setAddedToCart(true);
          setTimeout(() => setAddedToCart(false), 2000);
        },
      }
    );
  };

  const handleWishlist = () => {
    if (!sessionId) return;
    toggleWishlist.mutate(
      { data: { sessionId, productId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey({ sessionId }) });
        },
      }
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReview.mutate(
      { id: productId, data: { reviewerName: reviewName, rating: reviewRating, comment: reviewComment } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductReviewsQueryKey(productId) });
          setReviewSubmitted(true);
          setReviewName("");
          setReviewComment("");
          setReviewRating(5);
        },
      }
    );
  };

  const images =
    product?.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=800&auto=format&fit=crop"];

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-[3/4] bg-muted" />
            <div className="space-y-6 pt-4">
              <div className="h-8 bg-muted w-3/4" />
              <div className="h-6 bg-muted w-1/4" />
              <div className="h-24 bg-muted w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <p className="text-muted-foreground mb-4">Produsul nu a fost găsit.</p>
          <Link href="/shop" className="border-b border-foreground pb-1 text-sm uppercase tracking-widest">
            Înapoi la Magazin
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <Link href="/shop" className="inline-flex items-center text-muted-foreground text-sm mb-8 hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Înapoi la Magazin
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImage}
                  src={images[currentImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {product.badge && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-foreground text-[10px] uppercase tracking-wider px-3 py-1">
                  {product.badge}
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((i) => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 hover:bg-background transition-colors"
                    disabled={currentImage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((i) => Math.min(images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/70 hover:bg-background transition-colors"
                    disabled={currentImage === images.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${i === currentImage ? "border-foreground" : "border-transparent"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8 lg:pt-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">
                {product.categoryName}
              </p>
              <h1 className="text-3xl lg:text-4xl font-serif mb-4">{product.title}</h1>

              <div className="flex items-center gap-4 mb-4">
                <span className={`text-2xl font-light ${product.comparePrice ? "text-destructive" : ""}`}>
                  {Number(product.price).toFixed(2)} RON
                </span>
                {product.comparePrice && (
                  <span className="text-muted-foreground line-through text-lg">
                    {Number(product.comparePrice).toFixed(2)} RON
                  </span>
                )}
              </div>

              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating || 0) ? "fill-foreground text-foreground" : "text-border"}`} />
                    ))}
                  </div>
                  <span>({product.reviewCount} {product.reviewCount === 1 ? "recenzie" : "recenzii"})</span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium uppercase tracking-widest">Mărime</h3>
                  {selectedSize && <span className="text-muted-foreground text-sm">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-[40px] px-3 border text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium uppercase tracking-widest">Culoare</h3>
                  {selectedColor && <span className="text-muted-foreground text-sm">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => {
                    const COLOR_MAP: Record<string, string> = {
                      White: "#FFFFFF", Ivory: "#FFFFF0", Beige: "#F5F0E8", Blush: "#FFB6C1",
                      Red: "#C0392B", Burgundy: "#800020", Pink: "#E91E8C", Orange: "#E67E22",
                      Yellow: "#F1C40F", Mint: "#98D8C8", Green: "#27AE60", Teal: "#008080",
                      Navy: "#1B2A5A", Blue: "#2980B9", Lilac: "#C8A2C8", Purple: "#7D3C98",
                      Camel: "#C19A6B", Brown: "#6D4C41", Grey: "#95A5A6", Black: "#1A1A1A",
                    };
                    const hex = COLOR_MAP[color] ?? "#CCCCCC";
                    const isLight = ["White", "Ivory", "Beige", "Blush", "Yellow", "Mint"].includes(color);
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        title={color}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-foreground scale-110 shadow-md"
                            : isLight
                            ? "border-border hover:border-muted-foreground"
                            : "border-transparent hover:border-muted-foreground"
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {isSelected && (
                          <svg
                            viewBox="0 0 12 12"
                            className={`absolute inset-0 m-auto w-3 h-3 ${isLight ? "text-foreground" : "text-white"}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="1.5,6 4.5,9.5 10.5,2.5" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            {product.inStock ? (
              <p className="text-sm text-green-700">În Stoc — {product.stock} disponibile</p>
            ) : (
              <p className="text-sm text-destructive">Stoc Epuizat</p>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                onClick={handleAddToCart}
                disabled={!product.inStock || addToCart.isPending}
                whileTap={{ scale: 0.98 }}
                className={`w-full h-14 flex items-center justify-center gap-3 text-sm uppercase tracking-widest font-medium transition-all ${
                  addedToCart
                    ? "bg-green-800 text-white"
                    : "bg-foreground text-background hover:bg-foreground/80 disabled:opacity-40"
                }`}
              >
                <AnimatePresence mode="wait">
                  {addedToCart ? (
                    <motion.span key="added" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Adăugat în Geantă
                    </motion.span>
                  ) : (
                    <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> Adaugă în Geantă
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <button
                onClick={handleWishlist}
                className={`w-full h-12 flex items-center justify-center gap-3 border text-sm uppercase tracking-widest font-medium transition-colors ${
                  isWishlisted ? "border-foreground bg-accent" : "border-border hover:border-foreground"
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-foreground" : ""}`} />
                {isWishlisted ? "Salvat în Listă" : "Adaugă în Listă"}
              </button>
            </div>

            {product.sku && (
              <p className="text-xs text-muted-foreground">COD: {product.sku}</p>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-24 border-t border-border/40 pt-16">
          <h2 className="text-2xl font-serif mb-10">Recenzii Clienți</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Existing Reviews */}
            <div className="space-y-8">
              {reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review.id} className="border-b border-border/40 pb-8">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">{review.reviewerName}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-foreground text-foreground" : "text-border"}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(review.createdAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nicio recenzie încă. Fii primul care împărtășește părerea ta.</p>
              )}
            </div>

            {/* Review Form */}
            <div>
              <h3 className="text-lg font-medium mb-6">Scrie o Recenzie</h3>
              {reviewSubmitted ? (
                <div className="p-6 bg-muted text-center">
                  <Check className="w-6 h-6 mx-auto mb-2 text-green-700" />
                  <p className="text-sm">Îți mulțumim pentru recenzie!</p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium mb-2">Numele Tău</label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors"
                      placeholder="Maria Ionescu"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium mb-2">Evaluare</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} type="button" onClick={() => setReviewRating(s)}>
                          <Star className={`w-6 h-6 cursor-pointer transition-colors ${s <= reviewRating ? "fill-foreground text-foreground" : "text-border hover:text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-medium mb-2">Recenzia Ta</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                      placeholder="Ce părere ai despre acest articol?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={createReview.isPending}
                    className="w-full h-12 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors"
                  >
                    Trimite Recenzia
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
