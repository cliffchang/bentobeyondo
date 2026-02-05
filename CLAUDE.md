# Bento Beyondo

A spatial puzzle roguelike where players fill customer bento boxes with tetromino-shaped scoops.

## Tech Stack
- React 18 + TypeScript + Vite
- Pure CSS (no framework)
- No backend — client-side only

## Architecture

### Core Game Logic (`src/core/`)
- `types.ts` — Type definitions. `BentoGrid` is a **class** (not interface) with computed `size` property
- `game.ts` — State machine. Key constants: `ACTIVE_CUSTOMER_SLOTS=3`, `AVG_SCOOP_SIZE=4`
- `placement.ts` — Scoop placement logic, handles overflow/waste
- `bentos.ts` — Bento patterns with random rotation/reflection for variety

### Key Design Decisions
- **In-place customer replacement**: When served, new customer appears in same slot (no shifting)
- **Arrow keys switch bentos**: Moving past left/right edge switches to adjacent bento
- **Dynamic patience**: `ceil(bentoSize / AVG_SCOOP_SIZE) * ACTIVE_CUSTOMER_SLOTS + 2`
- **Perfect serve**: When `scoopsUsed <= ceil(bentoSize / 4)` (minimum possible)

### State Flow
1. `placeCurrentScoop()` — places scoop, increments `scoopsUsed`, advances turn
2. `advanceScoop()` — moves next→current, draws new next, refills bag if empty
3. `decreasePatience()` — all customers lose 1 patience
4. `processCustomers()` — checks for full bentos (served) or 0 patience (angry), sets `lastServedEvent` for animations

### Animation System
- `lastServedEvent` stores `{ slotIndex, payment, isPerfect }`
- Counter.tsx renders overlay animation, clears after 1.5s via `CLEAR_SERVED_EVENT`

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```
