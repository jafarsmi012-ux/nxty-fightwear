// Legacy fields (untuk backward compatibility dengan data/products.json existing)
export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string; // legacy flat string
  description: string;
  price: number;
  originalPrice?: number;
  sizes: string[];
  colors: string[];
  images: string[];
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  inStock: boolean;

  // Optional rich fields (untuk Shopee-style schema)
  brand?: string;
  media?: {
    images: string[];
    video?: string;
  };
  descriptionRich?: {
    short: string;
    long: string;
    highlights: string[];
  };
  variants?: Array<{
    type: string;
    options: Array<{
      sku: string;
      size?: string;
      color?: string;
      price?: number;
      stock: number;
    }>;
  }>;
  specs?: {
    material: string;
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    origin: string;
  };
  badges?: Array<"NEW" | "BEST_SELLER" | "LIMITED" | "RESTOCK">;
}

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  variantSku?: string;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export interface MidtransCustomer {
  first_name: string;
  last_name?: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
}

export type PaymentStatus = "success" | "pending" | "failed";

// ============ PROMOTIONS ============

export type PromotionType =
  | "flash_sale"
  | "voucher"
  | "discount"
  | "bundle"
  | "add_on"
  | "banner";

export interface Promotion {
  id: string;
  type: PromotionType;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  badge?: string;
  startTime?: string;
  endTime?: string;
  productIds?: string[];
  flashPrice?: number;
  flashStock?: number;
  purchaseLimit?: number;
  code?: string;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  buyQuantity?: number;
  getQuantity?: number;
  giftProductId?: string;
  ctaHref?: string;
  ctaLabel?: string;
  status: "draft" | "scheduled" | "active" | "ended";
  priority?: number;
}

export interface ClaimedVoucher {
  code: string;
  promotionId: string;
  claimedAt: string;
}

export interface AppliedVoucher {
  promotionId: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
}
