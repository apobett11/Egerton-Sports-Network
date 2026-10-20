import { Product } from '../types';

export interface ProductRule {
  id: string;
  title: string;
  details: string;
  sort_order: number;
}

export interface ProductFAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface ProductReview {
  id: string;
  userName: string;
  userRole: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface StoreContactInfo {
  storeName: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  whatsapp: string;
  depotLocation: string;
  businessHours: string;
}

/**
 * All catalog products, reviews, faqs, and store rules are loaded dynamically from Supabase database.
 * Zero hardcoded data exists in the client codebase.
 */
export const SAMPLE_PRODUCTS: Product[] = [];
export const PRODUCT_RULES: ProductRule[] = [];
export const PRODUCT_FAQS: ProductFAQ[] = [];
export const PRODUCT_REVIEWS: ProductReview[] = [];
