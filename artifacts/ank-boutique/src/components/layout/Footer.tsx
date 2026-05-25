import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 border-t border-border/10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <h3 className="font-serif text-2xl tracking-wide">Ank's Boutique</h3>
          <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
            Curated luxury fashion for the modern woman. Effortless style, pristine quality, designed for you.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Shop</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/shop" className="hover:text-primary-foreground transition-colors">All Products</Link></li>
            <li><Link href="/shop?category=new" className="hover:text-primary-foreground transition-colors">New Arrivals</Link></li>
            <li><Link href="/shop?category=best-sellers" className="hover:text-primary-foreground transition-colors">Best Sellers</Link></li>
            <li><Link href="/shop?category=sale" className="hover:text-primary-foreground transition-colors">Sale</Link></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Support</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/contact" className="hover:text-primary-foreground transition-colors">Contact Us</Link></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Shipping & Returns</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Size Guide</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Connect</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><a href="https://instagram.com/anksboutique" target="_blank" rel="noreferrer" className="hover:text-primary-foreground transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Facebook</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Pinterest</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-primary-foreground/10 text-sm text-primary-foreground/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Ank's Boutique. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
