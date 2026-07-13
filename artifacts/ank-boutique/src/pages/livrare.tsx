import { Truck, RotateCcw, Clock, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";

export default function LivrareRetururi() {
  return (
    <><Helmet><title>Livrare si Retururi | Anks Boutique</title><meta name="robots" content="noindex, follow" /></Helmet><Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Livrare & Retururi</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Livrăm cu grijă fiecare comandă. Dacă nu ești mulțumită, returul este simplu și gratuit.
          </p>
        </div>

        {/* Delivery section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Truck className="w-5 h-5" />
            <h2 className="text-xl font-serif uppercase tracking-widest">Livrare</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            <div className="bg-background p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
                <Clock className="w-4 h-4" />
                Standard
              </div>
              <p className="text-3xl font-serif">Gratuit</p>
              <p className="text-sm text-muted-foreground">pentru comenzi peste 300 RON</p>
              <p className="text-sm text-muted-foreground">3–5 zile lucrătoare</p>
            </div>
            <div className="bg-background p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
                <Clock className="w-4 h-4" />
                Expresă
              </div>
              <p className="text-3xl font-serif">25 RON</p>
              <p className="text-sm text-muted-foreground">livrare în 24–48 ore</p>
              <p className="text-sm text-muted-foreground">disponibilă pentru orice comandă</p>
            </div>
            <div className="bg-background p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest">
                <MapPin className="w-4 h-4" />
                Standard
              </div>
              <p className="text-3xl font-serif">15 RON</p>
              <p className="text-sm text-muted-foreground">pentru comenzi sub 300 RON</p>
              <p className="text-sm text-muted-foreground">3–5 zile lucrătoare</p>
            </div>
          </div>

          <div className="mt-8 space-y-4 text-sm text-muted-foreground border border-border p-6">
            <p className="font-medium text-foreground">Informații importante despre livrare:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Comenzile plasate înainte de ora 14:00 sunt procesate în aceeași zi lucrătoare.</li>
              <li>Livrăm prin Fan Courier și DPD pe tot teritoriul României.</li>
              <li>Vei primi un email cu numărul de urmărire imediat ce coletul este preluat de curier.</li>
              <li>Livrarea se face la adresa indicată în comandă — ne asigurăm că ambalajul este discret și elegant.</li>
              <li>Momentan livrăm exclusiv în România.</li>
            </ul>
          </div>
        </section>

        {/* Returns section */}
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <RotateCcw className="w-5 h-5" />
            <h2 className="text-xl font-serif uppercase tracking-widest">Retururi</h2>
          </div>

          <div className="bg-accent/20 border border-border p-6 mb-8">
            <p className="text-sm font-medium uppercase tracking-widest mb-2">Politica noastră de retur</p>
            <p className="text-2xl font-serif mb-2">30 de zile · Gratuit · Fără întrebări</p>
            <p className="text-sm text-muted-foreground">
              Conform legislației UE (OUG 34/2014), ai dreptul de a returna orice produs în termen de 14 zile de la primire.
              Noi îți oferim 30 de zile pentru confortul tău.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest mb-4">Cum faci un retur</h3>
              <ol className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="font-serif text-foreground font-medium w-5 shrink-0">1.</span>
                  <span>Contactează-ne pe WhatsApp sau email cu numărul comenzii tale și motivul returului.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-serif text-foreground font-medium w-5 shrink-0">2.</span>
                  <span>Vei primi un email cu eticheta de retur prepaid — o tipărești și o lipești pe colet.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-serif text-foreground font-medium w-5 shrink-0">3.</span>
                  <span>Predai coletul la orice punct Fan Courier din România.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-serif text-foreground font-medium w-5 shrink-0">4.</span>
                  <span>Rambursăm suma integral în 5–7 zile lucrătoare de la primirea coletului, prin metoda de plată originală.</span>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-medium uppercase tracking-widest mb-4">Condiții retur</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span>Produsul este în stare originală, nepurtat și nemodificat</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span>Etichetele originale sunt intacte și atașate</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600 shrink-0">✓</span>
                  <span>Returul este inițiat în termen de 30 de zile de la primire</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive shrink-0">✗</span>
                  <span>Lenjerie intimă, bijuterii și accesorii personale nu pot fi returnate din motive igienice</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-destructive shrink-0">✗</span>
                  <span>Produsele personalizate sau la comandă nu sunt eligibile pentru retur</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-border">
                <a
                  href="/retur"
                  className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
                >
                  <RotateCcw className="w-4 h-4" />
                  Formular Retur
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Payment info */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="w-5 h-5" />
            <h2 className="text-xl font-serif uppercase tracking-widest">Rambursare</h2>
          </div>
          <div className="border border-border p-6 text-sm text-muted-foreground space-y-3">
            <p>Rambursările sunt procesate în termen de <strong className="text-foreground">5–7 zile lucrătoare</strong> de la primirea și verificarea produsului returnat.</p>
            <p>Suma va fi returnată prin aceeași metodă de plată utilizată la achiziție (card bancar sau transfer online).</p>
            <p>Costul livrării inițiale nu este rambursabil, cu excepția situațiilor în care produsul a fost livrat defect sau incorect.</p>
            <div className="flex items-start gap-2 pt-2 border-t border-border mt-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Ai întrebări? Suntem disponibili pe <strong className="text-foreground">WhatsApp</strong> sau la <strong className="text-foreground">contact@anksboutique.ro</strong>. Răspundem în maxim 24 ore.</p>
            </div>
          </div>
        </section>
      </div>
    </Layout></>
  );
}
