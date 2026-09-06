# Dr Dirt — Content Conventions

Design rules for editing `content/dr-dirt/*.json`. Follow these when adding or rebalancing generators, resources, events, and drops.

## Engine vs content

- **Engine** (`js/game/*`, `js/core/*`) stays content-agnostic — no hardcoded Dr Dirt resource or generator IDs.
- **Content** (`content/dr-dirt/*.json`) holds all balance, names, unlock chains, and era gates.
- After JSON edits, run `python3 scripts/test.py`.

## Naming

| Pattern | Meaning | Examples |
|---------|---------|----------|
| **Smelter** | One ore → one ingot (+ fuel) | Copper Smelter, Tin Smelter, Iron Smelter |
| **Forge** | Two or more ingots → alloy (+ fuel) | Bronze Forge, Steel Forge |
| **Mine** | Dedicated ore extraction | Copper Mine, Iron Mine, Coal Mine |
| **Gatherer / Hunter / Farmer** | Raw resource collection | Gatherer (stone), Hunter (game), Farmer (plants) |

### Display name vs `codeName`

Keep stable `codeName` values for saves and code references. Display names can change freely.

| codeName | displayName | Notes |
|----------|-------------|-------|
| `rockGatherer` | Gatherer | Tutorial/achievements say "Gatherer" |

## Primitive production chain (canonical)

Each primitive generator has **one primary output**. Unlock gates are separate roles, not mixed into primary identity.

| Generator | Primary | Side / unlock outputs | Consumes |
|-----------|---------|----------------------|----------|
| Gatherer | stone | wood → woodcutter | — |
| Woodcutter | wood | — | — |
| Hunter | game | — | — |
| Farmer | plants | — | — |
| Charcoal Kiln | charcoal | — | wood |
| Campfire | food | — | wood, game |
| Mason | brick | — | stone |
| Prospector | — (survey) | stone (bonus), copperOre, tinOre, ironOre (gated) | — |

**Do not** add game to Woodcutter, plants to Hunter, or food to Farmer primary outputs.

## Purchase vs operation

| Field | When charged | Example |
|-------|--------------|---------|
| `costResources` | One-time per purchase | stone ×2, brick ×3 |
| `consumes[]` | Every tick while producing | charcoal 0.12/s |

## Production roles (`produces[].role`)

| Role | Purpose |
|------|---------|
| `primary` | Main output shown as generator identity |
| `bonus` | Extra yield (e.g. prospector stone, AGI compute bonus) |
| `unlockGate` | Small trace output that gates the next generator unlock |
| `secondary` | Co-product (e.g. Neural Mesh intelligence) |

### Unlock-gate side outputs

Some `unlockGate` outputs are **abstract progression hints**, not literal physics:

| Generator | unlockGate | Meaning |
|-----------|------------|---------|
| Trade Caravan | coal | Distant lands export coal knowledge → Coal Mine |
| Steel Forge | food | Steel tooling enables industrial packaging |
| Iron Smelter | gold | Trace precious metals fund blacksmith unlock |
| Power Plant | data | Early telemetry seeds information age |

Descriptions should mention these when players might see them in rate breakdowns.

## Gated production (`requiresUnlock`)

Prospector iron ore uses `requiresUnlock` with `characterUnlocked: bronzeSmith`. The engine skips that produce line until the condition is met (`FormulaEngine.js`).

## Era-gated drops

`drops.json` entries may include `dropRequirements` (ascension tier, generator owned, etc.). `DropSystem._filterDropEntries()` enforces era-appropriate loot.

## Multi-effect events

Events may use `effects[]` (array of modifier payloads) instead of a single `effect`. `EventSystem` and `ModifierSystem` apply all entries.

## Tin ore source

There is **no Tin Mine**. Tin ore comes from **Prospector** only; **Tin Smelter** consumes it. Copper has a dedicated **Copper Mine** after Bronze Age ascension.

## Categories vs ascension

Generator `category` (primitive, bronze, medieval, industrial, digital) drives upgrade multipliers. Some generators unlock before their category's ascension tier (e.g. Internet Hub at tier 3 feature gate, category `digital`).

## Save versioning

- **Save schema:** `SaveManager` uses format `2.0.0`.
- **Content version:** `framework.save.gameVersion` in each pack's `framework.json` (Dr Dirt currently `1.0.0`).
- Bump `gameVersion` when a breaking balance or structure change requires players to hard-reset.

## UI conventions

Generator panel **Requirements** section uses a two-column layout:

- **Left:** buy cost (`costResources`)
- **Right:** unlock status (`unlockConditions`)

Labels live in `content/dr-dirt/defaults.json` under `sections.requirements`, `buyCost`, `unlockStatus`.

## Related docs

- [`GENERATOR_CHANGES.md`](GENERATOR_CHANGES.md) — rebalance changelog
- [`GENERATOR_AUDIT.md`](GENERATOR_AUDIT.md) — name/description/production audit
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — engine module map
