import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";

export default function Debug() {
  return (
    <>
      <Helmet>
        <title>Debug | Anks Boutique</title>
        <meta name="description" content="Debug page for Netopia configuration and startup diagnostics." />
        <meta property="og:title" content="Debug | Anks Boutique" />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground mb-4">Diagnostică</p>
              <h1 className="text-4xl md:text-5xl font-serif">Verificare Netopia</h1>
              <p className="mt-4 text-muted-foreground">
                Apasă linkul de mai jos pentru a vedea starea actuală a configurației Netopia pe server.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Endpoint de diagnostic</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Acesta verifică dacă serverul folosește modul de producție și dacă cheile Netopia sunt încărcate corect.
              </p>

              <a
                href="/api/debug/netopia-config"
                className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-background transition hover:bg-foreground/90"
              >
                Verifică configurația Netopia
              </a>

              <p className="mt-6 text-xs text-muted-foreground">
                Dacă primești un răspuns JSON, atunci codul de diagnostic rulează corect.
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-muted p-8">
              <h2 className="text-xl font-semibold mb-3">Notă</h2>
              <p className="text-sm text-muted-foreground">
                Dacă nu vezi această pagină sau endpointul returnează eroare, asigură-te că serverul a fost reconstruit și repornit cu ultima versiune a codului.
              </p>
              <Link href="/" className="mt-4 inline-block text-sm font-medium text-foreground underline">
                Înapoi la pagina principală
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}
