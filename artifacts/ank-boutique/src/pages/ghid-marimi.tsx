import { Ruler } from "lucide-react";
import { Layout } from "@/components/layout/Layout";

const sizes = [
  { size: "XS", ro: "34–36", bust: "80–84", talie: "62–66", solduri: "86–90" },
  { size: "S",  ro: "36–38", bust: "84–88", talie: "66–70", solduri: "90–94" },
  { size: "M",  ro: "38–40", bust: "88–92", talie: "70–74", solduri: "94–98" },
  { size: "L",  ro: "40–42", bust: "92–96", talie: "74–78", solduri: "98–102" },
  { size: "XL", ro: "42–44", bust: "96–100", talie: "78–82", solduri: "102–106" },
  { size: "XXL",ro: "44–46", bust: "100–106", talie: "82–88", solduri: "106–112" },
];

const shoeSizes = [
  { eu: "36", cm: "23.0" },
  { eu: "37", cm: "23.7" },
  { eu: "38", cm: "24.3" },
  { eu: "39", cm: "25.0" },
  { eu: "40", cm: "25.7" },
  { eu: "41", cm: "26.3" },
];

export default function GhidMarimi() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-serif mb-4">Ghid de Mărimi</h1>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Fiecare piesă Ank's Boutique este croită cu atenție. Folosește ghidul de mai jos pentru a găsi mărimea perfectă pentru silueta ta.
          </p>
        </div>

        {/* How to measure */}
        <section className="mb-16">
          <h2 className="text-sm font-medium uppercase tracking-widest mb-8 flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Cum te măsori corect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            <div className="bg-background p-6">
              <p className="font-serif text-2xl mb-3">Bust</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ține banda de măsurat orizontal, în cel mai lat punct al bustului tău, peste omoplați și sub axile. Respiră normal și nu strânge.
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="font-serif text-2xl mb-3">Talie</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Măsoară în punctul cel mai îngust al taliei tale, de obicei la aproximativ 2–3 cm deasupra buricului. Nu trage de bandă.
              </p>
            </div>
            <div className="bg-background p-6">
              <p className="font-serif text-2xl mb-3">Șolduri</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Măsoară în cel mai lat punct al șoldurilor și feselor, ținând picioarele apropiate. De obicei la aproximativ 20–23 cm sub talie.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Toate măsurătorile sunt exprimate în centimetri (cm). Recomandăm să te măsori în lenjerie sau haine subțiri.
          </p>
        </section>

        {/* Clothing size table */}
        <section className="mb-16">
          <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Îmbrăcăminte — Tabel de mărimi</h2>
          <div className="border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Mărime Int'l</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Mărime RO</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Bust (cm)</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Talie (cm)</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Șolduri (cm)</th>
                </tr>
              </thead>
              <tbody>
                {sizes.map((row, i) => (
                  <tr key={row.size} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                    <td className="px-5 py-3 font-medium">{row.size}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.ro}</td>
                    <td className="px-5 py-3">{row.bust}</td>
                    <td className="px-5 py-3">{row.talie}</td>
                    <td className="px-5 py-3">{row.solduri}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Shoe size table */}
        <section className="mb-16">
          <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Încălțăminte — Tabel de mărimi</h2>
          <div className="border border-border overflow-hidden max-w-xs">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Mărime EU</th>
                  <th className="text-left px-5 py-3 text-xs uppercase tracking-widest font-medium text-muted-foreground">Lungime picior (cm)</th>
                </tr>
              </thead>
              <tbody>
                {shoeSizes.map((row, i) => (
                  <tr key={row.eu} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/30"}`}>
                    <td className="px-5 py-3 font-medium">{row.eu}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.cm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Tips */}
        <section className="bg-accent/20 border border-border p-8">
          <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Sfaturi pentru alegerea mărimii</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-serif text-foreground shrink-0">→</span>
              <span>Dacă măsurătorile tale se află între două mărimi, alege <strong className="text-foreground">mărimea mai mare</strong> pentru un confort optim.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-foreground shrink-0">→</span>
              <span>Rochiile și bluzele cu corsaj definit se croiesc de obicei după <strong className="text-foreground">dimensiunea bustului</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-foreground shrink-0">→</span>
              <span>Fustele și pantalonii urmează <strong className="text-foreground">dimensiunea taliei și șoldurilor</strong>.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-foreground shrink-0">→</span>
              <span>Fiecare produs are indicații specifice de croială în descriere — uneori recomandăm o mărime în plus sau minus față de tabelul general.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-foreground shrink-0">→</span>
              <span>Nu ești sigură? Scrie-ne pe WhatsApp — te ajutăm să alegi mărimea potrivită înainte de comandă.</span>
            </li>
          </ul>
        </section>
      </div>
    </Layout>
  );
}
