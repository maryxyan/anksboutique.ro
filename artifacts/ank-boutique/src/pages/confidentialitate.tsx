import { Layout } from "@/components/layout/Layout";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-medium uppercase tracking-widest mb-4 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function PoliticaConfidentialitate() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif mb-4">Politica de Confidențialitate</h1>
          <p className="text-sm text-muted-foreground">Ultima actualizare: 25 iunie 2025</p>
        </div>

        <div className="prose-sm">
          <Section title="1. Operatorul de date cu caracter personal">
            <p>
              <strong className="text-foreground">Ank's Boutique</strong> (denumit în continuare „Operatorul", „noi", „nouă") este operatorul datelor cu caracter personal colectate prin intermediul site-ului <strong className="text-foreground">anksboutique.ro</strong>.
            </p>
            <p>
              Date de contact: <strong className="text-foreground">contact@anksboutique.ro</strong> · WhatsApp: <strong className="text-foreground">+40 700 000 000</strong>
            </p>
            <p>
              Prezenta politică este elaborată în conformitate cu <strong className="text-foreground">Regulamentul (UE) 2016/679 (GDPR)</strong> și cu legislația națională aplicabilă (Legea nr. 190/2018).
            </p>
          </Section>

          <Section title="2. Ce date colectăm și de ce">
            <p>Colectăm datele strict necesare pentru funcționarea magazinului:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-border mt-3">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-foreground border-b border-border">Categorie date</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground border-b border-border">Exemple</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground border-b border-border">Scopul prelucrării</th>
                    <th className="text-left px-3 py-2 font-medium text-foreground border-b border-border">Temei legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-3 py-2">Date de identificare</td>
                    <td className="px-3 py-2">Nume, prenume</td>
                    <td className="px-3 py-2">Procesarea și livrarea comenzilor</td>
                    <td className="px-3 py-2">Executarea contractului (art. 6(1)(b) GDPR)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Date de contact</td>
                    <td className="px-3 py-2">Email, telefon</td>
                    <td className="px-3 py-2">Confirmări, notificări comandă</td>
                    <td className="px-3 py-2">Executarea contractului</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Date de livrare</td>
                    <td className="px-3 py-2">Adresă, județ, cod poștal</td>
                    <td className="px-3 py-2">Livrarea coletului</td>
                    <td className="px-3 py-2">Executarea contractului</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Date de navigare</td>
                    <td className="px-3 py-2">Cookie-uri de sesiune, ID sesiune</td>
                    <td className="px-3 py-2">Coș de cumpărături, preferințe</td>
                    <td className="px-3 py-2">Interes legitim (art. 6(1)(f) GDPR)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Date newsletter</td>
                    <td className="px-3 py-2">Email, nume</td>
                    <td className="px-3 py-2">Trimiterea ofertelor comerciale</td>
                    <td className="px-3 py-2">Consimțământ (art. 6(1)(a) GDPR)</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Date analiză (opțional)</td>
                    <td className="px-3 py-2">Pagini vizitate, sursa traficului</td>
                    <td className="px-3 py-2">Îmbunătățirea site-ului</td>
                    <td className="px-3 py-2">Consimțământ (cookie-uri)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3">Nu colectăm categorii speciale de date (date medicale, biometrice, rasiale etc.).</p>
          </Section>

          <Section title="3. Cookie-uri">
            <p>Utilizăm cookie-uri pentru funcționarea corectă a site-ului. Detalii complete în <strong className="text-foreground">Politica de cookie-uri</strong> afișată la prima vizită.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-foreground">Cookie-uri necesare</strong> — active permanent; nu necesită consimțământ (sesiune, coș)</li>
              <li><strong className="text-foreground">Cookie-uri de analiză</strong> — active doar cu consimțământul tău explicit</li>
              <li><strong className="text-foreground">Cookie-uri de marketing</strong> — active doar cu consimțământul tău explicit</li>
            </ul>
            <p>Poți retrage consimțământul oricând prin linkul „setări cookie" din orice pagină a site-ului.</p>
          </Section>

          <Section title="4. Cât timp păstrăm datele">
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-foreground">Date comenzi și facturi</strong> — 10 ani (obligație legală conform Codului fiscal)</li>
              <li><strong className="text-foreground">Date cont / sesiune</strong> — pe durata sesiunii + 12 luni</li>
              <li><strong className="text-foreground">Date newsletter</strong> — până la retragerea consimțământului</li>
              <li><strong className="text-foreground">Date mesaje contact</strong> — 3 ani de la ultima interacțiune</li>
              <li><strong className="text-foreground">Date analiză</strong> — maxim 26 luni (anonimizate)</li>
            </ul>
            <p>La expirarea termenului, datele sunt șterse sau anonimizate ireversibil.</p>
          </Section>

          <Section title="5. Cu cine împărțim datele">
            <p>Nu vindem datele tale. Le transmitem exclusiv partenerilor necesari pentru executarea comenzilor:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-foreground">Fan Courier / DPD România</strong> — pentru livrarea coletelor (nume, adresă, telefon)</li>
              <li><strong className="text-foreground">Netopia Payments</strong> — procesator de plăți (date tranzacție; noi NU stocăm datele cardului)</li>
              <li><strong className="text-foreground">Furnizor hosting</strong> — Replit Inc. (SUA) cu garanții adecvate conform art. 46 GDPR</li>
            </ul>
            <p>Toți partenerii sunt obligați contractual să protejeze datele tale conform GDPR.</p>
          </Section>

          <Section title="6. Transferuri internaționale">
            <p>
              Infrastructura site-ului este găzduită de <strong className="text-foreground">Replit Inc.</strong> (SUA). Transferul este acoperit de Clauze Contractuale Standard (SCC) aprobate de Comisia Europeană, asigurând un nivel adecvat de protecție.
            </p>
          </Section>

          <Section title="7. Drepturile tale">
            <p>Conform GDPR, beneficiezi de următoarele drepturi, exercitabile gratuit:</p>
            <ul className="space-y-2 mt-2">
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul de acces</strong> — poți solicita o copie a datelor pe care le deținem despre tine</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul la rectificare</strong> — corectarea datelor inexacte sau incomplete</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul la ștergere</strong> — „dreptul de a fi uitat", cu excepțiile prevăzute de lege</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul la restricționarea prelucrării</strong> — limitarea utilizării datelor în anumite circumstanțe</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul la portabilitate</strong> — primirea datelor în format structurat (JSON, CSV)</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul de opoziție</strong> — opoziție față de prelucrarea bazată pe interes legitim sau marketing direct</span></li>
              <li className="flex gap-2"><span className="text-foreground font-medium shrink-0">→</span><span><strong className="text-foreground">Dreptul de retragere a consimțământului</strong> — fără a afecta prelucrările anterioare</span></li>
            </ul>
            <p className="mt-3">
              Pentru exercitarea oricărui drept, trimite un email la <strong className="text-foreground">contact@anksboutique.ro</strong> cu subiectul „Cerere GDPR". Răspundem în maxim <strong className="text-foreground">30 de zile calendaristice</strong>.
            </p>
          </Section>

          <Section title="8. Securitatea datelor">
            <p>Implementăm măsuri tehnice și organizatorice adecvate pentru protejarea datelor:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Comunicații criptate HTTPS (TLS 1.2+) pe tot site-ul</li>
              <li>Plățile sunt procesate exclusiv prin Netopia Payments (certificat PCI-DSS) — noi nu stocăm niciodată datele cardului</li>
              <li>Accesul la datele de comandă este restricționat strict personalului autorizat</li>
              <li>Parole stocate exclusiv în formă criptată (hash)</li>
            </ul>
            <p>În cazul unui incident de securitate care afectează datele tale, vom notifica ANSPDCP în 72 ore și te vom informa direct dacă există risc ridicat.</p>
          </Section>

          <Section title="9. Autoritatea de supraveghere">
            <p>
              Dacă consideri că prelucrarea datelor tale încalcă GDPR, ai dreptul de a depune o plângere la:
            </p>
            <div className="border border-border p-4 mt-3 text-xs space-y-1">
              <p className="font-medium text-foreground">Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)</p>
              <p>B-dul G-ral. Gheorghe Magheru nr. 28–30, Sector 1, 010336 București</p>
              <p>Email: <strong className="text-foreground">anspdcp@dataprotection.ro</strong></p>
              <p>Web: <a href="https://www.dataprotection.ro" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">www.dataprotection.ro</a></p>
            </div>
          </Section>

          <Section title="10. Modificări ale prezentei politici">
            <p>
              Ne rezervăm dreptul de a actualiza această politică ori de câte ori este necesar. Modificările semnificative vor fi comunicate prin email sau prin notificare pe site, cu cel puțin 30 de zile înainte de intrarea în vigoare.
            </p>
            <p>Data ultimei revizuiri: <strong className="text-foreground">25 iunie 2025</strong>.</p>
          </Section>

          <div className="border border-border p-6 text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2">Ai întrebări despre datele tale personale?</p>
            <p className="text-sm font-medium">contact@anksboutique.ro</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
