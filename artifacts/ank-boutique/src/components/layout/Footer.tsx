import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-16 border-t border-border/10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <h3 className="font-serif text-2xl tracking-wide">Ank's Boutique</h3>
          <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-xs">
            Modă de lux rafinată pentru femeia modernă. Stil fără efort, calitate impecabilă, creată pentru tine.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Magazin</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/shop" className="hover:text-primary-foreground transition-colors">Toate Produsele</Link></li>
            <li><Link href="/shop?category=new" className="hover:text-primary-foreground transition-colors">Noutăți</Link></li>
            <li><Link href="/shop?category=best-sellers" className="hover:text-primary-foreground transition-colors">Cele Mai Vândute</Link></li>
            <li><Link href="/shop?category=sale" className="hover:text-primary-foreground transition-colors">Reduceri</Link></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Suport</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><Link href="/contact" className="hover:text-primary-foreground transition-colors">Contactează-ne</Link></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Livrare & Retururi</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Ghid de Mărimi</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Întrebări Frecvente</a></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Social</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><a href="https://instagram.com/anksboutique" target="_blank" rel="noreferrer" className="hover:text-primary-foreground transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Facebook</a></li>
            <li><a href="#" className="hover:text-primary-foreground transition-colors">Pinterest</a></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-primary-foreground/10 text-sm text-primary-foreground/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Ank's Boutique. Toate drepturile rezervate.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary-foreground transition-colors">Politica de Confidențialitate</a>
          <a href="#" className="hover:text-primary-foreground transition-colors">Termeni și Condiții</a>
        </div>
      </div>
    </footer>
  );
}
