import { db, categoriesTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const categories = [
  { id: 1, name: "Dresses", slug: "dresses", description: "Elegant dresses for every occasion" },
  { id: 2, name: "Blouses", slug: "blouses", description: "Refined tops and blouses" },
  { id: 3, name: "Outerwear", slug: "outerwear", description: "Coats and jackets" },
  { id: 4, name: "Accessories", slug: "accessories", description: "Jewellery, scarves, and more" },
  { id: 5, name: "Bags", slug: "bags", description: "Handbags and clutches" },
];

const products = [
  {
    title: "Silk Wrap Midi Dress",
    description: "A fluid wrap silhouette in pure silk charmeuse. Adjustable tie waist, deep V-neckline, midi hem. Dry clean only.",
    price: "549.00",
    comparePrice: "699.00",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "dresses",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 12,
    badge: "Best Seller",
    sku: "ANK-D001",
  },
  {
    title: "Linen Column Dress",
    description: "Minimalist column dress in premium Belgian linen. A-line cut, sleeveless, knee length. Machine wash cold.",
    price: "389.00",
    images: [
      "https://images.unsplash.com/photo-1596783074918-c84cb06531ca?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "dresses",
    sizes: ["XS", "S", "M", "L"],
    stock: 8,
    badge: "New",
    sku: "ANK-D002",
  },
  {
    title: "Velvet Evening Gown",
    description: "Floor-length gown in rich crushed velvet. Off-shoulder neckline, ruched bodice, hidden side zipper. Dry clean only.",
    price: "899.00",
    images: [
      "https://images.unsplash.com/photo-1566479179817-70fbc45572f3?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "dresses",
    sizes: ["S", "M", "L"],
    stock: 4,
    badge: "Limited",
    sku: "ANK-D003",
  },
  {
    title: "Pleated Chiffon Maxi",
    description: "Flowy pleated chiffon maxi dress. Elasticated waist, V-neck, flutter sleeves. Lightweight and breathable.",
    price: "469.00",
    images: [
      "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "dresses",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    stock: 15,
    badge: null,
    sku: "ANK-D004",
  },
  {
    title: "French Tuck Silk Blouse",
    description: "Buttery soft silk blouse with a relaxed fit. Single button cuff, collarless neckline. Perfect for tucking in.",
    price: "299.00",
    images: [
      "https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "blouses",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 20,
    badge: "Best Seller",
    sku: "ANK-B001",
  },
  {
    title: "Lace-Trimmed Cotton Blouse",
    description: "Lightweight cotton blouse with delicate lace trim at the collar and cuffs. Mother-of-pearl buttons.",
    price: "249.00",
    comparePrice: "319.00",
    images: [
      "https://images.unsplash.com/photo-1604917877934-07d56b6e31fb?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "blouses",
    sizes: ["S", "M", "L"],
    stock: 10,
    badge: "New",
    sku: "ANK-B002",
  },
  {
    title: "Camel Wool Trench Coat",
    description: "Timeless double-breasted trench in 100% merino wool. Belted waist, storm flap, deep pockets. Fully lined.",
    price: "1299.00",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "outerwear",
    sizes: ["XS", "S", "M", "L", "XL"],
    stock: 6,
    badge: "Best Seller",
    sku: "ANK-O001",
  },
  {
    title: "Quilted Puffer Vest",
    description: "Lightweight quilted vest with goose down insulation. Side pockets, inside zip pocket. Packable.",
    price: "449.00",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "outerwear",
    sizes: ["S", "M", "L", "XL"],
    stock: 9,
    badge: "New",
    sku: "ANK-O002",
  },
  {
    title: "Pearl Drop Earrings",
    description: "Freshwater pearl drops set in 14k gold vermeil. Hypoallergenic surgical steel posts. 4cm drop length.",
    price: "189.00",
    images: [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "accessories",
    sizes: [],
    stock: 30,
    badge: "Best Seller",
    sku: "ANK-A001",
  },
  {
    title: "Cashmere Wrap Scarf",
    description: "Pure cashmere wrap in a generous size. Soft fringe detailing. One size fits all. Grade A Mongolian cashmere.",
    price: "349.00",
    images: [
      "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "accessories",
    sizes: [],
    stock: 18,
    badge: null,
    sku: "ANK-A002",
  },
  {
    title: "Structured Leather Tote",
    description: "Full-grain Italian leather tote bag. Open top, inner zip pocket, two slip pockets. Polished gold hardware.",
    price: "799.00",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "bags",
    sizes: [],
    stock: 7,
    badge: "Best Seller",
    sku: "ANK-G001",
  },
  {
    title: "Suede Micro Clutch",
    description: "Petite suede clutch with magnetic snap closure. Card slot interior. Detachable wrist chain.",
    price: "459.00",
    comparePrice: "559.00",
    images: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=800&auto=format&fit=crop",
    ],
    categorySlug: "bags",
    sizes: [],
    stock: 11,
    badge: "New",
    sku: "ANK-G002",
  },
];

async function seed() {
  console.log("Seeding database...");

  // Upsert categories
  const catMap: Record<string, number> = {};
  for (const cat of categories) {
    try {
      await db.insert(categoriesTable).values({
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      }).onConflictDoUpdate({ target: categoriesTable.slug, set: { name: cat.name, description: cat.description } });
      console.log(`  ✓ Category: ${cat.name}`);
    } catch (e: any) {
      console.log(`  ! Category ${cat.name}: ${e.message}`);
    }
  }

  // Get category IDs
  const cats = await db.select().from(categoriesTable);
  for (const cat of cats) catMap[cat.slug] = cat.id;
  console.log("Category map:", catMap);

  // Insert products
  for (const p of products) {
    const categoryId = catMap[p.categorySlug];
    if (!categoryId) {
      console.log(`  ! No category found for slug: ${p.categorySlug}`);
      continue;
    }
    try {
      const [inserted] = await db.insert(productsTable).values({
        title: p.title,
        description: p.description,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        images: p.images,
        categoryId,
        sizes: p.sizes,
        stock: p.stock,
        badge: p.badge ?? null,
        sku: p.sku,
        active: true,
      }).onConflictDoNothing().returning();
      if (inserted) {
        console.log(`  ✓ Product: ${p.title}`);
      } else {
        console.log(`  ~ Product already exists: ${p.title}`);
      }
    } catch (e: any) {
      console.log(`  ! Product ${p.title}: ${e.message}`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
