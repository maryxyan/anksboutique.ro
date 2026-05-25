import { db, categoriesTable, productsTable } from "./index.js";

const cats = [
  { name: "Dresses", slug: "dresses", description: "Elegant dresses for every occasion" },
  { name: "Blouses", slug: "blouses", description: "Refined tops and blouses" },
  { name: "Outerwear", slug: "outerwear", description: "Coats and jackets" },
  { name: "Accessories", slug: "accessories", description: "Jewellery, scarves, and more" },
  { name: "Bags", slug: "bags", description: "Handbags and clutches" },
];

for (const cat of cats) {
  try {
    await db.insert(categoriesTable).values(cat).onConflictDoUpdate({ target: categoriesTable.slug, set: { name: cat.name } });
    console.log("Cat OK:", cat.name);
  } catch (e: any) { console.log("Cat ERR:", cat.name, String(e).substring(0, 100)); }
}

const allCats = await db.select().from(categoriesTable);
const catMap: Record<string, number> = Object.fromEntries(allCats.map((c) => [c.slug, c.id]));
console.log("CatMap:", catMap);

const products = [
  { title: "Silk Wrap Midi Dress", description: "A fluid wrap silhouette in pure silk charmeuse. Adjustable tie waist, deep V-neckline, midi hem.", price: "549.00", comparePrice: "699.00", images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=800&auto=format&fit=crop"], categorySlug: "dresses", sizes: ["XS", "S", "M", "L", "XL"], stock: 12, badge: "Best Seller", sku: "ANK-D001" },
  { title: "Linen Column Dress", description: "Minimalist column dress in premium Belgian linen. A-line cut, sleeveless, knee length.", price: "389.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop"], categorySlug: "dresses", sizes: ["XS", "S", "M", "L"], stock: 8, badge: "New", sku: "ANK-D002" },
  { title: "Velvet Evening Gown", description: "Floor-length gown in rich crushed velvet. Off-shoulder neckline, ruched bodice, hidden side zipper.", price: "899.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1566479179817-70fbc45572f3?q=80&w=800&auto=format&fit=crop"], categorySlug: "dresses", sizes: ["S", "M", "L"], stock: 4, badge: "Limited", sku: "ANK-D003" },
  { title: "Pleated Chiffon Maxi", description: "Flowy pleated chiffon maxi dress. Elasticated waist, V-neck, flutter sleeves.", price: "469.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop"], categorySlug: "dresses", sizes: ["XS", "S", "M", "L", "XL", "XXL"], stock: 15, badge: null, sku: "ANK-D004" },
  { title: "French Tuck Silk Blouse", description: "Buttery soft silk blouse with a relaxed fit. Single button cuff, collarless neckline.", price: "299.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=800&auto=format&fit=crop"], categorySlug: "blouses", sizes: ["XS", "S", "M", "L", "XL"], stock: 20, badge: "Best Seller", sku: "ANK-B001" },
  { title: "Lace-Trimmed Cotton Blouse", description: "Lightweight cotton blouse with delicate lace trim at the collar and cuffs.", price: "249.00", comparePrice: "319.00", images: ["https://images.unsplash.com/photo-1604917877934-07d56b6e31fb?q=80&w=800&auto=format&fit=crop"], categorySlug: "blouses", sizes: ["S", "M", "L"], stock: 10, badge: "New", sku: "ANK-B002" },
  { title: "Camel Wool Trench Coat", description: "Timeless double-breasted trench in 100% merino wool. Belted waist, storm flap, deep pockets.", price: "1299.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=800&auto=format&fit=crop"], categorySlug: "outerwear", sizes: ["XS", "S", "M", "L", "XL"], stock: 6, badge: "Best Seller", sku: "ANK-O001" },
  { title: "Quilted Puffer Vest", description: "Lightweight quilted vest with goose down insulation. Side pockets, inside zip pocket. Packable.", price: "449.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop"], categorySlug: "outerwear", sizes: ["S", "M", "L", "XL"], stock: 9, badge: "New", sku: "ANK-O002" },
  { title: "Pearl Drop Earrings", description: "Freshwater pearl drops set in 14k gold vermeil. Hypoallergenic surgical steel posts.", price: "189.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop"], categorySlug: "accessories", sizes: [], stock: 30, badge: "Best Seller", sku: "ANK-A001" },
  { title: "Cashmere Wrap Scarf", description: "Pure cashmere wrap in a generous size. Soft fringe detailing. Grade A Mongolian cashmere.", price: "349.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=800&auto=format&fit=crop"], categorySlug: "accessories", sizes: [], stock: 18, badge: null, sku: "ANK-A002" },
  { title: "Structured Leather Tote", description: "Full-grain Italian leather tote bag. Open top, inner zip pocket, two slip pockets. Polished gold hardware.", price: "799.00", comparePrice: null, images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop", "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop"], categorySlug: "bags", sizes: [], stock: 7, badge: "Best Seller", sku: "ANK-G001" },
  { title: "Suede Micro Clutch", description: "Petite suede clutch with magnetic snap closure. Card slot interior. Detachable wrist chain.", price: "459.00", comparePrice: "559.00", images: ["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=800&auto=format&fit=crop"], categorySlug: "bags", sizes: [], stock: 11, badge: "New", sku: "ANK-G002" },
];

for (const p of products) {
  const categoryId = catMap[p.categorySlug];
  if (!categoryId) { console.log("No cat for", p.categorySlug); continue; }
  try {
    await db.insert(productsTable).values({
      title: p.title, description: p.description, price: p.price,
      comparePrice: p.comparePrice ?? null, images: p.images, categoryId,
      sizes: p.sizes, stock: p.stock, badge: p.badge ?? null, sku: p.sku, active: true,
    }).onConflictDoNothing();
    console.log("Product OK:", p.title);
  } catch (e: any) { console.log("Product ERR:", p.title, String(e).substring(0, 100)); }
}

console.log("SEED DONE");
process.exit(0);
