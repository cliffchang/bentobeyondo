# Progression System Design

## Narrative Frame
You're an aspiring chef trying to prove to your parents that you can make it. They think you should give up and go back to school. You need to build your restaurant's reputation to show them you're doing something special.

**Win condition**: Your parents come eat at the restaurant. Satisfy them while keeping the restaurant running.

## Reputation System (replaces Rent)

### Yelp-style 5-Star Rating
- Survival mechanic is your restaurant's star rating (Yelp parody)
- Served customers leave reviews; patience-expired customers leave bad reviews
- **Graded reviews**: fill %, PERFECTO, and DELICIOSO all affect review quality (not just binary served/angry)

### Decay via Exponential Moving Average
Recent performance always matters — a bad day hurts even in late game.

```
new_rating = 0.3 * today_avg + 0.7 * old_rating
```

- Prevents late-game immunity (old good reviews can't carry you forever)
- Allows recovery from a bad day if you bounce back
- Feels like natural reputation drift

### Milestone Checkpoints
Instead of daily rent, you must hit star thresholds by specific days:
- e.g., Day 5 → ★2.5, Day 10 → ★3.0, Day 15 → ★3.5, etc. (numbers TBD)
- Failing a checkpoint = game over (parents pull you out)
- Breathing room between checkpoints — one bad day won't kill you if you recover
- Creates natural "act" structure with building tension before each deadline
- **Parent dialogue at checkpoints** for personality ("★3.0... not bad, but your cousin just got into law school.")
- **Mini-boss days** at checkpoints (day 5, 10, etc.) — special challenge customers

### Fame Scaling (Difficulty Ramp)
- Higher star rating attracts more demanding customers
- Creates a self-balancing difficulty curve:
  - Good play → higher rating → harder customers → natural pressure
  - The game finds an equilibrium that upgrades help you push past
- Replaces the linear rent escalation ($100/day) with an organic curve

## Customer Attributes
Customers gradually gain more attributes as fame increases:

| Attribute          | Effect                                        |
|--------------------|-----------------------------------------------|
| Good tipper        | More money (upgrade fuel)                     |
| Harsh reviewer     | Low fill % hurts rating more                  |
| Influencer         | Review weight is 2x (risk + reward)           |
| Food blogger       | Only cares about DELICIOSO                    |
| Picky eater        | Smaller patience / higher expectations        |

Attributes create emergent risk/reward decisions — an influencer is both your best and worst customer.

## Economy

### Money = Upgrade Currency Only
- Money is earned from serving customers (PERFECTO/DELICIOSO bonuses still boost payment)
- Money is spent on upgrades between days
- Money is **not** a survival mechanic — reputation is

### Upgrade Shop (Between Days)
- **Rotating stock**: 3 random upgrades offered each day, purchased with money
- Already-purchased one-time upgrades leave the pool; next tier replaces previous for tiered upgrades
- Two tracks: **Menu** (scoop/ingredient upgrades) and **Kitchen** (shop/meta upgrades)

**Tier gating** (controls when upgrades can appear in shop):
- Tier 1 (always): Add to Menu, Flip Scoop, Bonsai Tree, Scoop Reroll I
- Tier 2 (day 3+): Sauce I, Mise en Place, Koi Pond, Scoop Reroll II
- Tier 3 (day 7+): Sauce II/III, Zen Garden, Osusume (requires 3 menu ingredients)

#### Menu Track (Scoop Upgrades)

| Upgrade | Type | Cost | Effect |
|---|---|---|---|
| Add to Menu | Repeatable (per ingredient) | $200 | Adds ingredient scoops to bag + customers can now request it |
| Flip Scoop | One-time | $250 | Mirror/flip the current scoop (new key binding) |
| Sauce I | One-time unlock | $300 | Unlock sauce: fills up to 4 remaining empty cells, 1 use/day |
| Sauce II | Tiered (after I) | $250 | +1 sauce use per day |
| Sauce III | Tiered (after II) | $300 | +1 sauce use per day |
| Osusume | One-time | $400 | Any premium ingredient counts as DELICIOSO. Requires 3 menu ingredients to appear in shop |

#### Kitchen Track (Shop Upgrades)

| Upgrade | Type | Cost | Effect |
|---|---|---|---|
| Bonsai Tree | One-time (decor) | $200 | +1 base patience for all customers |
| Koi Pond | One-time (decor) | $250 | +1 base patience for all customers |
| Zen Garden | One-time (decor) | $300 | +1 base patience for all customers |
| Mise en Place | One-time | $300 | See 3rd scoop in preview |
| Scoop Reroll I | One-time | $200 | Discard + redraw current scoop, 1 use per day |
| Scoop Reroll II | Tiered (after I) | $250 | +1 reroll use per day |

~12-14 total purchases across a full run. At ~$500-800 earned per day, players can afford 1-2 per day — enough to specialize but not buy everything.

## PERFECTO (Redefined)
- **PERFECTO = zero wasted cells** across all scoop placements on a bento
- A "wasted" cell is any scoop cell that lands on: already filled, blocked, or outside the bento
- Scoop count is irrelevant — 5 precise placements is just as perfect as 3
- Scales naturally with any scoop size (tetrominos, sauce, etc.)
- Track `wastedCells: number` on Customer, incremented on each placement
- PERFECTO triggers when customer departs with `wastedCells === 0`

### Sauce Mechanic
- Special scoop that fills **all remaining empty cells** in a bento, up to 4 cells
- Inherently zero-waste (only fills empty cells)
- Acts as a "finisher" — place regular scoops to get close, sauce to complete
- Not available at start — unlocked via shop
- Uses per day upgradeable: 1 → 2 → 3

## Open Questions
- Exact milestone thresholds and timing
- Mini-boss design for checkpoint days
- Price tuning (placeholder values — adjust with playtesting)
- Parent character design and dialogue
- Endgame: parents as final "boss" customers — what makes them special?
- Non-multiple-of-4 bentos: when to introduce them? (Sauce makes them viable)
- How many premium ingredients total? (Currently 2 active: salmon, wagyu)
