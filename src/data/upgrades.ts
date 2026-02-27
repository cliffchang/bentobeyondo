import { ShopOffering, Scoop, PremiumIngredient } from '../core/types'
import { TETROMINOES } from './shapes'
import { INGREDIENTS } from './ingredients'
import { shuffleBag } from '../core/bag'

// Kitchen upgrades — each grants +1 patience to all customers
interface KitchenUpgrade {
  id: string
  name: string
  description: string
  cost: number
  emoji: string
  tier: number  // 1, 2, or 3
}

const KITCHEN_UPGRADES: KitchenUpgrade[] = [
  { id: 'ambidextrous', name: 'Ambidextrous', description: 'Unlock scoop swapping (S key)', cost: 150, emoji: '🤲', tier: 1 },
  { id: 'bonsai', name: 'Bonsai Tree', description: '+1 patience (ambiance)', cost: 200, emoji: '🌳', tier: 1 },
  { id: 'koi', name: 'Koi Pond', description: '+1 patience (ambiance)', cost: 250, emoji: '🐟', tier: 2 },
  { id: 'zen', name: 'Zen Garden', description: '+1 patience (ambiance)', cost: 300, emoji: '⛩️', tier: 3 },
]

// Tier gating by day
function getTierForDay(day: number): number {
  if (day >= 3) return 2
  return 1
}

// Get ingredients available at a given tier
function getIngredientsForTier(tier: number): PremiumIngredient[] {
  const t1 = [INGREDIENTS.salmon, INGREDIENTS.wagyu, INGREDIENTS.tamago]
  const t2 = [INGREDIENTS.unagi, INGREDIENTS.ikura]

  if (tier >= 2) return [...t1, ...t2]
  return t1
}

// Get kitchen upgrades available (not yet purchased, tier-gated)
function getAvailableKitchenUpgrades(tier: number, purchasedIds: string[]): KitchenUpgrade[] {
  return KITCHEN_UPGRADES.filter(u => u.tier <= tier && !purchasedIds.includes(u.id))
}

// Generate a random scoop offering
function randomScoopOffering(tier: number, nextId: number): ShopOffering {
  const shapeEntries = Object.entries(TETROMINOES)
  const [shapeName, shape] = shapeEntries[Math.floor(Math.random() * shapeEntries.length)]

  // 30% chance of plain scoop (cheaper), 70% ingredient scoop
  const isPlain = Math.random() < 0.3
  if (isPlain) {
    return {
      type: 'scoop',
      id: `shop-scoop-${nextId}`,
      name: `${shapeName}-piece`,
      cost: 100,
      emoji: '🍚',
      shape,
      shapeName,
      ingredient: null,
    }
  }

  const ingredients = getIngredientsForTier(tier)
  const ingredient = ingredients[Math.floor(Math.random() * ingredients.length)]

  return {
    type: 'scoop',
    id: `shop-scoop-${nextId}`,
    name: `${ingredient.name} ${shapeName}-piece`,
    cost: 200,
    emoji: ingredient.emoji,
    shape,
    shapeName,
    ingredient,
  }
}

/**
 * Generate 3 shop offerings for the current shopping phase
 */
export function generateShopOfferings(
  day: number,
  _deck: Scoop[],
  purchasedUpgradeIds: string[]
): ShopOffering[] {
  const tier = getTierForDay(day)
  const kitchenUpgrades = getAvailableKitchenUpgrades(tier, purchasedUpgradeIds)

  // Build a pool: kitchen upgrades + scoop offerings
  const pool: ShopOffering[] = []

  // Add available kitchen upgrades
  for (const upgrade of kitchenUpgrades) {
    pool.push({
      type: 'kitchen',
      id: upgrade.id,
      name: upgrade.name,
      description: upgrade.description,
      cost: upgrade.cost,
      emoji: upgrade.emoji,
    })
  }

  // Fill remaining slots with scoop offerings (always generate enough)
  let scoopId = 0
  while (pool.length < 6) {
    pool.push(randomScoopOffering(tier, scoopId++))
  }

  // Shuffle and pick 3
  const shuffled = shuffleBag(pool)
  return shuffled.slice(0, 3)
}
