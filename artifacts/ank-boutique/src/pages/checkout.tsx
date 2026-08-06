import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useRef } from "react";
import { useGetCart, getGetCartQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ShoppingBag, Lock, Check } from "lucide-react";
import { motion } from "framer-motion";

const COUNTIES = [
  "Alba", "Arad", "Argeș", "Bacău", "Bihor", "Bistrița-Năsăud", "Botoșani", "Brașov",
  "Brăila", "Buzău", "Caraș-Severin", "Călărași", "Cluj", "Constanța", "Covasna",
  "Dâmbovița", "Dolj", "Galați", "Giurgiu", "Gorj", "Harghita", "Hunedoara", "Ialomița",
  "Iași", "Ilfov", "Maramureș", "Mehedinți", "Mureș", "Neamț", "Olt", "Prahova",
  "Satu Mare", "Sălaj", "Sibiu", "Suceava", "Teleorman", "Timiș", "Tulcea",
  "Vaslui", "Vâlcea", "Vrancea", "București",
];

export default function Checkout() {
  const sessionId = useSessionId();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const { data: cart, isLoading: isCartLoading } = useGetCart(
    { sessionId },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId }) } }
  );

  const createOrder = useCreateOrder();

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    city: "",
    county: "",
    postalCode: "",
    notes: "",
  });

  const [paymentData, setPaymentData] = useState<{
    paymentUrl: string;
    netopiaFormData: Record<string, string>;
  } | null>(null);

  const [errors, setErrors] = useState<Partial<typeof form>>({});

  useEffect(() => {
    if (paymentData && formRef.current) {
      formRef.current.submit();
    }
  }, [paymentData]);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.customerName.trim()) e.customerName = "Câmp obligatoriu";
    if (!form.customerEmail.trim()) e.customerEmail = "Câmp obligatoriu";
    if (!form.customerPhone.trim()) e.customerPhone = "Câmp obligatoriu";
    if (!form.shippingAddress.trim()) e.shippingAddress = "Câmp obligatoriu";
    if (!form.city.trim()) e.city = "Câmp obligatoriu";
    if (!form.county) e.county = "Câmp obligatoriu";
    if (!form.postalCode.trim()) e.postalCode = "Câmp obligatoriu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !sessionId) return;

    createOrder.mutate(
      { data: { ...form, sessionId } },
      {
        onSuccess: (data) => {
          setPaymentData({
            paymentUrl: data.paymentUrl,
            netopiaFormData: data.netopiaFormData || {},
          });
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Eroare la plasarea comandei",
            description: error?.message || "A apărut o eroare la procesarea comandei. Vă rugăm să încercați din nou.",
          });
        },
      }
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  if (isCartLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 lg:py-24 animate-pulse" aria-label="Se încarcă datele comenzii">
          <div className="h-9 w-64 max-w-full bg-muted mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-12 bg-muted" />)}
            </div>
            <div className="h-64 bg-muted" />
          </div>
        </div>
      </Layout>
    );
  }

  if (isEmpty) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-border mb-6" strokeWidth={1} />
          <h2 className="text-xl font-serif mb-3">Geanta ta este goală</h2>
          <Link href="/shop" className="inline-block mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest">
            Continuă Cumpărăturile
          </Link>
        </div>
      </Layout>
    );
  }

  if (paymentData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-serif mb-3">Redirecționare către plată securizată...</h2>
            <p className="text-muted-foreground text-sm">Vă rugăm așteptați în timp ce vă redirecționăm către Netopia Payments.</p>
          </motion.div>
          <form ref={formRef} action={paymentData.paymentUrl} method="POST" className="hidden">
            {Object.entries(paymentData.netopiaFormData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Finalizare Comandă | Anks Boutique</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-12 lg:py-20">
          <h1 className="text-3xl lg:text-4xl font-serif mb-8 lg:mb-12">Finalizare Comandă</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Informații de Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nume Complet" error={errors.customerName}>
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    className={inputCls(!!errors.customerName)}
                    placeholder="Maria Ionescu"
                  />
                </Field>
                <Field label="Email" error={errors.customerEmail}>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                    className={inputCls(!!errors.customerEmail)}
                    placeholder="maria@example.com"
                  />
                </Field>
                <Field label="Telefon" error={errors.customerPhone}>
                  <input
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    className={inputCls(!!errors.customerPhone)}
                    placeholder="+40 7XX XXX XXX"
                  />
                </Field>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Adresă de Livrare</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Stradă" error={errors.shippingAddress} className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.shippingAddress}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                    className={inputCls(!!errors.shippingAddress)}
                    placeholder="Strada Florilor 12, Ap. 4"
                  />
                </Field>
                <Field label="Oraș" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className={inputCls(!!errors.city)}
                    placeholder="București"
                  />
                </Field>
                <Field label="Județ" error={errors.county}>
                  <select
                    value={form.county}
                    onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                    className={inputCls(!!errors.county)}
                  >
                    <option value="">Selectează județul...</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Cod Poștal" error={errors.postalCode}>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className={inputCls(!!errors.postalCode)}
                    placeholder="010101"
                  />
                </Field>
              </div>
            </div>

            <div>
              <Field label="Note Comandă (opțional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                  placeholder="Instrucțiuni speciale..."
                />
              </Field>
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Lock className="w-3.5 h-3.5" />
                Plată securizată prin Netopia Payments. Datele tale sunt criptate și protejate.
              </div>
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full min-h-14 bg-foreground text-background px-4 py-3 text-center text-xs sm:text-sm uppercase tracking-wider sm:tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2 leading-snug"
              >
                {createOrder.isPending ? (
                  <span>Se procesează...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Plătește Securizat cu Cardul — {cart?.total.toFixed(2)} RON
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted p-6 lg:sticky lg:top-24">
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Sumar Comandă</h2>
              <div className="space-y-4 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.productImage || "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=100&auto=format&fit=crop"}
                      alt={item.productTitle}
                      loading="lazy"
                      className="w-16 h-20 object-cover bg-background shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{item.productTitle}</p>
                      {item.size && <p className="text-xs text-muted-foreground mt-0.5">Mărime: {item.size}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">Cant.: {item.quantity}</p>
                      <p className="text-sm mt-1">{(item.price * item.quantity).toFixed(2)} RON</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{cart?.subtotal.toFixed(2)} RON</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t border-border">
                  <span>Total</span>
                  <span>{cart?.total.toFixed(2)} RON</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout></>
  );
}

function Field({ label, error, children, className }: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium uppercase tracking-widest mb-2 text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
    hasError ? "border-destructive focus:border-destructive" : "border-border focus:border-foreground"
  }`;
}
