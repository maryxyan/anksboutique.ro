import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { useListFeaturedProducts, useListNewArrivals } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/product-card";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const { data: featuredProducts } = useListFeaturedProducts();
  const { data: newArrivals } = useListNewArrivals();

  const carouselRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateButtons = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateButtons();
    el.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [newArrivals]);

  const scroll = (dir: "prev" | "next") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = el.querySelector("div")?.offsetWidth ?? 320;
    el.scrollBy({ left: dir === "next" ? cardWidth + 24 : -(cardWidth + 24), behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>Anks Boutique — Modă și Accesorii Premium pentru Femei</title>
        <meta name="description" content="Descoperă colecția exclusivă Anks Boutique: rochii elegante, compleuri rafinate și accesorii statement. Piese premium pentru femeia modernă — livrare în toată România." />
        <meta property="og:title" content="Anks Boutique — Modă și Accesorii Premium" />
        <meta property="og:description" content="Descoperă colecția exclusivă Anks Boutique: rochii elegante, compleuri rafinate și accesorii statement." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <link rel="canonical" href="https://anksboutique.ro" />
      </Helmet>
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full bg-muted overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2000&auto=format&fit=crop" 
            alt="Ank's Boutique" 
            loading="lazy"
            className="w-full h-full object-cover object-center opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-multiply" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 tracking-wide drop-shadow-sm">
              Eleganță fără efort.
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-light mb-10 max-w-xl mx-auto">
              Lux rafinat pentru femeia modernă. Descoperă noua colecție.
            </p>
            <Link 
              href="/shop" 
              className="inline-block bg-white text-black px-10 py-4 text-sm tracking-widest uppercase font-medium hover:bg-white/90 transition-colors"
            >
              Descoperă Colecția
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories Strip */}
      <section className="py-12 border-b border-border/40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-sm uppercase tracking-widest text-muted-foreground">
            <Link href="/shop?category=dresses" className="hover:text-foreground transition-colors">Rochii</Link>
            <Link href="/shop?category=blouses" className="hover:text-foreground transition-colors">Bluze</Link>
            <Link href="/shop?category=outerwear" className="hover:text-foreground transition-colors">Jachete</Link>
            <Link href="/shop?category=accessories" className="hover:text-foreground transition-colors">Accesorii</Link>
            <Link href="/shop?category=bags" className="hover:text-foreground transition-colors">Genți</Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Selecție Rafinată</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Piese care transcend anotimpurile. Realizate cu grijă pentru garderoba ta de zi cu zi.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
          {featuredProducts?.slice(0, 4).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        <div className="text-center mt-16">
          <Link href="/shop" className="inline-block border border-foreground text-foreground px-8 py-3 text-sm tracking-widest uppercase font-medium hover:bg-foreground hover:text-background transition-colors">
            Vezi Toate
          </Link>
        </div>
      </section>

      {/* Brand Statement Split */}
      <section className="py-0 flex flex-col md:flex-row bg-[#F5EFE7]">
        <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-[500px] md:h-[700px]">
          <img 
            src="https://images.unsplash.com/photo-1550614000-4b95d466f272?q=80&w=1200&auto=format&fit=crop" 
            alt="Editorial" 
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-12 md:p-24 text-center md:text-left">
          <div className="max-w-md">
            <h2 className="text-3xl md:text-5xl font-serif mb-6 leading-tight text-[#111111]">
              Încredere discretă, nu exces strident.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Credem în puterea unui croiaj impecabil și a materialelor de calitate. Fiecare piesă din colecția noastră este aleasă să te facă să te simți ancorată și aspirațională în același timp.
            </p>
            <Link href="/about" className="text-sm border-b border-foreground pb-1 uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors">
              Povestea Noastră
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals Strip */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-serif">Noutăți</h2>
            <Link href="/shop?category=new" className="text-sm border-b border-foreground pb-1 uppercase tracking-widest hidden md:block">
              Cumpără Noutăți
            </Link>
          </div>

          <div className="relative">
            {canPrev && (
              <button
                onClick={() => scroll("prev")}
                aria-label="Anterior"
                className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/40 shadow-sm flex items-center justify-center hover:bg-background/80 transition-all opacity-70 hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {canNext && (
              <button
                onClick={() => scroll("next")}
                aria-label="Următor"
                className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/40 shadow-sm flex items-center justify-center hover:bg-background/80 transition-all opacity-70 hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-2 scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {newArrivals?.map(product => (
                <div key={product.id} className="min-w-[280px] md:min-w-[320px] w-[70vw] md:w-1/4 snap-start shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-32 bg-muted text-center px-4">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl font-serif mb-4">Lista Insider</h2>
          <p className="text-muted-foreground mb-8">
            Abonează-te pentru acces anticipat la colecții noi, evenimente exclusive și vânzări private.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Adresa ta de email" 
              className="flex-1 bg-background border-none px-6 py-3 text-sm focus:ring-1 focus:ring-foreground outline-none"
              required
            />
            <button type="submit" className="bg-foreground text-background px-8 py-3 text-sm uppercase tracking-widest font-medium">
              Abonează-te
            </button>
          </form>
        </div>
      </section>
    </Layout></>
  );
}
