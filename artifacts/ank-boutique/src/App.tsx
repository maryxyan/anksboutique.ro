import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import CookieConsent from "@/components/CookieConsent";

import Home from "@/pages/home";
import Shop from "@/pages/shop";
import Product from "@/pages/product";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import Wishlist from "@/pages/wishlist";
import Contact from "@/pages/contact";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminProducts from "@/pages/admin/products";
import AdminProductEdit from "@/pages/admin/product-edit";
import AdminOrders from "@/pages/admin/orders";
import AdminInventory from "@/pages/admin/inventory";
import LivrareRetururi from "@/pages/livrare";
import GhidMarimi from "@/pages/ghid-marimi";
import FAQ from "@/pages/faq";
import PoliticaConfidentialitate from "@/pages/confidentialitate";
import TermeniConditii from "@/pages/termeni";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={Product} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/contact" component={Contact} />

      <Route path="/livrare" component={LivrareRetururi} />
      <Route path="/ghid-marimi" component={GhidMarimi} />
      <Route path="/faq" component={FAQ} />
      <Route path="/confidentialitate" component={PoliticaConfidentialitate} />
      <Route path="/termeni" component={TermeniConditii} />

      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/products/new" component={AdminProductEdit} />
      <Route path="/admin/products/:id/edit" component={AdminProductEdit} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/inventory" component={AdminInventory} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <CookieConsent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
