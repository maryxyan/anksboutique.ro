import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useRef } from "react";
import { useGetCart, getGetCartQueryKey, useCreateOrder } from "@workspace/api-client-react";
import { useSessionId } from "@/hooks/use-session";
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

  const { data: cart } = useGetCart(
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

  // Auto-submit Netopia form
  useEffect(() => {
    if (paymentData && formRef.current) {
      formRef.current.submit();
    }
  }, [paymentData]);

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.customerName.trim()) e.customerName = "Required";
    if (!form.customerEmail.trim()) e.customerEmail = "Required";
    if (!form.customerPhone.trim()) e.customerPhone = "Required";
    if (!form.shippingAddress.trim()) e.shippingAddress = "Required";
    if (!form.city.trim()) e.city = "Required";
    if (!form.county) e.county = "Required";
    if (!form.postalCode.trim()) e.postalCode = "Required";
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
      }
    );
  };

  const isEmpty = !cart || cart.items.length === 0;

  if (isEmpty) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-24 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-border mb-6" strokeWidth={1} />
          <h2 className="text-xl font-serif mb-3">Your bag is empty</h2>
          <Link href="/shop" className="inline-block mt-4 border-b border-foreground pb-1 text-sm uppercase tracking-widest">
            Continue Shopping
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
            <h2 className="text-2xl font-serif mb-3">Redirecting to secure payment...</h2>
            <p className="text-muted-foreground text-sm">Please wait while we redirect you to Netopia Payments.</p>
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
    <Layout>
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <h1 className="text-3xl lg:text-4xl font-serif mb-12">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" error={errors.customerName}>
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
                <Field label="Phone" error={errors.customerPhone}>
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
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Street Address" error={errors.shippingAddress} className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.shippingAddress}
                    onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                    className={inputCls(!!errors.shippingAddress)}
                    placeholder="Strada Florilor 12, Ap. 4"
                  />
                </Field>
                <Field label="City" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className={inputCls(!!errors.city)}
                    placeholder="București"
                  />
                </Field>
                <Field label="County" error={errors.county}>
                  <select
                    value={form.county}
                    onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
                    className={inputCls(!!errors.county)}
                  >
                    <option value="">Select county...</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Postal Code" error={errors.postalCode}>
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
              <Field label="Order Notes (optional)">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                  placeholder="Any special instructions..."
                />
              </Field>
            </div>

            <div className="pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Lock className="w-3.5 h-3.5" />
                Secure checkout powered by Netopia Payments. Your data is encrypted and protected.
              </div>
              <button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full h-14 bg-foreground text-background text-sm uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
              >
                {createOrder.isPending ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay Securely with Card — {cart?.total.toFixed(2)} RON
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-muted p-6 sticky top-24">
              <h2 className="text-sm font-medium uppercase tracking-widest mb-6">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart?.items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.productImage || "https://images.unsplash.com/photo-1515347619253-12154d864197?q=80&w=100&auto=format&fit=crop"}
                      alt={item.productTitle}
                      className="w-16 h-20 object-cover bg-background shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{item.productTitle}</p>
                      {item.size && <p className="text-xs text-muted-foreground mt-0.5">Size: {item.size}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
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
    </Layout>
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
