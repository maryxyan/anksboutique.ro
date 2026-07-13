export interface ClientUser {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  birthDate?: string;
  createdAt: string;
  twoFactorEnabled?: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  productTitle: string;
  productImage: string | null;
  price: number;
  quantity: number;
  size: string | null;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  city: string;
  county: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  items: OrderItem[];
  createdAt: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  postalCode: string;
  isDefault: boolean;
  isBilling: boolean;
}
