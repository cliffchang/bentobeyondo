# Bento Beyondo

A spatial puzzle roguelike where players fill customer bento boxes with tetromino-shaped scoops.

## Tech Stack
- React 18 + TypeScript + Vite
- Pure CSS (no framework)
- No backend — client-side only

## Architecture

### Core Game Logic (`src/core/`)
- `types.ts` — Type definitions. `BentoGrid` is a **class** (not interface) with computed `size` property
- `game.ts` — State machine. Key constants: `ACTIVE_CUSTOMER_SLOTS=3`, `AVG_SCOOP_SIZE=4`, `MAX_CUSTOMERS_PER_DAY=8`
- `placement.ts` — Scoop placement logic, handles overflow/waste
- `bag.ts` — Deck/bag system: starting deck creation, shuffling, drawing
- `scoring.ts` — Fill percentage, payment, and review star calculation
- `debug.ts` — Debug mode via `?debug=true` URL param (adds premium scoops + customer preferences)

### Data (`src/data/`)
- `bentos.ts` — Bento patterns with random rotation/reflection for variety
- `shapes.ts` — Tetromino shape definitions
- `ingredients.ts` — Premium ingredient definitions (5 active: salmon, wagyu, tamago, unagi, ikura)
- `upgrades.ts` — Kitchen upgrades and shop offering generation with tier gating

### Key Design Decisions
- **In-place customer replacement**: When served, new customer appears in same slot (no shifting)
- **Arrow keys switch bentos**: Moving past left/right edge switches to adjacent bento
- **Dynamic patience**: `ceil(bentoSize / AVG_SCOOP_SIZE) * ACTIVE_CUSTOMER_SLOTS + 2 + decorCount`
- **Perfect serve (PERFECTO)**: When `scoopsUsed <= ceil(bentoSize / 4)` (minimum possible)

### Deck System (Deckbuilder Model)
- **Persistent deck**: The bag is a known, fixed set of scoops the player builds over time
- **Starting deck**: 2 of each of 7 tetrominoes = 14 plain scoops (no ingredients)
- **Scoop IDs**: Sequential `deck-0`, `deck-1`, ... tracked by `nextDeckId` counter
- **Menu derivation**: Unique ingredients across all deck scoops determine what customers can request
- **Wash mechanic**: When bag empties mid-day, deck reshuffles into bag + all customers lose 1 patience
- **Between days**: Deck reshuffles into bag for free (no wash penalty)

### Bonus System
- **PERFECTO** — Streak-based: 10% additive per consecutive perfect, capped at `maxPerfectBonusPercent` (default 30%, upgradeable). Streak resets on imperfect serve OR patience expiry.
- **DELICIOSO** — Ingredient matching: each matched preference adds its `bonusPercent` (10-50%). Partial matching works (2 of 3 still gives bonus). No streak.
- **Stacking**: PERFECTO × DELICIOSO multiplied together for final payment.

### Reputation System (5-Star Rating)
- **Survival mechanic**: Yelp-style star rating replaces rent. Must meet milestone thresholds or game over.
- **Reviews**: Every customer leaves a review. Fill ≤50% = 1★. Fill >50% scales 1.0–4.0★. +0.5 PERFECTO, +0.5 DELICIOSO, cap 5.0.
- **Patience expiry**: No "angry" customers — patience=0 auto-serves whatever fill% they have (naturally bad review).
- **EMA decay**: `new_rating = 0.3 * todayAvg + 0.7 * oldRating`. Day 1 is raw average (no history).
- **Milestones**: Checkpoints at days 5/10/15/20/25 with escalating required ratings (2.5/3.0/3.5/4.0/4.5).
- **Phases**: `playing` → `day_end` → `shopping` → `playing` (next day) OR `game_over` (failed milestone)

### Shopping Phase
- **Phase flow**: `playing` → `day_end` → `ENTER_SHOP` → `shopping` → `START_DAY` → `playing`
- **Shop offerings**: 3 items generated each visit from pool of scoop offerings + kitchen upgrades
- **Scoop offerings**: Random shape + random tier-gated ingredient. 30% chance plain ($100), 70% with ingredient ($200). Not unique — can buy duplicates.
- **Kitchen upgrades**: Bonsai ($200), Koi ($250), Zen ($300) — each adds +1 patience. Unique (removed from pool once purchased).
- **Tier gating**: T1 (day 1+): salmon, wagyu, tamago, bonsai. T2 (day 3+): unagi, ikura, koi. T3: zen.
- **Controls**: Keys 1/2/3 to buy offerings, Space/Enter to start next day

### Day/Run Progression
- **Money**: `dayPayment` (this day's earnings), `totalMoney` (accumulated). Money is upgrade currency only.
- **Perfect streak persists** across days as reward for consistency
- **Customer counters reset** each day (customersServed, patienceExpired)

### Premium Ingredients
- `PremiumIngredient` type: `{ id, name, bonusPercent, emoji }`
- `Scoop.ingredient`: `PremiumIngredient | null` (null = plain scoop)
- `Customer.preferences`: requested ingredients (0-3); `Customer.ingredientsReceived`: what they got
- Day 1 starts with no premium scoops; unlock via buying ingredient scoops in shop
- Debug mode (`?debug=true`): 50% scoops get random ingredients, 60% customers get 1 preference

### State Flow
1. `placeCurrentScoop()` — places scoop, increments `scoopsUsed`, tracks ingredient received, advances turn
2. `advanceScoop()` — moves next→current, draws new next. If bag empty: reshuffle deck (wash penalty)
3. `decreasePatience()` — all customers lose 1 patience
4. `processCustomers()` — checks for full bentos (served) or 0 patience (auto-served), calculates bonuses + review stars, sets `lastServedEvent`
5. `enterShop()` — calculates EMA rating, checks milestones, generates shop offerings, phase → `shopping`
6. `buyUpgrade()` — purchases offering: adds scoop to deck or decor to upgrades
7. `startDay()` — reshuffles deck into bag, creates customers with menu + patience bonus, phase → `playing`

### Animation System
- `lastServedEvent` stores `{ slotIndex, payment, isPerfect, perfectStreak, isDelicioso, matchedIngredients, reviewStars, patienceExpired }`
- Counter.tsx renders overlay animation (PERFECTO/DELICIOSO/review stars), clears after 1.5s via `CLEAR_SERVED_EVENT`

### Controls
- Arrow keys: Move cursor / switch bentos
- R: Rotate scoop
- S: Swap current/next scoop
- Space/Enter: Place scoop
- Tab: Discard scoop
- 1/2/3: Buy shop items (shopping phase)

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build (tsc + vite build)
npm run lint     # ESLint (config may need setup)
```

## Next Steps (planned)
- **Broader preference categories** (e.g., "seafood" matching multiple ingredients)
- **More kitchen upgrades** (preview depth, bag size, etc.)
- **Meta-progression** (day-1 unlocks from previous runs)
- **Customer attributes** (good tipper, harsh reviewer, influencer)
