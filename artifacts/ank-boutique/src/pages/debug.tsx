import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { useEffect, useState } from "react";

function formatStatus(status: boolean | null | undefined) {
  if (status === true) return "Da";
  if (status === false) return "Nu";
  return "Necunoscut";
}

export default function Debug() {
  const [netopiaStatus, setNetopiaStatus] = useState<any>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restartStatus, setRestartStatus] = useState<string | null>(null);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        const [netopiaRes, healthRes] = await Promise.all([
          fetch("/api/debug/netopia-config"),
          fetch("/api/healthz"),
        ]);

        const netopiaJson = netopiaRes.ok ? await netopiaRes.json() : { error: await netopiaRes.text() };
        const healthJson = healthRes.ok ? await healthRes.json() : { error: await healthRes.text() };

        setNetopiaStatus(netopiaJson);
        setHealthStatus(healthJson);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : String(fetchError));
      } finally {
        setLoading(false);
      }
    }

    fetchDiagnostics();
  }, []);

  async function handleRestartApi() {
    setRestartLoading(true);
    setRestartStatus(null);

    try {
      const response = await fetch("/api/debug/restart-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setRestartStatus(data.message ?? "Restart command triggered.");
    } catch (restartError) {
      setRestartStatus(`Eroare: ${restartError instanceof Error ? restartError.message : String(restartError)}`);
    } finally {
      setRestartLoading(false);
    }
  }

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
              <h1 className="text-4xl md:text-5xl font-serif">Verificare sistem</h1>
              <p className="mt-4 text-muted-foreground">
                Această pagină verifică starea Netopia și starea API-ului.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Netopia</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Diagnostic rapid pentru configurația Netopia de pe server.
                </p>

                <a
                  href="/api/debug/netopia-config"
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-background transition hover:bg-foreground/90"
                >
                  Verifică configurația Netopia
                </a>

                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Sandbox:</strong> {formatStatus(netopiaStatus?.sandbox)}
                  </div>
                  <div>
                    <strong>NODE_ENV:</strong> {netopiaStatus?.nodeEnv ?? "Necunoscut"}
                  </div>
                  <div>
                    <strong>Public key valid:</strong> {formatStatus(netopiaStatus?.publicKeyValid)}
                  </div>
                  <div>
                    <strong>Private key valid:</strong> {formatStatus(netopiaStatus?.privateKeyValid)}
                  </div>
                </div>
                {netopiaStatus?.error ? (
                  <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                    <strong>Netopia fetch error:</strong> {String(netopiaStatus.error)}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-border bg-background/80 p-8 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">API Health</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Endpoint de sănătate pentru API.
                </p>

                <a
                  href="/api/healthz"
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-4 text-sm font-semibold text-background transition hover:bg-foreground/90"
                >
                  Verifică starea API
                </a>

                <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <div>
                    <strong>Status:</strong> {healthStatus?.status ?? "Necunoscut"}
                  </div>
                  {healthStatus?.error ? (
                    <div className="text-red-600">{healthStatus.error}</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-muted p-8">
              <h2 className="text-xl font-semibold mb-3">Stare curentă</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Se încarcă diagnosticul...</p>
              ) : error ? (
                <p className="text-sm text-red-600">Eroare: {error}</p>
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Diagnoza a fost executată. Dacă apare o problemă, verifică pagina de backend sau restartul serverului.</p>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleRestartApi}
                  disabled={restartLoading}
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {restartLoading ? "Restart în curs..." : "Repornește API server"}
                </button>
                {restartStatus ? (
                  <p className="text-sm text-muted-foreground">{restartStatus}</p>
                ) : null}
              </div>

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
