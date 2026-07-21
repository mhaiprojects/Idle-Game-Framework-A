# AFK Game Engine

Browser-based idle/incremental game engine with swappable **content packs**. The **Dr Dirt** theme (`dr-dirt`) models civilization from the Stone Age through the AI Age.

## Quick start

### Play the game

1. Open `index.html` in a browser (works via `file://` — no build step required).
2. **Dr Dirt** loads by default (switch to Cosmic Time Factory in Settings if needed).
3. Tap to earn **Stone** (primary currency), buy generators, prestige, and ascend through historical eras.

Optional local server (same as automated tests):

```bash
python3 -m http.server 8765
# open http://localhost:8765/index.html
```

### Debug / playtesting URLs

| URL param | Effect |
|-----------|--------|
| `?debug=1` | Enables dev tools panel (speed multipliers, resource grants, formula inspector) |
| `?selftest=1` | Runs built-in assertions on load; results in `window.__AFK_SELFTEST_RESULTS__` |

Browser console API (always available after load):

```js
window.__AFK_TEST__.switchContent('dr-dirt')
window.__AFK_TEST__.addPrimary(50000)
window.__AFK_TEST__.buyGenerator('rockGatherer')
window.__AFK_TEST__.setSpeed(10)
window.__AFK_TEST__.runFullPlaythrough()
```

See [`tests/README.md`](tests/README.md) for the full automation API.

---

## Project layout

```
index.html              Entry point (Vue + bundled JS)
content/
  registry.json         Game list + defaultContentId
  dr-dirt/              Dr Dirt JSON content (canonical source)
  cosmic-time-factory/  Original demo theme
js/
  main.js               App bootstrap + GameFacade
  config-bundle.js      Generated: all content packs inlined
  afk-engine.bundle.js  Generated: game engine
  afk-ui.bundle.js      Generated: Vue UI components
  game/                 Engine source (edit these, then rebundle)
  ui/                   UI source
scripts/
  bundle.py                      Validate content / optional bundle (legacy)
  test.py                        Validate + E2E tests
tests/                  Content validation + Playwright smoke tests
```

**Important:** Edit JSON under `content/dr-dirt/`, not the generated `js/config-bundle.js`. After content or engine changes, rebundle and run tests (see below).

---

## Dr Dirt — progression map

### Eras (ascension tiers)

| Tier | Era | Icon | Unlocks (summary) |
|------|-----|------|-------------------|
| 0 | Stone Age | 🪨 | Primitive gatherers, campfire, mason, prospector |
| 1 | Bronze Age | 🥉 | Copper/tin mines & smelters, bronze forge, characters, drops |
| 2 | Medieval | 🏰 | Iron chain, blacksmith → gold, trade caravan, artifacts |
| 3 | Industrial | 🏭 | Coal, steel forge, food packaging, power, broadcast tower, random events |
| 4 | AI Age | 🧠 | Internet hub, data center, ML lab, AGI core |

Ascension gates and per-tier feature flags live in `content/dr-dirt/ascension.json`. **Bronze Age ascension** grants **1000 `copperOre` + 1000 `tinOre`** on ascend (`onAscend.grantResources`).

The resource bar shows the current era icon badge (ascension tier).

### Generators by tier

Story order — each generator’s **primary output** matches its name:

| Tier | Generators |
|------|------------|
| 0 | `rockGatherer` → `woodcutter` → `hunter` → `farmer` → `charcoalKiln` → `campfire` → `mason` → `prospector` |
| 1 | `copperMine` → `copperSmelter` → `tinSmelter` → `bronzeForge` |
| 2 | `ironMine` → `ironSmelter` → `blacksmith` → `tradeCaravan` |
| 3 | `coalMine` → `steelForge` → `foodPackagingFactory` → `powerPlant` → `broadcastTower` |
| 4 | `internetHub` → `dataCenter` → `mlLaboratory` → `agiCore` |

Tier membership is also defined in `content/dr-dirt/framework.json` → `generatorTiers`.

### Resource chain (high level)

```
stone, wood ──► brick, charcoal
game + wood (campfire) ──► food
plants (farmer) ──► bulk food (foodPackagingFactory: steel + game + plants)
*Ore (mines) ──► ingots (smelters) ──► alloys (forges)
iron + charcoal (blacksmith) ──► gold
coal + iron (steelForge) ──► steel
broadcastTower / internetHub ──► data ──► compute ──► intelligence
```

Resources unlock per ascension tier in `framework.json` → `resourceUnlockByTier`.

### Key early-game flow

1. **Rock Gatherer** produces stone; unlock-gate output helps reach **Woodcutter**.
2. **Hunter** → raw `game`; **Campfire** cooks `game` + **wood fuel only** → `food`.
3. **Farmer** produces `plants` (not food directly).
4. **Prospector** finds bonus stone; after **Bronze Smith** character unlock, may produce trace `ironOre` (`requiresUnlock` on produce).
5. Ascend to Bronze Age → start ore smelting chain with granted starter ore.

### Production modifiers

Net production uses: **Flat × (1 + Σ Increased) × Π More**

- **Increased** — consumable boosts of the same type add together (e.g. two +50% Increased = +100%).
- **More** — equipment, upgrades, and permanent bonuses multiply together.
- **Purchase vs operation** — `costResources` is the one-time build price; `consumes[]` is ongoing fuel/input per second.

See [`docs/GENERATOR_CHANGES.md`](docs/GENERATOR_CHANGES.md) for the full generator rebalance log (before/after rates, purchase costs, and real-world logic).

---

## Content authoring rules (Dr Dirt)

Canonical JSON lives in `content/dr-dirt/` — edit those files directly; run the bundle script after changes.

### Naming (#0)

| Kind | Pattern | Examples |
|------|---------|----------|
| Raw ore | `{metal}Ore` | `copperOre`, `tinOre`, `ironOre` |
| Ingot | bare metal name | `copper`, `tin`, `iron` |
| Smelter | one ore → one ingot | `copperSmelter`, `ironSmelter` |
| Forge | 2+ ingots/inputs → alloy | `bronzeForge`, `steelForge` |
| Factory | multi-input packaging | `foodPackagingFactory` |

Do **not** use Foundry/Mill suffixes. Mines output ore only, never ingots.

### Generator fields (engine)

- **`requiredFeature`**: e.g. `generators:tier2` — gated by ascension tier.
- **`consumes[]`**: resources deducted per tick before production (scaled with generator count).
- **`produces[].requiresUnlock`**: cross-unlock gates (`characterUnlocked`, `generatorUnlocked`, `generatorOwned`).
- **Events**: use `resourceMultiplier` for scoped boosts (not global food multipliers).

### Saves & theme switching

- Dr Dirt save key: `afk_dr_dirt_save` (see `manifest.json` / `framework.json`).
- Selected game stored in `localStorage` key `afk_selected_content`.
- Switching themes in Settings loads a separate save per content pack.

---

## Rebundle & validate

After editing `content/` or `js/game/` / `js/ui/` source:

```bash
python3 scripts/test.py
```

Or one command (bundles + all tests):

```bash
python3 scripts/test.py
```

| Flag | Purpose |
|------|---------|
| `--quick` | Skip bundle regen |
| `--content` | JSON validation only |
| `--e2e` | Browser smoke tests only |
| `--full-playthrough` | Exhaustive 100× sim (slow, opt-in) |

First run installs `.venv-test/` and Playwright Chromium automatically.

---

## Content packs

| ID | Name | Primary currency |
|----|------|------------------|
| `cosmic-time-factory` | Cosmic Time Factory | Time shards |
| `dr-dirt` | **Dr Dirt (default)** | Stone |

Register new themes in `content/registry.json` and add a folder under `content/<id>/` with the standard JSON files (`framework.json`, `generators.json`, `resources.json`, etc.).

---

## Branch note

Dr Dirt content and engine extensions are developed on **`THEME-DR-DIRT`**. Merge/rebase from main before large content edits if working across branches.
