# Dr Dirt Content Logic — Completed

**Completed:** 2026-08-07  
**Status:** All pending polish items from the content-logic plan are implemented.

Run `python3 scripts/test.py` after further content changes.

## Implemented items

### Primitive chain cleanup

- **Woodcutter:** wood primary only (removed game side output)
- **Hunter:** game primary only (removed plants side output)
- **Farmer:** plants primary only (removed food side output)
- **Campfire:** food from game + wood; removed copperOre unlockGate
- **Gatherer:** display name → **Gatherer** (`codeName` remains `rockGatherer`)

### Bronze / medieval tuning

- **Prospector:** ironOre trace at 0.02/s (gated by bronzeSmith character)

### Industrial / AI age

- **dataCenter**, **agiCore:** cost rebalance in JSON
- **factoryShift** event: coal + steel costs via `effects[]`

### Engine support

- **Era-gated drops:** `dropRequirements` in `drops.json`; `DropSystem._filterDropEntries()`
- **Multi-effect events:** `effects[]` in `ModifierSystem` / `EventSystem`
- **Save versioning:** `framework.save.gameVersion` + `SaveManager` hard-reset prompt
- **gameVersion** in cosmic + dr-dirt `framework.json`

### Dev tooling

- **`scripts/bundle.py` deleted** — validation merged into `scripts/test.py`
- **`scripts/serve.py`:** port probe, reuse running instance, try up to 10 ports, print full URL

### UI

- Generator **Requirements** section: single block, two columns (buy cost | unlock status)
- `UnlockRequirementsList` `bare` prop for nested layout
- Section labels in `defaults.json`: `requirements`, `buyCost`, `unlockStatus`

## Documentation added

- [`docs/CONTENT_CONVENTIONS.md`](../CONTENT_CONVENTIONS.md)
- [`docs/GENERATOR_AUDIT.md`](../GENERATOR_AUDIT.md)
- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- Updated [`docs/GENERATOR_CHANGES.md`](../GENERATOR_CHANGES.md) polish section

## Follow-ups (optional, from audit)

See [`docs/GENERATOR_AUDIT.md`](../GENERATOR_AUDIT.md) for description polish and Quantum Processing rename — not yet applied to JSON.
