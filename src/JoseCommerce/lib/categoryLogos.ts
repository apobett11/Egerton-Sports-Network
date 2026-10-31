import jerseyLogo from '../assets/categories/jerseys.jpg';
import bootsBallsLogo from '../assets/categories/boots-and-balls.jpg';
import goalkeepersLogo from '../assets/categories/goalkeepers.jpg';
import officiatingLogo from '../assets/categories/officiating.jpg';
import pitchTrainingLogo from '../assets/categories/pitch-training.jpg';
import fitnessTrainingLogo from '../assets/categories/fitness-and-training.jpg';
import { normalizeCategorySlug } from '../services/productIdService';

/**
 * Official Category Logos bundled directly in client source code.
 * Zero database storage dependency - packaged and uploaded with the repository.
 */
export const CATEGORY_STATIC_LOGOS: Record<string, string> = {
  'jerseys': jerseyLogo,
  'kit': jerseyLogo,
  'boots-and-balls': bootsBallsLogo,
  'goalkeepers': goalkeepersLogo,
  'officiating': officiatingLogo,
  'pitch-training': pitchTrainingLogo,
  'fitness-and-training': fitnessTrainingLogo,
};

/**
 * Enforced display order:
 * 1. Jerseys
 * 2. Boots and Balls
 * 3. Goalkeeper's
 * 4. Officiating
 * 5. Pitch Training
 * 6. Fitness and Training
 */
export const CATEGORY_ORDER: string[] = [
  'jerseys',
  'boots-and-balls',
  'goalkeepers',
  'officiating',
  'pitch-training',
  'fitness-and-training',
];

export function getCategoryLogoUrl(slug?: string): string {
  const norm = normalizeCategorySlug(slug);
  return CATEGORY_STATIC_LOGOS[norm] || `/categories/${norm}.jpg`;
}
