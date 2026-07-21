# AFK Game Engine

Browser-based idle/incremental game engine with swappable **content packs**. The **Dr Dirt** theme (`dr-dirt`) models civilization from the Stone Age through the AI Age.

## Quick start

### Play the game

Requires a local HTTP server (ES modules + content fetch):

```bash
python3 scripts/serve.py
# open http://127.0.0.1:8765/index.html
```

**Dr Dirt** loads by default. Tap to earn **Stone**, buy generators, prestige, and ascend through historical eras.

### Debug / playtesting URLs

| URL param | Effect |
|-----------|--------|
| `?debug=1` | Enables dev tools panel (speed multipliers, resource grants, formula inspector) |
| `?selftest=1` | Runs built-in assertions on load; results in `window.__AFK_SELFTEST_RESULTS__` |
| `?automation=1` | Exposes `window.__AFK_TEST__` API (used by E2E tests) |

Browser console API (with `?automation=1` or after load):

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
index.html              Entry point (Vue CDN + ES module bootstrap)
content/
  registry.json         Registered games + defaultContentId
  dr-dirt/              Dr Dirt JSON content (canonical, in registry)
  cosmic-time-factory/  Legacy demo pack (on disk, not in registry)
docs/
  GENERATOR_CHANGES.md  Generator rebalance changelog
js/
  main.js               App bootstrap + GameFacade
  afk.js                Engine module barrel export
  game/                 Engine source
  ui/                   Vue UI components (ES modules)
  test/                 Playthrough automation (loaded on demand)
scripts/
  serve.py              Local HTTP server for play + tests
  bundle.py             Content validation (Python source of truth)
  test.py               Validate + E2E tests
tests/                  Content validation + Playwright smoke tests
prompts/                Design/spec prompts (reference only)
```

Edit JSON under `content/<pack-id>/`. After changes, run `python3 scripts/test.py`.

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

Ascension gates live in `content/dr-dirt/ascension.json`. **Bronze Age ascension** grants **1000 `copperOre` + 1000 `tinOre`**.

### Production modifiers

**Flat × (1 + Σ Increased) × Π More**

- **Increased** — consumable boosts of the same type add together.
- **More** — equipment, upgrades, and permanent bonuses multiply together.
- **Purchase vs operation** — `costResources` = build price; `consumes[]` = ongoing fuel per second.

See [`docs/GENERATOR_CHANGES.md`](docs/GENERATOR_CHANGES.md) for generator rebalance details.

---

## Validate & test

```bash
python3 scripts/test.py          # content validation + E2E smoke tests
python3 scripts/test.py --content # JSON validation only
python3 scripts/test.py --e2e     # browser tests only
python3 scripts/bundle.py         # content validation only
```

| Flag | Purpose |
|------|---------|
| `--quick` | Skip content validation step |
| `--content` | JSON validation only |
| `--e2e` | Browser smoke tests only |
| `--full-playthrough` | Exhaustive 100× sim (slow, opt-in) |

---

## Adding content packs

1. Create `content/<id>/` with standard JSON files + `manifest.json`
2. Register in `content/registry.json` under `games[]`
3. Run `python3 scripts/test.py`

Unregistered packs (e.g. `cosmic-time-factory/`) remain on disk for reference and are still validated by `scripts/bundle.py`.

---

## Content packs

| ID | In registry | Primary currency |
|----|-------------|------------------|
| `dr-dirt` | Yes (default) | Stone |
| `cosmic-time-factory` | No (legacy folder) | Time shards |
