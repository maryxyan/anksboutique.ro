import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 — Pagina negăsită | Anks Boutique</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4 border-border/40 shadow-none">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-6" strokeWidth={1} />
            <h1 className="text-6xl font-serif mb-4">404</h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Pagina pe care o cauți nu există sau a fost mutată.
            </p>
            <Link href="/" className="border-b border-foreground pb-1 text-sm uppercase tracking-widest font-medium">
              Înapoi Acasă
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
