# Bento Beyondo: Game Design Document

## Overview

**Genre**: Spatial puzzle roguelike (deckbuilder-inspired)  
**Core Loop**: Fill alien lunchboxes with ingredient scoops, earn payment, upgrade your scoop collection  
**Aesthetic**: Whimsical sci-fi diner — aliens with weird dietary needs, oddly-shaped bento boxes  
**Platform**: Web (initially), designed for keyboard/mouse with potential touch support  
**Session Length**: 20-40 minutes per run

### Naming Convention
The game leans into playful faux-Spanish/Italian naming by appending "-O" to words. This extends to modes, achievements, and potentially modifiers:
- **GALACTICO** — elite endgame mode (5-star prestige tier)
- **PERFECTO** — achievement/bonus for flawless service
- Future expansions, modifiers, and features can follow this pattern

---

## Core Metaphor

| Deckbuilder Concept | Alien Bento Equivalent |
|---------------------|------------------------|
| Deck | Scoop bag (collection of polyomino shapes) |
| Cards | Scoops (tetromino pieces with ingredient types) |
| Enemies/Encounters | Customers (aliens with bento boxes to fill) |
| Combat | Service (filling bento boxes efficiently) |
| Gold | Payment (base per completed bento + tips for quality) |
| Card upgrades | Scoop modifiers (flexibility, splitting, etc.) |
| Deck thinning | Retiring scoops |

---

## Moment-to-Moment Gameplay

### The Service Phase

The player runs a shift at their alien bento restaurant. During each service:

1. **Active Counter**: 2-4 bento boxes are visible simultaneously (the "active" orders)
2. **Scoop Queue**: Player sees current scoop + 1-2 upcoming scoops from their bag
3. **Placement**: Player selects a bento and places current scoop onto its grid
4. **Resolution**: When a bento is completely filled (or player chooses to "serve early"), customer pays and leaves
5. **Flow**: New customers arrive as others leave; service continues until all customers for that encounter are served

### Placement Rules

- All placement is **grid-snapped** — no dexterity required
- Scoops can be **rotated** (90° increments) before placement
- Scoops can be **flipped** (mirror) if the scoop has that modifier
- **Overflow** (scoop extends beyond bento boundary): Allowed, but squares outside the box are wasted — they don't contribute to fill percentage
- **Overlap** (scoop covers already-filled squares): Allowed, but wastes squares and may reduce payment
- **Gaps**: Allowed, but unfilled squares at serve time reduce fill percentage
- **Minimum placement**: Scoop must touch at least one square of the bento grid
- **Discard action**: Player can skip/waste current scoop without placing — still burns a turn (all customers lose 1 patience)

### Customer Patience (Turn-Based)

Each customer has a **patience meter** measured in turns (not real-time).

- A "turn" = one scoop placed (anywhere, not just in their bento) OR one scoop discarded
- When patience hits 0, customer leaves angry: no payment, possible star loss
- Patience values vary by customer type: patient aliens (8-12 turns), rushed aliens (3-5 turns)

**Pacing Target**: Total customer patience across a service should allow approximately the number of scoops needed to fill all bentos + 10-15% buffer. This makes waste costly but not catastrophic — players have room for 1-2 discards or inefficient placements before running into trouble.

### Scoring a Bento

When a bento is served (filled or manually closed):

```
Base Payment = (Bento Size) × (Base Rate)
Fill Bonus   = (Filled Squares / Total Squares) × 100%
Match Bonus  = Ingredient preference multiplier (1.0x - 2.0x)
Perfect Bonus = +30% if 100% filled with no overlaps

Final Payment = Base Payment × Fill Bonus × Match Bonus × Perfect Bonus
```

**Combo System**: Consecutive perfect fills build a combo multiplier (×1.1, ×1.2, ×1.3...). Combo resets on imperfect fill.

---

## Star Rating System

Stars represent restaurant reputation and act as a **difficulty dial**, not a fail state.

### Rating Scale: 1-5 Stars

| Stars | Customer Type | Bento Complexity | Payment Rates | Rent Multiplier |
|-------|---------------|------------------|---------------|-----------------|
| 1 | Simple aliens | Basic rectangles (8-12 squares) | Low (1x) | 0.5x |
| 2 | Working class | Simple shapes (8-16 squares) | Normal (1.5x) | 0.75x |
| 3 | Mixed clientele | Varied shapes (12-20 squares) | Good (2x) | 1x |
| 4 | Discerning diners | Complex shapes, constraints | High (3x) | 1.5x |
| 5 | Elite gourmands | Multi-compartment, special rules | Premium (4x) | 2x |

### Star Mechanics

- **Gaining Stars**: Exceptional service across multiple customers triggers rating increase
- **Losing Stars**: Angry customers (patience expired), repeated poor fills
- **Natural Equilibrium**: If your deck can't handle high-star complexity, you'll drop; if you're crushing low-star customers, you'll rise
- **Strategic Choice**: Players can intentionally "sandbag" to stay at manageable difficulty

---

## Economy

### Income Sources

1. **Base Payment**: Fixed amount per completed bento based on size and base rate
2. **Tips**: Bonus income from quality service (perfect fills, ingredient matching, combos)
3. **Bonus Objectives**: Optional challenges per service ("serve 3 perfect bentos", "no overlaps this shift")

### Expenses

1. **Rent**: Due every N services; scales with star rating
2. **Scoop Upgrades**: Purchased between services
3. **New Scoops**: Expand your bag

### Fail State

Run ends when you cannot pay rent. This creates pressure to:
- Take risks for bigger tips
- Balance deck investment vs. cash reserves
- Sometimes accept lower star rating for sustainability

---

## The Scoop Bag (Deck)

### Starting Bag

Player begins with a basic set of 10 tetrominoes with mixed ingredients:
- 2× I-piece (1 Rice, 1 Protein)
- 2× O-piece (1 Rice, 1 Vegetable)
- 2× L-piece (1 Protein, 1 Vegetable)
- 1× J-piece (Rice)
- 1× S-piece (Protein)
- 1× Z-piece (Vegetable)
- 1× T-piece (Rice)

Distribution: 4 Rice, 3 Protein, 3 Vegetable — Rice serves as the neutral fallback, while Protein and Vegetable enable ingredient matching from the first service.

### Scoop Anatomy

```typescript
interface Scoop {
  id: string;
  shape: boolean[][];        // 2D grid representing the polyomino
  ingredient: IngredientType; // For preference matching
  modifiers: Modifier[];      // Upgrades applied to this scoop
  rarity: 'common' | 'uncommon' | 'rare';
}
```

### Shape Flexibility

The game should support arbitrary polyomino sizes, but initial implementation uses **tetrominoes** (4 squares each).

Future expansion: pentominoes (5 squares), hexominoes, or mixed bags.

**Code Architecture Note**: Shape definitions should be data-driven, not hardcoded. A tetromino is just a shape where `countSquares(shape) === 4`.

---

## Scoop Modifiers (Upgrades)

Modifiers are the primary progression vector. They attach to individual scoops.

### Placement Modifiers

| Modifier | Effect | Cost Tier |
|----------|--------|-----------|
| **Rotatable** | Can rotate 90° (default: locked orientation) | Free (all scoops) |
| **Flippable** | Can mirror horizontally | Low |
| **Shrinkable** | Can play as smaller version (remove 1 square) | Medium |
| **Splittable** | Can play as two separate pieces | High |

### Bonus Modifiers

| Modifier | Effect | Cost Tier |
|----------|--------|-----------|
| **Payment Boost** | +20% payment when this scoop is placed | Low |
| **Patience+** | Customer gains +1 patience when this scoop is placed in their bento | Medium |
| **Combo Keeper** | Doesn't break combo even if placement is imperfect | High |
| **Ingredient Upgrade** | Changes ingredient type to a rarer/more valuable one | Variable |

### Bag Manipulation Modifiers

| Modifier | Effect | Cost Tier |
|----------|--------|-----------|
| **Eager** | This scoop appears more frequently in queue | Medium |
| **Reliable** | Guaranteed in first 5 draws each service | High |
| **Paired** | When drawn, also draw a specific other scoop | High |

---

## Ingredient System

Ingredients add a color-matching layer for bonus tips.

### Base Ingredients (Unlocked at Start)

- **Rice** (white) — neutral, no preferences
- **Protein** (red) — meat-eaters prefer
- **Vegetable** (green) — herbivores prefer
- **Sauce** (brown) — flavor-seekers prefer

### Rare Ingredients (Unlocked via Progression)

- **Cosmic Roe** (purple) — premium, elite customers only
- **Plasma Jelly** (blue) — certain alien species crave it
- **Void Seasoning** (black) — mysterious bonuses

### Preference Matching

Each customer has 0-2 ingredient preferences:
- **No preference**: Standard tips
- **Preferred ingredient**: ×1.5 tip multiplier per matching scoop
- **Disliked ingredient**: ×0.75 tip multiplier (doesn't ruin the order, just reduces pay)

---

## Bento Box Design

### Bento Constraints

All bentos are grid-aligned with squares matching scoop grid size.

**Size Rules**:
- Bento total squares = multiple of 4 (since we're using tetrominoes)
- Valid sizes: 8, 12, 16, 20, 24 squares
- Shapes can be rectangular or irregular (L-shaped, U-shaped, with holes)

### Bento Complexity by Star Level

**1-2 Stars**: Simple rectangles
- 2×4 (8 squares)
- 3×4 (12 squares)
- 4×4 (16 squares)

**3 Stars**: Irregular shapes
- L-shaped bentos
- Step patterns
- 20-square irregular polygons

**4-5 Stars**: Complex constraints
- Multi-compartment (must fill each section separately)
- Holes in the middle
- Prescribed fill order ("fill from left to right")
- Forbidden zones ("keep this corner empty for sauce")

### Bento Data Structure

```typescript
interface Bento {
  id: string;
  grid: CellState[][];  // 2D array: 'empty' | 'filled' | 'blocked' | 'compartment-A' etc.
  totalSquares: number;
  owner: Customer;
}

interface Customer {
  id: string;
  name: string;
  species: AlienSpecies;
  patience: number;         // turns until angry
  maxPatience: number;
  preferences: IngredientType[];
  dislikes: IngredientType[];
  bento: Bento;
}
```

---

## Run Structure

### A Single Run

1. **Restaurant Setup**: Choose starting bonuses (unlocked via meta-progression)
2. **Services**: Complete 10-15 services, difficulty scaling with star rating
3. **Between Services**: Shop phase — buy/upgrade scoops, manage bag
4. **Boss Services**: Every 5 services, a special challenge (food critic, catering gig)
5. **Run End**: Either pay final rent and "win", or go bankrupt

### Service Structure

Each service:
- 5-10 customers to serve
- Customer arrival rate increases as service progresses
- Optional bonus objective revealed at start
- Shop available after service completes

### Boss Encounters

**Food Critic (Service 5)**
- Single customer with massive, complex bento
- Very low patience
- Must achieve perfect fill or lose 2 stars

**Catering Gig (Service 10)**
- 3 identical bentos, must fill simultaneously
- Shared timer across all three
- Huge tip if all three are perfect

**Grand Opening (Service 15 — Final)**
- Rapid-fire customers, highest complexity
- Survival mode: serve as many as possible before bankruptcy
- Score = total earnings

---

## Meta-Progression

Between runs, players unlock:

### Permanent Unlocks

- **New Scoop Shapes**: Pentominoes, specialty shapes
- **New Ingredients**: Rare ingredient types
- **Starting Bonuses**: Begin run with extra cash, specific scoop, etc.
- **Alien Species**: New customer types with unique mechanics
- **Difficulty Modifiers**: Optional challenges for bonus unlocks

### Unlock Currency

"Prestige Points" earned based on:
- Highest star rating achieved
- Total earnings in run
- Bonus objectives completed
- Special achievements

---

## Technical Architecture

### Core Modules

```
src/
├── game/
│   ├── state.ts          # Central game state management
│   ├── service.ts        # Service phase logic
│   ├── shop.ts           # Between-service shop
│   └── scoring.ts        # Payment calculation, combos
├── entities/
│   ├── scoop.ts          # Scoop class and modifiers
│   ├── bento.ts          # Bento grid and fill logic
│   ├── customer.ts       # Customer behavior and patience
│   └── bag.ts            # Deck/bag management (draw, shuffle)
├── systems/
│   ├── placement.ts      # Grid placement validation
│   ├── matching.ts       # Ingredient preference matching
│   ├── progression.ts    # Star rating, difficulty scaling
│   └── economy.ts        # Payments, rent, currency
├── ui/
│   ├── components/       # React components
│   ├── canvas/           # Game rendering (Canvas or DOM)
│   └── animations/       # Placement, scoring feedback
├── data/
│   ├── shapes.ts         # Polyomino definitions (data-driven)
│   ├── customers.ts      # Alien species and customer templates
│   ├── bentos.ts         # Bento templates by difficulty
│   └── modifiers.ts      # All modifier definitions
└── utils/
    ├── grid.ts           # Grid manipulation utilities
    ├── polyomino.ts      # Rotation, normalization, collision
    └── random.ts         # Seeded RNG for runs
```

### Key Technical Considerations

1. **Shape Flexibility**: All polyomino logic should work for any size. Tetrominoes are config, not code.

2. **Grid Operations**: Core operations needed:
   - `canPlace(bento, scoop, position, rotation)` → boolean
   - `place(bento, scoop, position, rotation)` → new Bento state
   - `calculateFill(bento)` → { filled, total, gaps, overlaps }
   - `rotateShape(shape, times)` → rotated shape
   - `flipShape(shape)` → mirrored shape

3. **State Management**: Consider using Zustand or similar for React, with clear separation between:
   - Persistent state (bag contents, unlocks, run progress)
   - Session state (current service, active bentos)
   - Transient state (UI, animations)

4. **Rendering**: Two viable approaches:
   - **DOM-based**: Simpler, CSS Grid for layout, good for prototyping
   - **Canvas-based**: Better performance, smoother animations, more work

   Recommend starting DOM-based for faster iteration.

5. **Seeded Randomness**: All RNG should be seeded so runs can be:
   - Reproducible for debugging
   - Shareable ("try this seed!")
   - Fair for potential competitive modes

---

## MVP Scope (v0.1)

### Must Have

- [ ] Basic game loop: place scoops, fill bentos, earn tips
- [ ] All 7 tetromino shapes
- [ ] Rotation (90° increments)
- [ ] 3 bento templates (8, 12, 16 squares — rectangles only)
- [ ] Patience meter (turn-based)
- [ ] Tip calculation (fill percentage only)
- [ ] Single service with 5 customers
- [ ] Visual feedback for valid/invalid placement

### Nice to Have (v0.1)

- [ ] Perfect fill bonus
- [ ] Basic shop (buy one new scoop)
- [ ] 2 ingredient types with preferences
- [ ] Sound effects

### Deferred

- Modifier system
- Star rating / difficulty scaling
- Meta-progression
- Complex bento shapes
- Boss encounters
- Combo system

---

## Open Design Questions

1. **Queue Visibility**: Exactly how many upcoming scoops visible? 2 feels right, but needs playtesting.

2. **Overlap Penalty**: Currently overlaps waste squares. Alternative: overlaps damage scoops (wear system)?

3. **Scoop Retirement**: Should players be able to remove scoops from bag? If so, cost or free?

4. **Customer Arrival**: Fixed pattern per service, or responsive to player pace?

5. **Failure Softening**: When player goes bankrupt, any consolation? (Partial unlocks, "try again with bonus"?)

6. **Tutorial**: Integrated first-run tutorial, or separate "practice mode"?

---

## Art Direction Notes

### Visual Style

- **Color Palette**: Warm, inviting diner colors (cream, coral, teal) + alien accents (neon, iridescent)
- **Aliens**: Friendly, quirky designs — think Monsters Inc. meets food truck culture
- **Bentos**: Clean grid aesthetic, clearly readable compartments
- **Scoops**: Distinct silhouettes, ingredient colors as fills

### Audio

- **Music**: Lo-fi chill beats, slight space-age synth undertones
- **SFX**: Satisfying placement sounds (think Tetris "lock" but softer), happy customer chimes

---

## References & Inspirations

- **Tetris** — spatial reasoning, flow state
- **Slay the Spire** — roguelike structure, build optimization
- **Patchwork** — polyomino placement, spatial economy
- **Overcooked** — restaurant chaos (thematic, not mechanical)
- **Wilmot's Warehouse** — spatial organization satisfaction
- **Balatro** — deckbuilder innovation outside traditional cards
