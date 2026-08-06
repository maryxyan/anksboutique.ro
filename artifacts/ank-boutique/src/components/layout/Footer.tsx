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
            <li><Link href="/livrare" className="hover:text-primary-foreground transition-colors">Livrare & Retururi</Link></li>
            <li><Link href="/ghid-marimi" className="hover:text-primary-foreground transition-colors">Ghid de Mărimi</Link></li>
            <li><Link href="/faq" className="hover:text-primary-foreground transition-colors">Întrebări Frecvente</Link></li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold tracking-wider uppercase">Social</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/70">
            <li><a href="https://www.instagram.com/anks_boutique?igsh=b2I4eG9iYWZhamxp" target="_blank" rel="noreferrer" className="hover:text-primary-foreground transition-colors">Instagram</a></li>
            <li><a href="https://www.tiktok.com/@anks.boutique5?_r=1&_t=ZN-97eHB2Du8ak" target="_blank" rel="noreferrer" className="hover:text-primary-foreground transition-colors">TikTok</a></li>
          </ul>
        </div>
      </div>
      {/* ANPC & SOL compliance badges */}
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-primary-foreground/10">
        <p className="text-xs text-primary-foreground/70 uppercase tracking-widest mb-4">Soluționarea litigiilor</p>
        <div className="flex flex-wrap gap-3 items-stretch">
          {/* ANPC SAL badge */}
          <a
            href="https://reclamatiisal.anpc.ro/"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-stretch border border-primary-foreground/20 hover:border-primary-foreground/50 transition-colors group overflow-hidden"
          >
            <div className="bg-[#003DA5] flex items-center justify-center px-3 py-2.5 shrink-0">
              <span className="text-white font-bold text-xs tracking-widest leading-none">ANPC</span>
            </div>
            <div className="px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-primary-foreground/90 uppercase tracking-wider leading-none">SAL</span>
              <span className="text-[9px] text-primary-foreground/50 mt-0.5 leading-tight">Soluționarea Alternativă<br />a Litigiilor</span>
            </div>
          </a>

          {/* SOL / ODR badge */}
          <a
            href="https://ec.europa.eu/consumers/odr/main/index.cfm?event=main.home.chooseLanguage"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-stretch border border-primary-foreground/20 hover:border-primary-foreground/50 transition-colors group overflow-hidden"
          >
            <div className="bg-[#003399] flex items-center justify-center px-3 py-2.5 shrink-0">
              {/* EU stars */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="10" fill="#003399" />
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x = 11 + 7.5 * Math.cos(angle);
                  const y = 11 + 7.5 * Math.sin(angle);
                  return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="4" fill="#FFCC00">
                      ★
                    </text>
                  );
                })}
              </svg>
            </div>
            <div className="px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-primary-foreground/90 uppercase tracking-wider leading-none">SOL</span>
              <span className="text-[9px] text-primary-foreground/50 mt-0.5 leading-tight">Soluționarea Online<br />a Litigiilor</span>
            </div>
          </a>

          {/* bg-black.png badge */}
          <img
            src="/bg-black.png"
            alt="Ank's Boutique"
            className="h-auto w-auto max-h-16 ml-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
        <p className="text-xs text-primary-foreground/70 mt-3 leading-relaxed max-w-lg">
          Conform OUG 34/2014 și Regulamentului (UE) nr. 524/2013, consumatorii pot apela la proceduri de soluționare alternativă a litigiilor prin ANPC sau platforma SOL a Comisiei Europene.
        </p>
      </div>
      
      <div className="container mx-auto px-4 mt-8 pt-6 border-t border-primary-foreground/10 text-sm text-primary-foreground/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p>&copy; {new Date().getFullYear()} Ank's Boutique. Toate drepturile rezervate.</p>
        <div className="flex gap-4">
          <Link href="/confidentialitate" className="hover:text-primary-foreground transition-colors">Politica de Confidențialitate</Link>
          <Link href="/termeni" className="hover:text-primary-foreground transition-colors">Termeni și Condiții</Link>
        </div>
      </div>
    </footer>
  );
}
