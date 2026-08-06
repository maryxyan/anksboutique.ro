import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/product-card";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

export default function Shop() {
  const [location] = useLocation();
  
  const getParams = () => new URLSearchParams(window.location.search);

  const [category, setCategory] = useState(() => getParams().get("category") || "");
  const [search, setSearch] = useState(() => getParams().get("search") || "");
  const [sortBy, setSortBy] = useState(() => getParams().get("sortBy") || "newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const p = getParams();
    setCategory(p.get("category") || "");
    setSearch(p.get("search") || "");
    setSortBy(p.get("sortBy") || "newest");
  }, [location]);
  
  const { data: productsData, isLoading } = useListProducts({ 
    category: category || undefined,
    search: search || undefined,
    sortBy
  });
  
  const { data: categories } = useListCategories();

  const currentCategory = useMemo(() => {
    if (!category || !categories) return null;
    return categories.find(c => c.slug === category);
  }, [category, categories]);

  const pageTitle = currentCategory 
    ? `${currentCategory.name} — Modă ${currentCategory.name.toLowerCase()} | Anks Boutique`
    : search 
      ? `Căutare: ${search} | Anks Boutique`
      : "Colecție — Modă și Accesorii | Anks Boutique";

  const pageDescription = currentCategory
    ? `Descoperă selecția noastră de ${currentCategory.name.toLowerCase()}. Piese premium, livrare rapidă în toată România — Anks Boutique.`
    : search
      ? `Rezultate căutare pentru "${search}" în magazinul Anks Boutique. Găsește produsul perfect pentru tine.`
      : "Explorează colecția completă Anks Boutique: rochii elegante, bluze, accesorii și piese statement pentru femei. Livrare în toată România.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        {category && <link rel="canonical" href={`https://anksboutique.ro/shop?category=${category}`} />}

        {/* BreadcrumbList Schema */}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Acasă", "item": "https://anksboutique.ro/" },
            {
              "@type": "ListItem",
              "position": 2,
              "name": currentCategory ? currentCategory.name : (search ? `Căutare: ${search}` : "Colecție"),
              "item": window.location.href,
            },
          ],
        })}</script>
      </Helmet>
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-4">{currentCategory ? currentCategory.name : "Colecție"}</h1>
          <p className="text-muted-foreground text-sm">
            {currentCategory 
              ? `Descoperă selecția noastră de ${currentCategory.name.toLowerCase()}.` 
              : "Descoperă selecția noastră rafinată de piese premium."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <button
            type="button"
            onClick={() => setFiltersOpen((open) => !open)}
            className="lg:hidden w-full min-h-11 flex items-center justify-between border border-border px-4 text-sm font-medium"
            aria-expanded={filtersOpen}
            aria-controls="shop-filters"
          >
            <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Căutare și filtre</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
          {/* Sidebar Filters */}
          <aside id="shop-filters" className={`${filtersOpen ? "block" : "hidden"} w-full lg:block lg:w-64 shrink-0 space-y-8 border-b border-border pb-6 lg:border-0 lg:pb-0`}>
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Caută produse..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm focus:border-foreground outline-none transition-colors"
                />
              </div>

              <h3 className="font-medium mb-4 text-sm uppercase tracking-widest">Categorii</h3>
              <div className="flex flex-wrap gap-x-5 gap-y-3 lg:block lg:space-y-2">
                <button 
                  onClick={() => setCategory("")}
                  className={`block text-sm transition-colors ${!category ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Toate Produsele
                </button>
                {categories?.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`block text-sm transition-colors ${category === cat.slug ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4 text-sm uppercase tracking-widest">Sortează</h3>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-background border border-border px-4 py-2 text-sm focus:border-foreground outline-none transition-colors appearance-none"
              >
                <option value="newest">Cele mai noi</option>
                <option value="price_asc">Preț: Crescător</option>
                <option value="price_desc">Preț: Descrescător</option>
              </select>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted aspect-[3/4] mb-4"></div>
                    <div className="h-4 bg-muted w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : productsData?.products?.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-muted-foreground">Nu s-au găsit produse pentru criteriile selectate.</p>
                <button 
                  onClick={() => { setCategory(""); setSearch(""); }}
                  className="mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest font-medium"
                >
                  Resetează Filtrele
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-12">
                {productsData?.products?.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout></>
  );
}
