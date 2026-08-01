import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CookieConsent from "@/components/CookieConsent";

// Critical path — loaded eagerly
import Home from "@/pages/home";
import Shop from "@/pages/shop";

// Lazy-loaded routes (non-critical)
const Product = lazy(() => import("@/pages/product"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const Wishlist = lazy(() => import("@/pages/wishlist"));
const Contact = lazy(() => import("@/pages/contact"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const Account = lazy(() => import("@/pages/account"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));

const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const AdminProducts = lazy(() => import("@/pages/admin/products"));
const AdminProductEdit = lazy(() => import("@/pages/admin/product-edit"));
const AdminOrders = lazy(() => import("@/pages/admin/orders"));
const AdminInventory = lazy(() => import("@/pages/admin/inventory"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminLabels = lazy(() => import("@/pages/admin/labels"));
const Debug = lazy(() => import("@/pages/debug"));
const Retur = lazy(() => import("@/pages/retur"));
const LivrareRetururi = lazy(() => import("@/pages/livrare"));
const GhidMarimi = lazy(() => import("@/pages/ghid-marimi"));
const FAQ = lazy(() => import("@/pages/faq"));
const PoliticaConfidentialitate = lazy(() => import("@/pages/confidentialitate"));
const TermeniConditii = lazy(() => import("@/pages/termeni"));

const queryClient = new QueryClient();

function SuspenseWrapper({ Component }: { Component: React.LazyExoticComponent<any> }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  );
}

function PageSkeleton() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Se încarcă...</p>
      </div>
    </div>
  );
}

/** Scrolls to the top of the page on every route change */
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id"><SuspenseWrapper Component={Product} /></Route>
      <Route path="/cart"><SuspenseWrapper Component={Cart} /></Route>
      <Route path="/checkout"><SuspenseWrapper Component={Checkout} /></Route>
      <Route path="/wishlist"><SuspenseWrapper Component={Wishlist} /></Route>
      <Route path="/contact"><SuspenseWrapper Component={Contact} /></Route>
      <Route path="/login"><SuspenseWrapper Component={Login} /></Route>
      <Route path="/register"><SuspenseWrapper Component={Register} /></Route>
      <Route path="/account"><SuspenseWrapper Component={Account} /></Route>
      <Route path="/forgot-password"><SuspenseWrapper Component={ForgotPassword} /></Route>
      <Route path="/reset-password"><SuspenseWrapper Component={ResetPassword} /></Route>

      <Route path="/retur"><SuspenseWrapper Component={Retur} /></Route>
      <Route path="/livrare"><SuspenseWrapper Component={LivrareRetururi} /></Route>
      <Route path="/ghid-marimi"><SuspenseWrapper Component={GhidMarimi} /></Route>
      <Route path="/faq"><SuspenseWrapper Component={FAQ} /></Route>
      <Route path="/confidentialitate"><SuspenseWrapper Component={PoliticaConfidentialitate} /></Route>
      <Route path="/termeni"><SuspenseWrapper Component={TermeniConditii} /></Route>

      <Route path="/admin"><SuspenseWrapper Component={AdminDashboard} /></Route>
      <Route path="/admin/products"><SuspenseWrapper Component={AdminProducts} /></Route>
      <Route path="/admin/products/new"><SuspenseWrapper Component={AdminProductEdit} /></Route>
      <Route path="/admin/products/:id/edit"><SuspenseWrapper Component={AdminProductEdit} /></Route>
      <Route path="/admin/orders"><SuspenseWrapper Component={AdminOrders} /></Route>
      <Route path="/admin/inventory"><SuspenseWrapper Component={AdminInventory} /></Route>
      <Route path="/admin/categories"><SuspenseWrapper Component={AdminCategories} /></Route>
      <Route path="/admin/labels"><SuspenseWrapper Component={AdminLabels} /></Route>
      <Route path="/debug"><SuspenseWrapper Component={Debug} /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

/** Global Organization + WebSite Schema (injectat o dată la nivel de app) */
function GlobalSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://anksboutique.ro/#organization",
        "name": "Anks Boutique",
        "url": "https://anksboutique.ro",
        "logo": {
          "@type": "ImageObject",
          "url": "https://anksboutique.ro/opengraph.jpg",
          "width": 1200,
          "height": 630,
        },
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "+40-720-180-186",
            "contactType": "customer service",
            "availableLanguage": ["ro"],
          },
        ],
        "sameAs": [
          "https://instagram.com/anksboutique",
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://anksboutique.ro/#website",
        "url": "https://anksboutique.ro",
        "name": "Anks Boutique",
        "description": "Magazin online de modă și accesorii premium pentru femei.",
        "publisher": { "@id": "https://anksboutique.ro/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://anksboutique.ro/shop?search={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

function App() {
  return (
    <HelmetProvider>
      <GlobalSchema />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <CookieConsent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
