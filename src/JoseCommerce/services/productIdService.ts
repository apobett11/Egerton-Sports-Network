export interface ProductClassDefinition {
  code: string;
  name: string;
  label: string;
  description: string;
}

export const PRODUCT_CLASSES: ProductClassDefinition[] = [
  {
    code: 'I',
    name: 'Class: Individual',
    label: 'Individual',
    description: 'All products bought by a player, fan, or single person',
  },
  {
    code: 'T',
    name: 'Class: Team',
    label: 'Team',
    description: 'Kits, training cones, sets of uniforms, offers, and all bought by a team',
  },
  {
    code: 'C',
    name: 'Class: Coaching',
    label: 'Coaching',
    description: 'All tools used in coaching and for official coach use',
  },
  {
    code: 'O',
    name: 'Class: Officiation',
    label: 'Officiation',
    description: 'Cards, corner flags, referee kits, substitute banners, goal nets, whistles, and pitch officiation',
  },
];

export const CATEGORY_TO_CODES: Record<string, { classCode: string; categoryCode: string }> = {
  'fitness-and-training': { classCode: 'I', categoryCode: 'F' },
  'pitch-training': { classCode: 'T', categoryCode: 'P' },
  'kit': { classCode: 'I', categoryCode: 'K' },
  'goalkeepers': { classCode: 'I', categoryCode: 'G' },
  'boots-and-balls': { classCode: 'I', categoryCode: 'B' },
  'officiating': { classCode: 'O', categoryCode: 'O' },
};

/**
 * Generates a valid unique Product ID conforming to TX-00456 format:
 * - 1st letter: Class code (e.g. 'I', 'T', 'C', 'O')
 * - 2nd letter: Category code (e.g. 'F', 'P', 'K', 'G', 'B', 'O')
 * - Hyphen '-'
 * - 5 random digits (e.g. '00456')
 */
export function generateProductId(
  classCode: string = 'I',
  categoryCode: string = 'K',
  customRandom?: number
): string {
  const cClass = (classCode.trim()[0] || 'I').toUpperCase();
  const cCat = (categoryCode.trim()[0] || 'K').toUpperCase();
  const num = customRandom ?? Math.floor(10000 + Math.random() * 90000);
  const formattedNum = String(num).padStart(5, '0');
  return `${cClass}${cCat}-${formattedNum}`;
}

/**
 * Checks if a string conforms to the product id pattern like IK-00456
 */
export function isValidProductId(id: string): boolean {
  return /^[A-Z]{2}-[0-9]{5}$/.test(id);
}

/**
 * Resolves class letter and category letter from category slug or fallback
 */
export function resolveClassAndCategoryCodes(
  categorySlug: string,
  explicitClass?: string
): { classCode: string; categoryCode: string } {
  const mapped = CATEGORY_TO_CODES[categorySlug];
  if (mapped) {
    return {
      classCode: explicitClass || mapped.classCode,
      categoryCode: mapped.categoryCode,
    };
  }
  return {
    classCode: explicitClass ? explicitClass.toUpperCase()[0] : 'I',
    categoryCode: categorySlug.length > 0 ? categorySlug[0].toUpperCase() : 'X',
  };
}
