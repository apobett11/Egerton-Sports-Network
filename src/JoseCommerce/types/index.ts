export interface ProductImage {
  id: string;
  productId: string;
  imagePath: string;
  displayOrder: number;
  isPrimary?: boolean;
}

export interface ProductClass {
  id: string;
  code: string;
  name: string;
  label: string;
  description: string;
  displayOrder?: number;
}

export interface Product {
  id: string;
  classId?: string;
  categoryId?: string;
  sku?: string;
  name: string;
  subtitle: string;
  category: string;
  categorySlug: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  productImages?: ProductImage[];
  keywords: string[];
  audience: 'team' | 'individual' | 'both';
  isNew: boolean;
  isFeatured: boolean;
  inStock: boolean;
  stockCount: number;
  badge?: string;
  sizes: string[];
  colors: { name: string; hex: string; image?: string }[];
  description: string;
  productClass?: string;
  classLetter?: string;
  categoryLetter?: string;
  features: string[];
  specifications: Record<string, string>;
  teamDiscount?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  classId?: string;
  name: string;
  slug: string;
  iconName: string;
  count: number;
  description: string;
  imageUrl: string;
}

export interface CartCustomization {
  teamName?: string;
  customPrint?: boolean;
  squadNumbers?: string;
  specialNotes?: string;
}

export interface CartItem {
  id: string; // unique item cart key (productId + size + color)
  product: Product;
  size: string;
  color: string;
  quantity: number;
  customization?: CartCustomization;
}

export type SortOption = 'latest' | 'price-asc' | 'price-desc' | 'rating' | 'popular';

export interface FilterState {
  searchQuery: string;
  category: string;
  productClass: string;
  sortBy: SortOption;
  audience: 'all' | 'team' | 'individual';
  priceRange: [number, number];
  minRating: number;
  inStockOnly: boolean;
  selectedKeywords: string[];
}

export interface CommunityShowcaseItem {
  id: string;
  title: string;
  teamName: string;
  location: string;
  image: string;
  badge: string;
  date: string;
  kitDetails: string;
  quote: string;
  verifiedOrder: boolean;
}

export type OrderTrackingStep = 1 | 2 | 3 | 4;
export type OrderTrackingState = 'order_recorded' | 'parcel_dispatched' | 'in_location' | 'delivered';

export const ORDER_TRACKING_STEPS: { step: OrderTrackingStep; key: OrderTrackingState; label: string; description: string }[] = [
  { step: 1, key: 'order_recorded', label: 'Order Recorded', description: 'Order confirmed and inventory booked in system' },
  { step: 2, key: 'parcel_dispatched', label: 'Parcel Dispatched', description: 'Package sorted and handed over to transit courier' },
  { step: 3, key: 'in_location', label: 'In Location', description: 'Arrived at destination county & pickup station' },
  { step: 4, key: 'delivered', label: 'Delivered', description: 'Handed over / Collected successfully' },
];

export interface Order {
  id: string;
  orderNumber?: string;
  userId?: string;
  customerName: string;
  customerEmail?: string;
  phoneNumber: string;
  teamName?: string;
  deliveryAddress: string;
  city: string;
  county?: string;
  subCounty?: string;
  pickupStation?: string;
  notes?: string;
  paymentMethod: 'mpesa' | 'card' | 'delivery';
  checkoutType?: 'in-app' | 'whatsapp';
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  depositAmount?: number;
  depositPaid?: boolean;
  depositRequired?: boolean;
  status: 'confirmed' | 'processing' | 'dispatched' | 'completed' | OrderTrackingState;
  trackingStep?: OrderTrackingStep;
  trackingState?: OrderTrackingState;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productSku?: string;
  productImagePath?: string;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
  customization?: CartCustomization;
  totalPrice: number;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  themePreference: 'dark' | 'light';
  avatarPath?: string;
  role: 'customer' | 'admin' | 'moderator';
  dailyUsageCount: number;
  dailyUsageDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCheckoutSettings {
  whatsappCheckoutEnabled: boolean;
  inAppCheckoutEnabled: boolean;
  teamKitMinQuantity: number;
  depositRequired: boolean;
  depositType: 'percentage' | 'fixed';
  depositValue: number;
  requireOrderNotes: boolean;
  freeShippingThreshold: number;
  autoWhatsAppReceipt: boolean;
}

export interface BusinessContactSettings {
  businessEmail: string;
  callPhoneNumber: string;
  whatsappNumber: string;
  operatingHours: string;
  depotLocation: string;
}

export interface AdminProfile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

export type AdminTab = 'home' | 'analytics' | 'products' | 'orders-checkout' | 'contacts' | 'profile';

