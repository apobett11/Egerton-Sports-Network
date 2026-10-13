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

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "prod-match-kit-01",
    name: "Egerscore Pro Aero Match Kit (Full Squad Edition)",
    subtitle: "Official Matchday Strip • Breathable Dri-FIT Mesh",
    category: "Team Match Kits",
    categorySlug: "team-kits",
    price: 3450,
    originalPrice: 4200,
    rating: 5.0,
    reviewCount: 38,
    images: [
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80"
    ],
    keywords: ["jersey", "match kit", "squad", "egerscore", "dri-fit", "uniform"],
    audience: "team",
    isNew: true,
    isFeatured: true,
    inStock: true,
    stockCount: 45,
    badge: "Official Match Grade",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Crimson Red / White", hex: "#ff0046" },
      { name: "Navy Blue / Gold", hex: "#0e1e2d" },
      { name: "Pitch Green / White", hex: "#00b04f" }
    ],
    description: "Built for competitive collegiate and league tournaments, the Pro Aero Match Kit combines ultra-lightweight moisture-wicking jacquard fabric with engineered ventilation zones. Tested for maximum mobility and endurance in 90+ minute matches.",
    features: [
      "Full squad numbered set (Jerseys + Shorts + Pro Match Socks)",
      "Free custom player name and squad numbering heat-press",
      "Sublimated crest integration with zero peeling guarantee",
      "Reinforced flatlock ergonomic stitching to resist match pulling",
      "Official tournament inspection compliant"
    ],
    specifications: {
      "Fabric Composition": "100% Recycled Aero-Weave Micro-Polyester",
      "Fit Profile": "Athletic Modern Performance Fit",
      "Weight": "135g per jersey",
      "Print Ready": "Vinyl & DTF Numbering Supported",
      "Country of Origin": "Manufactured in Kenya / Sourced for League Play"
    },
    teamDiscount: "15% off on squad bulk orders (12+ pieces)",
    createdAt: "2026-09-15T10:00:00Z"
  },
  {
    id: "prod-cleats-02",
    name: "Apex Strike Pro FG Football Boots",
    subtitle: "Firm Ground Lightweight Cleats • Carbon Speedframe",
    category: "Boots & Personal",
    categorySlug: "boots-personal",
    price: 6800,
    originalPrice: 8500,
    rating: 4.9,
    reviewCount: 24,
    images: [
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=1200&q=80"
    ],
    keywords: ["boots", "cleats", "firm ground", "football", "speed"],
    audience: "individual",
    isNew: true,
    isFeatured: true,
    inStock: true,
    stockCount: 18,
    badge: "Top Seller",
    sizes: ["39", "40", "41", "42", "43", "44", "45"],
    colors: [
      { name: "Stealth Blackout", hex: "#111827" },
      { name: "Solar Crimson", hex: "#ff0046" }
    ],
    description: "Designed for razor-sharp cuts and unmatched acceleration. Featuring micro-textured synthetic upper for supreme ball control under wet and dry pitch conditions.",
    features: [
      "Dynamic chevron stud configuration for maximum traction",
      "Anatomical heel counter with anti-slip lock lining",
      "Water-repellent strike zone finish",
      "Padded insole with arch shock absorption"
    ],
    specifications: {
      "Soleplate": "Dual-Density TPU Firm Ground Chassis",
      "Upper": "Synthetic Microfibre GripSkin",
      "Closure": "Asymmetrical Precision Lacing",
      "Weight": "189g (Size 42)"
    },
    teamDiscount: "10% off for 3+ pairs team purchase",
    createdAt: "2026-09-18T12:00:00Z"
  },
  {
    id: "prod-match-ball-03",
    name: "EPL Aerow Trance FIFA Pro Match Ball",
    subtitle: "Thermal Bonded Seamless Construction • Official Match Size 5",
    category: "Balls & Facility",
    categorySlug: "balls-equipment",
    price: 4200,
    originalPrice: 4800,
    rating: 5.0,
    reviewCount: 19,
    images: [
      "https://images.unsplash.com/photo-1552667466-07770ae110d0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80"
    ],
    keywords: ["ball", "match ball", "fifa pro", "size 5", "aerow"],
    audience: "both",
    isNew: false,
    isFeatured: true,
    inStock: true,
    stockCount: 30,
    badge: "FIFA Approved",
    sizes: ["Size 5 (Official)"],
    colors: [
      { name: "White / Crimson / Navy", hex: "#ffffff" }
    ],
    description: "Zero water uptake, precision true-flight aerodynamic grooves, and latex butyl bladder for consistent rebound across all matches.",
    features: [
      "Thermally bonded 12-panel aerodynamic casing",
      "High-contrast visual graphics for quick tracking",
      "Certified match ball for varsity and inter-hall tournaments",
      "Dual-layer bladder retention ensures zero pressure drop"
    ],
    specifications: {
      "Circumference": "68.5 - 69.5 cm",
      "Air Pressure": "0.8 - 1.0 bar (11.6 - 14.5 psi)",
      "Outer Shell": "Textured Polyurethane Casing",
      "Seams": "Seamless Thermal Fusion"
    },
    teamDiscount: "Squad pack of 5 balls available at KSh 18,500",
    createdAt: "2026-09-20T09:30:00Z"
  },
  {
    id: "prod-keeper-gloves-04",
    name: "Vortex Pro Hybrid Goalkeeper Gloves",
    subtitle: "4mm German Contact Latex • Removable Finger Spines",
    category: "Goalkeeper Hub",
    categorySlug: "goalkeeper",
    price: 3800,
    originalPrice: 4500,
    rating: 4.8,
    reviewCount: 16,
    images: [
      "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80"
    ],
    keywords: ["gloves", "goalkeeper", "latex", "saves", "vortex"],
    audience: "individual",
    isNew: true,
    isFeatured: false,
    inStock: true,
    stockCount: 12,
    badge: "Pro Grip",
    sizes: ["8", "9", "10", "11"],
    colors: [
      { name: "Electric Cyan / White", hex: "#06b6d4" },
      { name: "Black / Crimson", hex: "#111827" }
    ],
    description: "Pro-tier matchday gloves engineered with sticky German contact foam for maximum catch security in pouring rain or baking sunshine.",
    features: [
      "Negative-roll hybrid cut for snug second-skin ball feeling",
      "Removable 4-finger spine protection system",
      "Extended latex wrist wrap for secure wrist support",
      "Silicone punching punch-zone on backhand"
    ],
    specifications: {
      "Palm Foam": "4mm German Supreme Contact Latex",
      "Cut Style": "Hybrid Roll-Negative Cut",
      "Wrist Closure": "Full Latex Double-Lock Strap",
      "Backhand": "Breathable Neoprene with 3D Embossing"
    },
    teamDiscount: "10% off with kit package",
    createdAt: "2026-09-22T14:15:00Z"
  }
];

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
