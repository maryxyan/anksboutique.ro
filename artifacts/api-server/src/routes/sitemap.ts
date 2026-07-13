import { Router, type IRouter } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  try {
    const products = await db
      .select({ id: productsTable.id, updatedAt: productsTable.createdAt })
      .from(productsTable)
      .where(eq(productsTable.active, true));

    const categories = await db
      .select({ slug: categoriesTable.slug })
      .from(categoriesTable);

    const now = new Date().toISOString();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Home
    xml += `  <url><loc>https://anksboutique.ro/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>\n`;

    // Shop (all products)
    xml += `  <url><loc>https://anksboutique.ro/shop</loc><priority>0.9</priority><changefreq>daily</changefreq></url>\n`;

    // Categories
    for (const cat of categories) {
      xml += `  <url><loc>https://anksboutique.ro/shop?category=${cat.slug}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>\n`;
    }

    // Products
    for (const product of products) {
      const lastmod = product.updatedAt
        ? new Date(product.updatedAt).toISOString().split("T")[0]
        : now.split("T")[0];
      xml += `  <url><loc>https://anksboutique.ro/product/${product.id}</loc><priority>0.7</priority><changefreq>weekly</changefreq><lastmod>${lastmod}</lastmod></url>\n`;
    }

    // Static pages
    const staticPages = [
      { loc: "/contact", priority: "0.5", changefreq: "monthly" },
      { loc: "/retur", priority: "0.3", changefreq: "monthly" },
      { loc: "/livrare", priority: "0.3", changefreq: "monthly" },
      { loc: "/ghid-marimi", priority: "0.4", changefreq: "monthly" },
      { loc: "/faq", priority: "0.4", changefreq: "monthly" },
      { loc: "/confidentialitate", priority: "0.2", changefreq: "monthly" },
      { loc: "/termeni", priority: "0.2", changefreq: "monthly" },
    ];

    for (const page of staticPages) {
      xml += `  <url><loc>https://anksboutique.ro${page.loc}</loc><priority>${page.priority}</priority><changefreq>${page.changefreq}</changefreq></url>\n`;
    }

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

export default router;
