import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-medium uppercase tracking-widest mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermeniConditii() {
  return (
    <><Helmet><title>Termeni si Conditii | Anks Boutique</title><meta name="robots" content="noindex, follow" /></Helmet><Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-4">Termeni și Condiții</h1>
          <p className="text-sm text-muted-foreground">Ultima actualizare: 25 iunie 2025</p>
        </div>

        <div className="bg-accent/20 border border-border p-5 mb-10 text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Citește cu atenție.</strong> Prin plasarea unei comenzi sau utilizarea site-ului <strong className="text-foreground">anksboutique.ro</strong>, ești de acord cu acești termeni și condiții. Dacă nu ești de acord, te rugăm să nu utilizezi site-ul.
        </div>

        <div className="prose-sm">
          <Section title="1. Informații despre operator">
            <p>
              Site-ul <strong className="text-foreground">anksboutique.ro</strong> este operat de <strong className="text-foreground">Ank's Boutique</strong>, magazin de modă online cu sediul în România.
            </p>
            <ul className="list-none space-y-1 mt-2">
              <li><strong className="text-foreground">Email:</strong> contact@anksboutique.ro</li>
              <li><strong className="text-foreground">WhatsApp:</strong> +40 720 180 186</li>
              <li><strong className="text-foreground">Instagram:</strong> @anksboutique</li>
            </ul>
            <p>Prezentele condiții sunt guvernate de legislația română, în special de:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>OUG nr. 34/2014 privind drepturile consumatorilor (transpunerea Directivei 2011/83/UE)</li>
              <li>Legea nr. 296/2004 — Codul consumului</li>
              <li>Legea nr. 365/2002 privind comerțul electronic</li>
              <li>Codul civil român</li>
            </ul>
          </Section>

          <Section title="2. Produse și disponibilitate">
            <p>
              Ne străduim să afișăm produsele cât mai fidel realității — culori, texturi, dimensiuni. Totuși, reprezentarea pe ecran poate varia ușor față de produsul fizic, în funcție de calibrarea monitorului tău.
            </p>
            <p>
              Toate produsele sunt oferite în limita stocului disponibil. Dacă un produs comandat nu este disponibil, te vom contacta imediat pentru a oferi o alternativă sau a procesa rambursarea integrală.
            </p>
            <p>
              Prețurile afișate includ TVA și sunt exprimate în <strong className="text-foreground">Lei (RON)</strong>. Ne rezervăm dreptul de a modifica prețurile fără notificare prealabilă, modificările neafectând comenzile deja confirmate.
            </p>
          </Section>

          <Section title="3. Plasarea comenzii">
            <p>O comandă se consideră plasată și acceptată în momentul primirii email-ului de confirmare. Prin plasarea comenzii:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Confirmi că ai cel puțin 18 ani sau că ai acordul părintelui/tutorelui</li>
              <li>Garantezi că datele furnizate sunt corecte și complete</li>
              <li>Ești de acord cu prețul, produsele selectate și costul livrării</li>
            </ul>
            <p>
              Ne rezervăm dreptul de a anula orice comandă în caz de erori tehnice (preț incorect, stoc epuizat) sau suspiciune de fraudă, cu rambursarea integrală a sumelor achitate.
            </p>
          </Section>

          <Section title="4. Prețuri și plată">
            <p>Plata se realizează online, prin card bancar (Visa, Mastercard), procesată securizat de <strong className="text-foreground">Netopia Payments</strong> (certificat PCI-DSS Level 1). Noi nu stocăm niciodată datele cardului tău.</p>
            <p>Comanda este procesată doar după confirmarea plății. Vei primi factura fiscală pe email odată cu confirmarea comenzii.</p>
          </Section>

          <Section title="5. Livrare">
            <p>Livrăm exclusiv pe teritoriul României prin Fan Courier și DPD. Termenele orientative:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-foreground">Standard:</strong> 3–5 zile lucrătoare · gratuit pentru comenzi ≥ 300 RON, altfel 15 RON</li>
              <li><strong className="text-foreground">Expresă:</strong> 24–48 ore · 25 RON</li>
            </ul>
            <p>
              Termenele de livrare sunt orientative și pot fi afectate de factori externi (greve, condiții meteorologice, sărbători legale). Nu răspundem pentru întârzieri cauzate de curier sau evenimente de forță majoră.
            </p>
            <p>
              Riscul de pierdere sau deteriorare a produselor se transferă cumpărătorului din momentul predării coletului. Te rugăm să verifici integritatea coletului la primire.
            </p>
          </Section>

          <Section title="6. Dreptul de retragere (retur)">
            <p>
              Conform <strong className="text-foreground">OUG 34/2014</strong>, ai dreptul de a te retrage din contract în termen de <strong className="text-foreground">14 zile calendaristice</strong> de la primirea produsului, fără a oferi nicio justificare. Ank's Boutique extinde această perioadă la <strong className="text-foreground">30 de zile</strong>.
            </p>
            <p>
              Pentru a exercita dreptul de retragere, contactează-ne la <strong className="text-foreground">contact@anksboutique.ro</strong> sau WhatsApp cu numărul comenzii înainte de expirarea termenului.
            </p>
            <p><strong className="text-foreground">Condiții pentru retur:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Produsul este în stare originală, nepurtat, nemodificat</li>
              <li>Etichetele originale sunt intacte</li>
              <li>Produsul este ambalat adecvat pentru transport</li>
            </ul>
            <p><strong className="text-foreground">Excepții de la dreptul de retragere</strong> (conform art. 16 OUG 34/2014):</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Produse personalizate sau confecționate la cerere</li>
              <li>Produse care nu pot fi returnate din motive de igienă (lenjerie intimă, bijuterii pentru urechi)</li>
              <li>Produse deteriorate din vina cumpărătorului</li>
            </ul>
            <p>
              Rambursarea se efectuează în maxim <strong className="text-foreground">14 zile</strong> de la primirea produsului returnat, prin aceeași metodă de plată. Costul returului este suportat de Ank's Boutique (etichetă prepaid).
            </p>
          </Section>

          <Section title="7. Garanții legale">
            <p>
              Toate produsele beneficiază de garanția legală de conformitate de <strong className="text-foreground">2 ani</strong>, conform Legii nr. 449/2003 (transpunerea Directivei 1999/44/CE). În cazul unui defect de conformitate, ai dreptul la reparare, înlocuire sau, dacă acestea nu sunt posibile, la reducerea prețului sau rezoluțiunea contractului.
            </p>
            <p>
              Pentru a reclama un defect, contactează-ne în termen de 2 luni de la descoperire la <strong className="text-foreground">contact@anksboutique.ro</strong>.
            </p>
          </Section>

          <Section title="8. Proprietate intelectuală">
            <p>
              Tot conținutul site-ului — texte, imagini, fotografii, logo, design, denumiri comerciale — este proprietatea <strong className="text-foreground">Ank's Boutique</strong> sau este utilizat cu acordul titularilor de drepturi. Este interzisă reproducerea, copierea sau distribuirea fără acordul scris prealabil.
            </p>
          </Section>

          <Section title="9. Limitarea răspunderii">
            <p>Ank's Boutique nu răspunde pentru:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Daune indirecte, incidentale sau de profit nerealizat</li>
              <li>Întreruperi temporare ale site-ului din motive tehnice</li>
              <li>Utilizarea necorespunzătoare a produselor de către cumpărător</li>
              <li>Conținutul site-urilor terțe accesate prin linkuri de pe site-ul nostru</li>
            </ul>
            <p>Răspunderea noastră maximă este limitată la valoarea comenzii afectate.</p>
          </Section>

          <Section title="10. Forța majoră">
            <p>
              Niciuna dintre părți nu va fi răspunzătoare pentru neexecutarea obligațiilor contractuale cauzată de evenimente de forță majoră (calamități, greve generale, restricții guvernamentale, pandemii etc.). Partea afectată va notifica cealaltă parte în cel mai scurt timp posibil.
            </p>
          </Section>

          <Section title="11. Soluționarea litigiilor">
            <p>
              Orice litigiu va fi soluționat pe cale amiabilă în primul rând. Dacă acest lucru nu este posibil, te poți adresa:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-foreground">ANPC SAL</strong> (Soluționarea Alternativă a Litigiilor): <a href="https://reclamatiisal.anpc.ro" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">reclamatiisal.anpc.ro</a></li>
              <li><strong className="text-foreground">Platforma SOL</strong> (UE): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">ec.europa.eu/consumers/odr</a></li>
              <li>Instanțele judecătorești competente din România (legea română aplicabilă)</li>
            </ul>
          </Section>

          <Section title="12. Modificări ale termenilor">
            <p>
              Ne rezervăm dreptul de a modifica prezentele condiții. Versiunea actualizată va fi publicată pe site cu indicarea datei revizuirii. Continuarea utilizării site-ului după publicarea modificărilor constituie acceptarea acestora.
            </p>
          </Section>

          <div className="border border-border p-6 text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2">Ai întrebări despre termenii noștri?</p>
            <Link href="/contact" className="text-sm font-medium underline underline-offset-2 hover:text-muted-foreground transition-colors">
              Contactează-ne
            </Link>
          </div>
        </div>
      </div>
    </Layout></>
  );
}
