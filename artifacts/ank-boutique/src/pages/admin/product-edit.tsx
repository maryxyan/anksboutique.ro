import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, GripVertical, Check, ArrowLeft } from "lucide-react";
import {
  useGetProduct,
  getGetProductQueryKey,
  useCreateProduct,
  useUpdateProduct,
  useListCategories,
  getListProductsQueryKey,
} from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { Link } from "wouter";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const BADGES = ["", "New", "Best Seller", "Limited"];

export default function AdminProductEdit() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isNew = !id;
  const productId = id ? parseInt(id, 10) : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    stock: "0",
    badge: "",
    sku: "",
    images: [] as string[],
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && !isNew) {
      setForm({
        title: product.title || "",
        description: product.description || "",
        price: String(product.price || ""),
        comparePrice: String(product.comparePrice || ""),
        categoryId: String(product.categoryId || ""),
        sizes: product.sizes || [],
        stock: String(product.stock || 0),
        badge: product.badge || "",
        sku: product.sku || "",
        images: product.images || [],
      });
    }
  }, [product, isNew]);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const handleImageFiles = async (files: FileList | File[]) => {
    setUploading(true);
    const fileArr = Array.from(files);
    const urls: string[] = [];

    for (const file of fileArr) {
      if (!file.type.startsWith("image/")) continue;
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload/image", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          urls.push(data.url);
        }
      } catch {}
    }

    setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleImageFiles(e.dataTransfer.files);
  };

  const toggleSize = (size: string) => {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.includes(size) ? f.sizes.filter((s) => s !== size) : [...f.sizes, size],
    }));
  };

  const removeImage = (idx: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Required";
    if (!form.price || isNaN(Number(form.price))) e.price = "Valid price required";
    if (!form.categoryId) e.categoryId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title,
      description: form.description || undefined,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      categoryId: parseInt(form.categoryId, 10),
      sizes: form.sizes,
      stock: parseInt(form.stock, 10) || 0,
      badge: form.badge || undefined,
      sku: form.sku || undefined,
      images: form.images,
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

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="p-2 hover:bg-muted rounded transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-serif">{isNew ? "Add Product" : "Edit Product"}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background border border-border p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Product Details</h2>

              <FormField label="Title" error={errors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputCls(!!errors.title)}
                  placeholder="e.g. Silk Wrap Dress"
                />
              </FormField>

              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground outline-none transition-colors resize-none"
                  placeholder="Describe the product..."
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price (RON)" error={errors.price}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className={inputCls(!!errors.price)}
                    placeholder="299.00"
                  />
                </FormField>
                <FormField label="Compare Price (RON)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.comparePrice}
                    onChange={(e) => setForm((f) => ({ ...f, comparePrice: e.target.value }))}
                    className={inputCls(false)}
                    placeholder="Optional"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="SKU">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                    className={inputCls(false)}
                    placeholder="ANK-001"
                  />
                </FormField>
                <FormField label="Stock Quantity">
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

            {/* Images */}
            <div className="bg-background border border-border p-6">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Product Images</h2>

              {/* Drag & Drop Zone */}
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
                  {uploading ? "Uploading..." : "Drag & drop images here, or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP up to 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                />
              </div>

              {/* Image Previews */}
              {form.images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative group w-24 h-28 bg-muted overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 p-1 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] uppercase tracking-wider bg-foreground/80 text-background py-0.5">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-background border border-border p-6 space-y-4">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Organization</h2>

              <FormField label="Category" error={errors.categoryId}>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                  className={inputCls(!!errors.categoryId)}
                >
                  <option value="">Select category...</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Badge">
                <select
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className={inputCls(false)}
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>{b || "None"}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="bg-background border border-border p-6">
              <h2 className="text-xs uppercase tracking-widest font-medium text-muted-foreground mb-4">Sizes</h2>
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
                <><Check className="w-4 h-4" /> Saved</>
              ) : isNew ? (
                "Create Product"
              ) : (
                "Save Changes"
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
