import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Check, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useGetProduct,
  getGetProductQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useListCategories,
  useCreateCategory,
  getListCategoriesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { Link } from "wouter";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BADGES = ["", "New", "Best Seller", "Limited"];
const COLORS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Beige", hex: "#F5F0E8" },
  { name: "Blush", hex: "#FFB6C1" },
  { name: "Red", hex: "#C0392B" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Pink", hex: "#E91E8C" },
  { name: "Orange", hex: "#E67E22" },
  { name: "Yellow", hex: "#F1C40F" },
  { name: "Mint", hex: "#98D8C8" },
  { name: "Green", hex: "#27AE60" },
  { name: "Teal", hex: "#008080" },
  { name: "Navy", hex: "#1B2A5A" },
  { name: "Blue", hex: "#2980B9" },
  { name: "Lilac", hex: "#C8A2C8" },
  { name: "Purple", hex: "#7D3C98" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Brown", hex: "#6D4C41" },
  { name: "Grey", hex: "#95A5A6" },
  { name: "Black", hex: "#1A1A1A" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getColorHex(colorName: string, customColors: { name: string; hex: string }[] = []): string {
  return COLORS.find((c) => c.name === colorName)?.hex || getCustomColorHex(colorName, customColors) || "#ccc";
}

function isLightColor(colorName: string): boolean {
  return ["White", "Ivory", "Beige", "Blush", "Yellow", "Mint"].includes(colorName);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function isLightHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  // Relative luminance (sRGB)
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance > 186;
}

function getCustomColorHex(
  colorName: string,
  customColors: { name: string; hex: string }[]
): string | undefined {
  return customColors.find((c) => c.name === colorName)?.hex;
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isNew = !id;
  const productId = id ? parseInt(id, 10) : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  const { data: product } = useGetProduct(productId!, {
    query: { enabled: !!productId, queryKey: getGetProductQueryKey(productId!) },
  });

  const { data: categories } = useListCategories();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    comparePrice: "",
    categoryId: "",
    sizes: [] as string[],
    colors: [] as string[],
    stock: "0",
    badge: "",
    sku: "",
    images: [] as string[],
    colorImages: {} as Record<string, string[]>,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeColorForImage, setActiveColorForImage] = useState<string | null>(null);

  // Custom color state
  const [customColors, setCustomColors] = useState<{ name: string; hex: string }[]>([]);
  const [showCustomColorForm, setShowCustomColorForm] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#E91E8C");

  // Category creation state
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");

  useEffect(() => {
    if (product && !isNew) {
      // Restore custom colors from persisted storage metadata
      const restoredCustomColors: { name: string; hex: string }[] = [];
      const rawCustomColors = (product as any).colorImages?.__custom_colors__;
      if (rawCustomColors) {
        try {
          const parsed = JSON.parse(rawCustomColors);
          if (Array.isArray(parsed)) restoredCustomColors.push(...parsed);
        } catch {}
      }

      // Detect colors not in the predefined COLORS list and add them as custom
      const predefinedNames = COLORS.map((c) => c.name);
      for (const colorName of product.colors || []) {
        if (!predefinedNames.includes(colorName)) {
          const existing = restoredCustomColors.find((c) => c.name === colorName);
          if (!existing) {
            restoredCustomColors.push({ name: colorName, hex: "#cccccc" });
          }
        }
      }
      setCustomColors(restoredCustomColors);

      // Clean the reserved key from colorImages for the form
      const { __custom_colors__, ...cleanColorImages } = (product as any).colorImages || {};

      setForm({
        title: product.title || "",
        description: product.description || "",
        price: String(product.price || ""),
        comparePrice: String(product.comparePrice || ""),
        categoryId: String(product.categoryId || ""),
        sizes: product.sizes || [],
        colors: product.colors || [],
        stock: String(product.stock || 0),
        badge: product.badge || "",
        sku: product.sku || "",
        images: product.images || [],
        colorImages: cleanColorImages,
      });
    }
  }, [product, isNew]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createCategory = useCreateCategory();

  // ---- Generic upload helper ----
  const uploadFiles = async (files: FileList | File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/image", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
          toast.success(`${file.name} — încărcare reușită`);
        } else {
          const errData = await res.json().catch(() => ({ error: "Eroare necunoscută" }));
          toast.error(`${file.name} — ${errData.error || "încărcare eșuată"}`);
        }
      } catch {
        toast.error(`${file.name} — eroare de rețea`);
      }
    }
    return urls;
  };

  // ---- Main images ----
  const handleImageFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const urls = await uploadFiles(files);
    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleImageFiles(e.dataTransfer.files);
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  // ---- Color images ----
  const handleColorImageFiles = async (files: FileList | File[], colorName: string) => {
    setUploading(true);
    const urls = await uploadFiles(files);
    setForm((f) => ({
      ...f,
      colorImages: {
        ...f.colorImages,
        [colorName]: [...(f.colorImages[colorName] || []), ...urls],
      },
    }));
    setUploading(false);
  };

  const removeColorImage = (colorName: string, imgIdx: number) => {
    setForm((f) => ({
      ...f,
      colorImages: {
        ...f.colorImages,
        [colorName]: (f.colorImages[colorName] || []).filter((_, i) => i !== imgIdx),
      },
    }));
  };

  const triggerColorUpload = (colorName: string) => {
    setActiveColorForImage(colorName);
    // Use setTimeout to ensure state is set before click
    setTimeout(() => {
      colorFileInputRef.current?.click();
    }, 0);
  };

  const onColorFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && activeColorForImage) {
      handleColorImageFiles(e.target.files, activeColorForImage);
      setActiveColorForImage(null);
      e.target.value = "";
    }
  };

  // ---- Sizes ----
  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));
  };

  // ---- Colors (selection toggle) ----
  const toggleColor = (color: string) => {
    setForm((f) => ({
      ...f,
      colors: f.colors.includes(color) ? f.colors.filter((c) => c !== color) : [...f.colors, color],
    }));
  };

  // ---- Validation ----
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Câmp obligatoriu";
    if (!form.price || isNaN(Number(form.price))) e.price = "Preț valid necesar";
    if (!form.categoryId) e.categoryId = "Câmp obligatoriu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ---- Submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Persist custom color definitions in colorImages under a reserved key
    const colorImagesWithCustom = {
      ...form.colorImages,
      ...(customColors.length > 0 ? { __custom_colors__: JSON.stringify(customColors) } : {}),
    };

    const payload = {
      title: form.title,
      description: form.description || undefined,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      categoryId: parseInt(form.categoryId, 10),
      sizes: form.sizes,
      colors: form.colors,
      stock: parseInt(form.stock, 10) || 0,
      badge: form.badge || undefined,
      sku: form.sku || undefined,
      images: form.images,
      colorImages: colorImagesWithCustom,
    };

    if (isNew) {
      createProduct.mutate(
        { data: payload as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setSaved(true);
            setTimeout(() => navigate("/admin/products"), 1000);
          },
        }
      );
    } else {
      updateProduct.mutate(
        { id: productId!, data: payload },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId!) });
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          },
        }
      );
    }
  };

  // ---- Category creation ----
  const handleCreateCategory = () => {
    if (!newCatName.trim() || !newCatSlug.trim()) return;
    createCategory.mutate(
      { data: { name: newCatName.trim(), slug: newCatSlug.trim() } },
      {
        onSuccess: (newCat) => {
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          setForm((f) => ({ ...f, categoryId: String(newCat.id) }));
          setShowNewCategory(false);
          setNewCatName("");
          setNewCatSlug("");
        },
      }
    );
  };

  const openNewCategory = () => {
    setShowNewCategory(true);
    setNewCatName("");
    setNewCatSlug("");
  };

  const onNewCatNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(slugify(val));
  };

  // ---- Compute selected color data for the color images section ----
  const allColorPalette = [...COLORS, ...customColors];
  const selectedColors = allColorPalette.filter((c) => form.colors.includes(c.name));

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 hover:bg-muted rounded transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-serif">{isNew ? "Adaugă Produs" : "Editează Produs"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== Column 1-2: Main Info + Images + Color Images ===== */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details */}
            <div className="bg-background border border-border p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Detalii Produs</h2>

              <FormField label="Titlu" error={errors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls(!!errors.title)}
                  placeholder="ex. Rochie din Mătase"
                />
              </FormField>

              <FormField label="Descriere">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                  placeholder="Descrieți produsul..."
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Preț (RON)" error={errors.price}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className={inputCls(!!errors.price)}
                    placeholder="299.00"
                  />
                </FormField>
                <FormField label="Preț Comparat (RON)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.comparePrice}
                    onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                    className={inputCls(false)}
                    placeholder="Opțional"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="COD">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className={inputCls(false)}
                    placeholder="ANK-001"
                  />
                </FormField>
                <FormField label="Cantitate Stoc">
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className={inputCls(false)}
                    placeholder="0"
                  />
                </FormField>
              </div>
            </div>

            {/* Main Images */}
            <div className="bg-background border border-border p-6">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Imagini Generale</h2>

              <div
                ref={dropZoneRef}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-none p-10 text-center cursor-pointer transition-colors ${
                  isDragging ? "border-foreground bg-muted" : "border-border hover:border-muted-foreground"
                }`}
              >
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-3" strokeWidth={1.5} />
                <p className="text-sm text-muted-foreground">
                  {uploading ? "Se încarcă..." : "Trage & plasează imagini aici, sau apasă pentru a alege"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, maxim 15MB fiecare</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                />
              </div>

              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group w-24 h-28 bg-muted overflow-hidden">
                      <img src={url} alt={form.title || "Imagine produs"} loading="lazy" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] uppercase tracking-wider bg-foreground/80 text-background py-0.5">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color Images Section */}
            {selectedColors.length > 0 && (
              <div className="bg-background border border-border p-6">
                <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">
                  Imagini pe Culori
                </h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Asociază imagini specifice fiecărei culori selectate. Acestea vor fi afișate în galeria produsului când utilizatorul selectează o culoare.
                </p>

                {/* Hidden file input for color images */}
                <input
                  ref={colorFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onColorFileChange}
                />

                <div className="space-y-6">
                  {selectedColors.map(({ name, hex }) => {
                    const colorImgs = form.colorImages[name] || [];
                    const colorIsCustom = customColors.some((c) => c.name === name);
                    const colorIsLight = colorIsCustom ? isLightHex(hex) : isLightColor(name);
                    return (
                      <div key={name} className="border border-border p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: hex, borderColor: colorIsLight ? "#ccc" : hex }}
                          />
                          <span className="text-sm font-medium">{name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({colorImgs.length} imagini)
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerColorUpload(name)}
                            className="ml-auto flex items-center gap-1.5 h-8 px-3 border border-border text-[10px] uppercase tracking-widest hover:border-foreground transition-colors"
                            disabled={uploading}
                          >
                            <Plus className="w-3 h-3" />
                            Adaugă
                          </button>
                        </div>

                        {colorImgs.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {colorImgs.map((url, i) => (
                              <div key={i} className="relative group w-20 h-22 bg-muted overflow-hidden">
                                <img src={url} alt={`${name} ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeColorImage(name, i)}
                                  className="absolute top-1 right-1 p-1 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            Nicio imagine asociată. Apasă "Adaugă" pentru a încărca.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedColors.length === 0 && form.colors.length === 0 && (
              <div className="bg-background border border-border p-6">
                <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Imagini pe Culori</h2>
                <p className="text-xs text-muted-foreground">
                  Selectează culori pentru produs în sidebar-ul din dreapta, apoi poți asocia imagini specifice fiecărei culori.
                </p>
              </div>
            )}
          </div>

          {/* ===== Column 3: Sidebar ===== */}
          <div className="space-y-4">
            <div className="bg-background border border-border p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Organizare</h2>

              <FormField label="Categorie" error={errors.categoryId}>
                <div className="flex gap-2">
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                    className={inputCls(!!errors.categoryId) + " flex-1"}
                  >
                    <option value="">Selectează categoria...</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openNewCategory}
                    className="shrink-0 h-[42px] w-[42px] flex items-center justify-center border border-border hover:border-foreground transition-colors"
                    title="Adaugă categorie nouă"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </FormField>

              {showNewCategory && (
                <div className="border border-border p-4 space-y-3 bg-muted/20">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Categorie Nouă</p>
                  <div>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => onNewCatNameChange(e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors"
                      placeholder="Nume categorie"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newCatSlug}
                      onChange={(e) => setNewCatSlug(e.target.value)}
                      className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors font-mono text-xs"
                      placeholder="slug-categorie"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={createCategory.isPending || !newCatName.trim() || !newCatSlug.trim()}
                      className="flex-1 h-9 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors"
                    >
                      {createCategory.isPending ? "Se creează..." : "Creează"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="h-9 px-4 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              )}

              <FormField label="Etichetă">
                <select
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className={inputCls(false)}
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>{b || "Niciunul"}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="bg-background border border-border p-6">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Mărimi</h2>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`h-9 px-3 border text-sm font-medium transition-colors ${
                      form.sizes.includes(size)
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-background border border-border p-6">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Culori</h2>
              <div className="flex flex-wrap gap-2">
                {allColorPalette.map(({ name, hex }) => {
                  const selected = form.colors.includes(name);
                  const isCustom = customColors.some((c) => c.name === name);
                  const light = isCustom ? isLightHex(hex) : isLightColor(name);
                  return (
                    <div key={name} className="relative group">
                      <button
                        type="button"
                        title={name}
                        onClick={() => toggleColor(name)}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all ${
                          selected
                            ? "border-foreground scale-110 shadow-md"
                            : light
                            ? "border-border hover:border-muted-foreground"
                            : "border-transparent hover:border-muted-foreground"
                        }`}
                        style={{ backgroundColor: hex }}
                      >
                        {selected && (
                          <Check
                            className={`absolute inset-0 m-auto w-3.5 h-3.5 ${light ? "text-foreground" : "text-white"}`}
                            strokeWidth={3}
                          />
                        )}
                      </button>
                      {isCustom && (
                        <button
                          type="button"
                          title={`Șterge ${name}`}
                          onClick={() => {
                            // Remove from custom colors
                            setCustomColors((prev) => prev.filter((c) => c.name !== name));
                            // Also deselect if it was selected
                            setForm((f) => ({
                              ...f,
                              colors: f.colors.filter((c) => c !== name),
                            }));
                          }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <X className="w-2.5 h-2.5" strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {/* + button to add custom color */}
                <button
                  type="button"
                  title="Adaugă o culoare personalizată"
                  onClick={() => {
                    setCustomColorName("");
                    setCustomColorHex("#E91E8C");
                    setShowCustomColorForm(true);
                  }}
                  className="w-8 h-8 rounded-full border-2 border-dashed border-border hover:border-foreground flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
                </button>
              </div>

              {/* Inline custom color form */}
              {showCustomColorForm && (
                <div className="mt-4 border border-border p-4 space-y-3 bg-muted/20">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Culoare Personalizată
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={customColorHex}
                      onChange={(e) => setCustomColorHex(e.target.value)}
                      className="w-10 h-10 p-0.5 border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                      className="flex-1 border border-border bg-background px-3 py-2 text-sm focus:border-foreground outline-none transition-colors"
                      placeholder="Nume culoare (ex. Peach)"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const name = customColorName.trim();
                        if (!name) return;
                        // Add to custom colors
                        setCustomColors((prev) => [...prev, { name, hex: customColorHex }]);
                        // Auto-select it
                        setForm((f) => ({
                          ...f,
                          colors: f.colors.includes(name) ? f.colors : [...f.colors, name],
                        }));
                        setShowCustomColorForm(false);
                        setCustomColorName("");
                      }}
                      disabled={!customColorName.trim()}
                      className="flex-1 h-9 bg-foreground text-background text-xs uppercase tracking-widest font-medium hover:bg-foreground/80 disabled:opacity-40 transition-colors"
                    >
                      Adaugă
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomColorForm(false)}
                      className="h-9 px-4 border border-border text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                    >
                      Anulează
                    </button>
                  </div>
                </div>
              )}

              {form.colors.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {form.colors.join(", ")}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className={`w-full h-12 text-sm uppercase tracking-widest font-medium transition-all flex items-center justify-center gap-2 ${
                saved
                  ? "bg-green-800 text-white"
                  : "bg-foreground text-background hover:bg-foreground/80 disabled:opacity-40"
              }`}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Salvat</>
              ) : isNew ? (
                "Creează Produs"
              ) : (
                "Salvează Modificările"
              )}
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest font-medium text-muted-foreground mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full border bg-background px-4 py-2.5 text-sm outline-none transition-colors ${
    hasError ? "border-destructive" : "border-border focus:border-foreground"
  }`;
}
