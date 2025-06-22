// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy?: string;
  updatedBy?: string;
}

// Product related types
export interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  sku?: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  weightUnit: 'g' | 'kg' | 'lb' | 'oz';
  category: string;
  tags: string[];
  images: ProductImage[];
  isActive: boolean;
  isFeatured?: boolean;
  isGiftCard?: boolean;
  requiresShipping?: boolean;
  stock: number;
  brand?: string;
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  options?: ProductOption[];
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  options: {
    name: string;
    value: string;
  }[];
  isActive: boolean;
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

// User related types
export interface User extends BaseEntity {
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string | Date;
  emailVerified: boolean;
  shippingAddresses?: Address[];
  billingAddress?: Address;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
  notifications?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Order related types
export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  customer?: User;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  paymentMethod: string;
  shippingAddress: Address;
  billingAddress: Address;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  product?: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  price: number;
  compareAtPrice?: number;
  title: string;
  sku?: string;
  barcode?: string;
  image?: string;
  options?: {
    name: string;
    value: string;
  }[];
}

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  country: string;
  zip: string;
  phone?: string;
  isDefault?: boolean;
}

// Admin settings
export interface AdminSettings {
  maintenanceMode: boolean;
  userRegistration: boolean;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  defaultTaxRate: number;
  shippingEnabled: boolean;
  freeShippingThreshold: number;
  defaultShippingRate: number;
  emailNotifications: {
    orderPlaced: boolean;
    orderShipped: boolean;
    orderDelivered: boolean;
    orderCancelled: boolean;
    paymentReceived: boolean;
    paymentFailed: boolean;
    accountCreated: boolean;
    passwordReset: boolean;
  };
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    tiktok?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
    canonicalUrl: string;
  };
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
    googleTagManagerId?: string;
  };
  lastUpdated: string | Date;
  updatedBy?: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Form field types
export type FormField<T> = {
  value: T;
  error?: string;
  touched: boolean;
  validate?: (value: T) => string | undefined;
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;
