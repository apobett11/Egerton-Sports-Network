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

export const STORE_CONTACT: StoreContactInfo = {
  storeName: "Egerscore Sports Hub",
  contactName: "Jose M. (Lead Kitmaster)",
  role: "Store Concierge & Team Equipment Lead",
  email: "store@egerscore.com",
  phone: "+254 712 345 678",
  whatsapp: "+254 712 345 678",
  depotLocation: "Gate B Sports Pavilion, Egerton Main Campus",
  businessHours: "Mon - Sat: 8:00 AM - 7:00 PM, Sun: 10:00 AM - 4:00 PM",
};

export const SAMPLE_PRODUCTS: Product[] = [];

export const PRODUCT_RULES: ProductRule[] = [
  {
    id: "rule-1",
    title: "Cold Wash & Inside Out",
    details: "Always machine or hand wash inside out at 30°C or below to preserve fabric breathability and vivid sublimated team crests.",
    sort_order: 1
  },
  {
    id: "rule-2",
    title: "Zero Ironing on Custom Prints",
    details: "Never apply direct heat or an iron to player names, squad numbers, or sponsor badges. Iron on reverse using a protective cloth.",
    sort_order: 2
  },
  {
    id: "rule-3",
    title: "Natural Air Dry Only",
    details: "Hang dry in shade. Avoid high-heat tumble dryers to prevent shrinkage of high-performance elastane and polyester fibers.",
    sort_order: 3
  },
  {
    id: "rule-4",
    title: "Official Match Day Inspection",
    details: "All kits are certified to match varsity and league uniform guidelines including sleeve patch clearances and high-contrast numbers.",
    sort_order: 4
  }
];

export const PRODUCT_FAQS: ProductFAQ[] = [
  {
    id: "faq-1",
    question: "Can we customize individual player names and squad numbers?",
    answer: "Yes! Full squad personalization (numbers 1-99, player surnames, and team crests) is completely free on squad orders of 10 or more kits.",
    sort_order: 1
  },
  {
    id: "faq-2",
    question: "How fast is delivery to Egerton Campus and surrounding areas?",
    answer: "In-stock orders are ready for pickup at our Gate B Sports Depot within 2 hours. Delivery across campus and hostels takes under 24 hours.",
    sort_order: 2
  },
  {
    id: "faq-3",
    question: "What payment methods are supported for team orders?",
    answer: "We support M-Pesa Till / Paybill, Bank Transfer, Card payment, and 50% deposit with remaining balance on delivery for registered squad captains.",
    sort_order: 3
  },
  {
    id: "faq-4",
    question: "What is the return and exchange policy if sizes do not fit?",
    answer: "We offer a 7-day hassle-free size exchange guarantee on unworn, tagged items. If a squad member needs a different size, we swap it immediately.",
    sort_order: 4
  }
];

export const PRODUCT_REVIEWS: ProductReview[] = [
  {
    id: "rev-1",
    userName: "Captain Brian K.",
    userRole: "Egerton Engineers FC",
    rating: 5,
    comment: "The Pro Aero kits look and feel like genuine European match strips. The print quality is solid and they stayed cool through two back-to-back 90-minute derby games.",
    created_at: "2026-10-02T14:32:00Z"
  },
  {
    id: "rev-2",
    userName: "Coach Otieno",
    userRole: "Rift Valley Academy",
    rating: 5,
    comment: "Fast dispatch directly to the pavilion. Sizing was exact according to the chart and the 15% team discount made it easy for our entire 18-man roster.",
    created_at: "2026-09-28T09:15:00Z"
  },
  {
    id: "rev-3",
    userName: "Dennis M.",
    userRole: "Varsity Left Winger",
    rating: 5,
    comment: "Material is feather-light and stretches cleanly when sprinting. Top-tier sports gear, Jose and the team provided excellent service.",
    created_at: "2026-09-22T17:40:00Z"
  }
];
