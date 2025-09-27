export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: ProductCategory;
  subcategory?: string;
  brand: string;
  inStock: boolean;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  type: 'physical' | 'digital' | 'pdf';
  nutritionInfo?: NutritionInfo;
  benefits: string[];
  ingredients: string[];
  allergens?: string[];
  weight: string;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shippingInfo: {
    freeShipping: boolean;
    estimatedDelivery: string;
    weight: number;
  };
  pdfInfo?: PdfProductInfo;
  createdAt: string;
  updatedAt: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  servingsPerContainer: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId?: string;
  subcategories?: ProductCategory[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions?: {
    [key: string]: string;
  };
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  shipping: number;
  tax: number;
  discount: number;
  finalTotal: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  trackingNumber?: string;
}

export interface ProductFilter {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  brand?: string;
  tags?: string[];
  search?: string;
}

export interface ProductSort {
  field: 'name' | 'price' | 'rating' | 'createdAt';
  direction: 'asc' | 'desc';
}

export interface PdfProductInfo {
  filePath: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  downloadLimit?: number;
  expiryDays?: number;
  preview?: string;
  author?: string;
  language?: string;
  format: 'pdf';
}

export interface PdfPurchase {
  id: string;
  userId: string;
  productId: string;
  orderId: string;
  downloadLink: string;
  downloadCount: number;
  maxDownloads: number;
  purchaseDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'revoked';
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailDelivery {
  id: string;
  purchaseId: string;
  recipientEmail: string;
  subject: string;
  content: string;
  attachments: EmailAttachment[];
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  sentAt?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmailAttachment {
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
}


