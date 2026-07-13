import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useParams } from "wouter";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetProduct,
  getGetProductQueryKey,
  useAddToCart,
  useToggleWishlist,
  useGetWishlist,
  getGetWishlistQueryKey,
  getGetCartQueryKey,
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

  const { data: product, isLoading } = useGetProduct(productId, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId) },
  });

  const { data: wishlist } = useGetWishlist(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetWishlistQueryKey({ sessionId }) } }
  );

  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();

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

  // images switch based on selected color via colorImages
  const images: string[] = (selectedColor && (product as any)?.colorImages?.[selectedColor]?.length
    ? (product as any).colorImages[selectedColor]
    : product?.images?.length
      ? product.images
      : ["https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=800&auto=format&fit=crop"]
  );

  // Reset image index when color changes
  useEffect(() => {
    setCurrentImage(0);
  }, [selectedColor]);

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Se încarcă... | Anks Boutique</title>
        </Helmet>
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
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Helmet>
          <title>Produs negăsit | Anks Boutique</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-24 text-center">
            <p className="text-muted-foreground mb-4">Produsul nu a fost găsit.</p>
            <Link href="/shop" className="border-b border-foreground pb-1 text-sm uppercase tracking-widest">
              Înapoi la Magazin
            </Link>
          </div>
        </Layout>
      </>
    );
  }

  // Schema.org JSON-LD for Product
  const productSchema: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.title,
    "description": product.description?.slice(0, 200) || "",
    "image": product.images?.[0] || "",
    "sku": product.sku || undefined,
    "brand": {
      "@type": "Brand",
      "name": "Anks Boutique",
    },
    "offers": {
      "@type": "Offer",
      "url": typeof window !== "undefined" ? window.location.href : "",
      "priceCurrency": "RON",
      "price": Number(product.price),
      "availability": product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
    },
  };

  const metaDescription = product.description
    ? product.description.slice(0, 160)
    : `${product.title} — produs premium la Anks Boutique. Preț: ${Number(product.price).toFixed(2)} RON.`;

  return (
    <>
      <Helmet>
        <title>{product.title} | Anks Boutique</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${product.title} | Anks Boutique`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.images?.[0] || ""} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={typeof window !== "undefined" ? window.location.href : ""} />
        <meta property="product:price:amount" content={String(Number(product.price).toFixed(2))} />
        <meta property="product:price:currency" content="RON" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.title} | Anks Boutique`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={product.images?.[0] || ""} />
        <link rel="canonical" href={`https://anksboutique.ro/product/${product.id}`} />

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Acasă", "item": "https://anksboutique.ro/" },
            {
              "@type": "ListItem",
              "position": 2,
              "name": product.categoryName || "Colecție",
              "item": `https://anksboutique.ro/shop${product.categoryName ? "?category=" + encodeURIComponent(product.categoryName.toLowerCase()) : ""}`,
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": product.title,
              "item": `https://anksboutique.ro/product/${product.id}`,
            },
          ],
        })}</script>

        {/* Product Schema */}
        <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
      </Helmet>
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
                      <img src={img} alt={product.title} loading="lazy" className="w-full h-full object-cover" />
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
        </div>
      </Layout>
    </>
  );
}
