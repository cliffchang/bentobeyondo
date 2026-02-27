import { PremiumIngredient } from '../core/types'

// Premium ingredients organized by rarity/bonus tier
// Bonus percentages: 10-20% common, 25-35% uncommon, 40-50% rare

export const INGREDIENTS: Record<string, PremiumIngredient> = {
  // Tier 1 (available from day 1)
  salmon: { id: 'salmon', name: 'Salmon', bonusPercent: 20, emoji: '🍣' },
  wagyu: { id: 'wagyu', name: 'Wagyu', bonusPercent: 30, emoji: '🥩' },
  tamago: { id: 'tamago', name: 'Tamago', bonusPercent: 10, emoji: '🥚' },

  // Tier 2 (available from day 3+)
  unagi: { id: 'unagi', name: 'Unagi', bonusPercent: 25, emoji: '🐍' },
  ikura: { id: 'ikura', name: 'Ikura', bonusPercent: 30, emoji: '🔴' },
}

// Helper to get all ingredients as array
export function getAllIngredients(): PremiumIngredient[] {
  return Object.values(INGREDIENTS)
}

// Get a specific ingredient by ID
export function getIngredientById(id: string): PremiumIngredient | undefined {
  return INGREDIENTS[id]
}

// Get ingredients by tier for unlocking progression
export function getIngredientsByTier(tier: 'common' | 'uncommon' | 'rare'): PremiumIngredient[] {
  const thresholds = {
    common: { min: 0, max: 20 },
    uncommon: { min: 21, max: 39 },
    rare: { min: 40, max: 100 },
  }
  const { min, max } = thresholds[tier]
  return getAllIngredients().filter(i => i.bonusPercent >= min && i.bonusPercent <= max)
}
