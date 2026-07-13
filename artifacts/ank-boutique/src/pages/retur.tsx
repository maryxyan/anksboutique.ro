import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Plus, Trash2, Send, CheckCircle, Loader2 } from "lucide-react";

const MOTIVE_RETUR = [
  "Produs defect",
  "Mărime greșită",
  "Nu corespunde descrierii",
  "M-am răzgândit",
  "Produs deteriorat la transport",
  "Alt motiv",
];

interface ReturnProduct {
  name: string;
  sku: string;
  quantity: number;
  reason: string;
}

export default function ReturPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Client info
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  // Order info
  const [orderNumber, setOrderNumber] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [receptionDate, setReceptionDate] = useState("");

  // Products
  const [products, setProducts] = useState<ReturnProduct[]>([
    { name: "", sku: "", quantity: 1, reason: "" },
  ]);

  // Refund option
  const [returnOption, setReturnOption] = useState<"refund" | "replace">("refund");

  // Refund details
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");

  // Replacement details
  const [replacementProduct, setReplacementProduct] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  function addProduct() {
    setProducts([...products, { name: "", sku: "", quantity: 1, reason: "" }]);
  }

  function removeProduct(index: number) {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  }

  function updateProduct(index: number, field: keyof ReturnProduct, value: string | number) {
    const updated = [...products];
    (updated[index] as any)[field] = value;
    setProducts(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone || !orderNumber || !orderDate) {
      toast({ title: "Eroare", description: "Completează toate câmpurile obligatorii.", variant: "destructive" });
      return;
    }

    if (products.length === 0 || !products[0].name) {
      toast({ title: "Eroare", description: "Adaugă cel puțin un produs.", variant: "destructive" });
      return;
    }

    if (returnOption === "refund" && (!accountHolder || !iban || !bank)) {
      toast({ title: "Eroare", description: "Completează datele bancare pentru rambursare.", variant: "destructive" });
      return;
    }

    if (returnOption === "replace" && !replacementProduct) {
      toast({ title: "Eroare", description: "Specifică produsul dorit la schimb.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        orderNumber,
        orderDate,
        receptionDate,
        products: products.map((p) => ({
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          reason: p.reason,
        })),
        returnOption,
        accountHolder: returnOption === "refund" ? accountHolder : undefined,
        iban: returnOption === "refund" ? iban : undefined,
        bank: returnOption === "refund" ? bank : undefined,
        replacementSize: returnOption === "replace" ? replacementProduct : undefined,
        replacementColor: returnOption === "replace" ? replacementProduct : undefined,
        notes,
      };

      const res = await fetch("/api/account/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSubmitted(true);
        toast({ title: "Succes", description: data.message || "Cererea de retur a fost înregistrată." });
      } else {
        toast({ title: "Eroare", description: data.error || "Nu s-a putut trimite cererea.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Eroare", description: "Eroare de conectare la server.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
<><Helmet><title>Formular Retur | Anks Boutique</title><meta name="robots" content="noindex, follow" /></Helmet><Layout>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="text-center py-16">
            <CardContent className="space-y-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h1 className="text-2xl font-serif">Cerere trimisă cu succes!</h1>
              <p className="text-muted-foreground">
                Am primit cererea ta de retur. Vom verifica informațiile și vei primi un email cu eticheta de retur în maxim 24 de ore.
              </p>
              <p className="text-muted-foreground">
                Dacă ai întrebări, ne poți contacta la <strong>contact@anksboutique.ro</strong>.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Acasă
                </Button>
                <Button onClick={() => navigate("/account")}>
                  Contul Meu
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout></>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <RotateCcw className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-serif mb-3">Formular de Retur Produse</h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Vă rugăm să completați acest formular și să îl trimiteți doar dacă doriți să vă retrageți din contract (să returnați produsele).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {/* === Section 1: Client Info === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif uppercase tracking-widest">
                1. Date Identificare Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    Nume și Prenume <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Popescu Maria"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">
                    Adresă de email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="maria@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    Număr de telefon <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 07XX XXX XXX"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingAddress">Adresă de livrare (pentru curier)</Label>
                  <Input
                    id="shippingAddress"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Str. Exemplu, Nr. 1, București"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === Section 2: Order Details === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif uppercase tracking-widest">
                2. Detalii Comandă
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">
                    Nr. Comandă / Factură <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="Ex: ANK-12345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderDate">
                    Dată plasare comandă <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orderDate"
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receptionDate">Dată recepție produse</Label>
                  <Input
                    id="receptionDate"
                    type="date"
                    value={receptionDate}
                    onChange={(e) => setReceptionDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* === Section 3: Products === */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-serif uppercase tracking-widest">
                3. Produse Returnate
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                <Plus className="w-4 h-4 mr-1" /> Adaugă produs
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {products.map((product, index) => (
                <div
                  key={index}
                  className="border border-border p-4 rounded-lg space-y-4 relative"
                >
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Șterge produs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">
                    Produs #{index + 1}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product-name-${index}`}>
                        Denumire Produs <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`product-name-${index}`}
                        value={product.name}
                        onChange={(e) => updateProduct(index, "name", e.target.value)}
                        placeholder="Ex: Rochie Midi Mătase"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`product-sku-${index}`}>Cod / SKU</Label>
                      <Input
                        id={`product-sku-${index}`}
                        value={product.sku}
                        onChange={(e) => updateProduct(index, "sku", e.target.value)}
                        placeholder="Ex: ANK-D001"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product-qty-${index}`}>Cantitate</Label>
                      <Input
                        id={`product-qty-${index}`}
                        type="number"
                        min={1}
                        value={product.quantity}
                        onChange={(e) => updateProduct(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`product-reason-${index}`}>Motiv Retur (Opțional)</Label>
                      <select
                        id={`product-reason-${index}`}
                        value={product.reason}
                        onChange={(e) => updateProduct(index, "reason", e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Selectează motivul...</option>
                        {MOTIVE_RETUR.map((motiv) => (
                          <option key={motiv} value={motiv}>
                            {motiv}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* === Section 4: Refund / Replace Option === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif uppercase tracking-widest">
                4. Opțiune Rambursare / Schimb
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle */}
              <div className="flex gap-4 border-b border-border pb-4">
                <button
                  type="button"
                  onClick={() => setReturnOption("refund")}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded transition-colors ${
                    returnOption === "refund"
                      ? "bg-foreground text-background"
                      : "bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Rambursare Bani
                </button>
                <button
                  type="button"
                  onClick={() => setReturnOption("replace")}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded transition-colors ${
                    returnOption === "replace"
                      ? "bg-foreground text-background"
                      : "bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Schimb Produs
                </button>
              </div>

              {returnOption === "refund" && (
                <div className="space-y-5 pt-2">
                  <p className="text-sm font-medium">Doresc returnarea banilor în contul bancar:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="accountHolder">
                        Titular Cont (Nume complet) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="accountHolder"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Ex: Popescu Maria"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iban">
                        Cont IBAN <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="iban"
                        value={iban}
                        onChange={(e) => setIban(e.target.value)}
                        placeholder="RO__XXXXXXXXXXXXXXXXXXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">
                      Bancă <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="bank"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      placeholder="Ex: Banca Transilvania, BRD, ING"
                    />
                  </div>
                </div>
              )}

              {returnOption === "replace" && (
                <div className="space-y-5 pt-2">
                  <p className="text-sm font-medium">Doresc înlocuirea produsului (Schimb):</p>
                  <div className="space-y-2">
                    <Label htmlFor="replacementProduct">
                      Produsul nou dorit la schimb <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="replacementProduct"
                      value={replacementProduct}
                      onChange={(e) => setReplacementProduct(e.target.value)}
                      placeholder="Ex: Rochie Midi Mătase - Mărime M, culoare Albastru"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* === Section 5: Notes === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif uppercase tracking-widest">
                Mențiuni Suplimentare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Observații sau detalii suplimentare</Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Orice informație suplimentară pe care doriți să o aducem la cunoștință..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer note */}
          <div className="bg-accent/30 border border-border p-4 rounded-lg text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">⚠️ Termeni și condiții retur</p>
            <p>
              Prin trimiterea acestui formular, confirm că produsele returnate sunt în aceeași stare în care au fost primite
              (fără urme de uzură, etichete intacte, ambalajul original).
            </p>
            <p>
              Conform OUG 34/2014, ai dreptul de a te retrage din contract în termen de 14 zile de la primirea produselor.
              Noi îți oferim 30 de zile pentru confortul tău. Costul returnării este gratuit.
            </p>
            <p>
              Rambursarea se face în maxim 14 zile de la primirea coletului, prin aceeași metodă de plată utilizată la achiziție
              sau în contul bancar indicat mai sus.
            </p>
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/livrare")}
              disabled={submitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[200px]">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Trimite Cererea de Retur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
