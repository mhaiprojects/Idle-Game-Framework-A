# AFK Game Engine

Browser-based idle/incremental game engine with swappable **content packs**. Development focuses on **Dr Dirt** (`dr-dirt`) — civilization from the Stone Age through the AI Age. **Cosmic Time Factory** remains registered as a secondary demo pack.

**Repository:** [github.com/mhaiprojects/Idle-Game-Framework-A](https://github.com/mhaiprojects/Idle-Game-Framework-A)

## Quick start

### Play the game

Requires a local HTTP server (ES modules + content fetch):

```bash
python3 scripts/serve.py
```

The script prints the full game URL (e.g. `http://127.0.0.1:8765/index.html`). If the game is already running on the starting port, it reuses that instance instead of starting a duplicate. If another app occupies the port, it tries the next port up to 10 times.

**Dr Dirt** loads by default. Tap to earn **Stone**, buy generators, prestige, and ascend through historical eras.

Edit game balance directly in `content/dr-dirt/*.json` — no generator scripts required.

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
  dr-dirt/              Dr Dirt JSON content (primary, default)
  cosmic-time-factory/  Demo pack (registered, secondary)
docs/
  ARCHITECTURE.md       Engine vs content, module map
  CONTENT_CONVENTIONS.md Dr Dirt design rules
  GENERATOR_CHANGES.md  Generator rebalance changelog
  GENERATOR_AUDIT.md    Name/description/production audit
  plans/                Completed content-logic plans
js/
  main.js               App bootstrap + GameFacade
  afk.js                Engine module barrel export
  game/                 Engine source (content-agnostic)
  ui/                   Vue UI components (ES modules)
  test/                 Playthrough automation (loaded on demand)
scripts/
  serve.py              Local HTTP server for play + tests
  test.py               Content validation + E2E tests
tests/                  Content validation + Playwright smoke tests
prompts/                Design/spec prompts (reference only)
```

Edit JSON under `content/<pack-id>/`. After changes, run `python3 scripts/test.py`.

---

## Save versions

- **Save schema:** `2.0.0` (engine format in `SaveManager.js`).
- **Content version:** each pack declares `framework.save.gameVersion` in its JSON (Dr Dirt: `1.0.0`).

Saves store the content `gameVersion`. When it changes, the player is prompted for a **hard reset** (all progress lost). Full save migration will be added after stable release.

Bump `gameVersion` in `content/<pack>/framework.json` whenever a breaking content or balance change requires players to start fresh.

---

## Dr Dirt — progression map

### Eras (ascension tiers)

| Tier | Era | Icon | Unlocks (summary) |
|------|-----|------|-------------------|
| 0 | Stone Age | 🪨 | Primitive gatherers, campfire, mason, prospector |
| 1 | Bronze Age | 🥉 | Copper/tin mines & smelters, bronze forge, characters, drops |
| 2 | Medieval | 🏰 | Iron chain, blacksmith → gold, trade caravan, artifacts |
| 3 | Industrial | 🏭 | Coal, steel forge, food packaging, power, broadcast tower, random events |
| 4 | AI Age | 🧠 | Internet hub, data center, ML lab, AGI core, quantum processor, neural mesh |

Ascension gates live in `content/dr-dirt/ascension.json`. **Bronze Age ascension** grants **1000 `copperOre` + 1000 `tinOre`**.

### UI — generator requirements

The generator panel shows a single **Requirements** section in two columns: **buy cost** (left) and **unlock status** (right). Labels are in `content/dr-dirt/defaults.json`.

### Production modifiers

**Flat × (1 + Σ Increased) × Π More**

- **Increased** — consumable boosts of the same type add together.
- **More** — equipment, upgrades, and permanent bonuses multiply together.
- **Purchase vs operation** — `costResources` = build price; `consumes[]` = ongoing fuel per second.

See [`docs/GENERATOR_CHANGES.md`](docs/GENERATOR_CHANGES.md) for generator rebalance details and [`docs/CONTENT_CONVENTIONS.md`](docs/CONTENT_CONVENTIONS.md) for design rules.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Address already in use` on serve | Another app holds the port — `serve.py` tries the next port up to 10 times, or reuse an already-running game instance |
| E2E tests fail on Playwright | Run `.venv-test/bin/playwright install chromium` (see [`tests/README.md`](tests/README.md)) |
| Stale save after content bump | Hard reset when prompted, or clear `localStorage` key from `framework.save.storageKey` |

---

## Validate & test

```bash
python3 scripts/test.py          # content validation + E2E smoke tests
python3 scripts/test.py --content # JSON validation only
python3 scripts/test.py --e2e     # browser tests only
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
2. Set `framework.save.gameVersion` in `framework.json`
3. Register in `content/registry.json` under `games[]`
4. Run `python3 scripts/test.py`

Engine code stays generic; game-specific values live in JSON under `content/<pack-id>/`.

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Engine modules, runtime, repo |
| [`docs/CONTENT_CONVENTIONS.md`](docs/CONTENT_CONVENTIONS.md) | Dr Dirt design rules (smelter/forge, primitive chain, unlock gates) |
| [`docs/GENERATOR_CHANGES.md`](docs/GENERATOR_CHANGES.md) | Rebalance changelog |
| [`docs/GENERATOR_AUDIT.md`](docs/GENERATOR_AUDIT.md) | Open description/name polish recommendations |
| [`docs/plans/dr-dirt-content-logic-completed.md`](docs/plans/dr-dirt-content-logic-completed.md) | Completed content-logic implementation log |

---

## Content packs

| ID | In registry | Default | Primary currency |
|----|-------------|---------|------------------|
| `dr-dirt` | Yes | Yes | Stone |
| `cosmic-time-factory` | Yes | No | Time shards |
