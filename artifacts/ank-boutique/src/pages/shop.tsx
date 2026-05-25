import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { useLocation } from "wouter";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ui/product-card";
import { Search, SlidersHorizontal } from "lucide-react";

export default function Shop() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  
  const { data: productsData, isLoading } = useListProducts({ 
    category: category || undefined,
    search: search || undefined,
    sortBy
  });
  
  const { data: categories } = useListCategories();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-4">Collection</h1>
          <p className="text-muted-foreground text-sm">Discover our curated selection of premium pieces.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0 space-y-8">
            <div>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm focus:border-foreground outline-none transition-colors"
                />
              </div>

              <h3 className="font-medium mb-4 text-sm uppercase tracking-widest">Categories</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setCategory("")}
                  className={`block text-sm transition-colors ${!category ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All Products
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
              <h3 className="font-medium mb-4 text-sm uppercase tracking-widest">Sort By</h3>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-background border border-border px-4 py-2 text-sm focus:border-foreground outline-none transition-colors appearance-none"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
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
                <p className="text-muted-foreground">No products found matching your criteria.</p>
                <button 
                  onClick={() => { setCategory(""); setSearch(""); }}
                  className="mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest font-medium"
                >
                  Clear Filters
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
    </Layout>
  );
}
