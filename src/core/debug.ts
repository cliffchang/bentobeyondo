// Debug mode configuration
// Enable with ?debug=true in URL

export interface DebugConfig {
  enabled: boolean
  premiumScoopChance: number  // 0-1, chance a scoop has a premium ingredient
  customerPreferenceChance: number  // 0-1, chance a customer has preferences
  maxPreferences: number  // Max preferences per customer
}

function getDebugConfig(): DebugConfig {
  if (typeof window === 'undefined') {
    return { enabled: false, premiumScoopChance: 0, customerPreferenceChance: 0, maxPreferences: 0 }
  }

  const params = new URLSearchParams(window.location.search)
  const enabled = params.get('debug') === 'true'

  if (!enabled) {
    return { enabled: false, premiumScoopChance: 0, customerPreferenceChance: 0, maxPreferences: 0 }
  }

  console.log('🐛 Debug mode enabled')

  return {
    enabled: true,
    premiumScoopChance: 0.5,  // 50% of scoops get premium ingredients
    customerPreferenceChance: 0.6,  // 60% of customers have preferences
    maxPreferences: 1,  // Keep it simple with only 2 ingredients in pool
  }
}

export const DEBUG = getDebugConfig()
