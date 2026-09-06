# AFK Game Engine — Architecture

High-level map of the codebase. Game-specific values live in JSON under `content/<pack-id>/`; engine code under `js/` is content-agnostic.

## Runtime

```
index.html
  └── js/main.js          GameFacade, Vue app bootstrap
        └── js/afk.js     Module barrel (engine exports)
```

- **ES modules only** — served over HTTP (`python3 scripts/serve.py`). No bundled JS; no `file://` workflow.
- **Vue 3** (CDN) for UI components in `js/ui/`.
- **Default content:** `dr-dirt` via `content/registry.json`.

## Core modules (`js/core/`)

| Module | Role |
|--------|------|
| `ConfigManager.js` | Load content JSON, format labels, unlock requirement display |
| `SaveManager.js` | Persist state; save format `2.0.0`; hard-reset on `gameVersion` mismatch |
| `ProgressTracker.js` | Lifetime stats, stagnation hints |

## Game systems (`js/game/`)

| Module | Role |
|--------|------|
| `FormulaEngine.js` | Rates, costs, unlock evaluation, `requiresUnlock` on produces |
| `ModifierSystem.js` | Stacking modifiers (Increased vs More); multi-effect events |
| `systems/DropSystem.js` | Random drops; era-gated filtering via `dropRequirements` |
| `systems/EventSystem.js` | Timed random events; `effects[]` support |

## UI (`js/ui/`)

Vue single-file-style components (`.vue.js`). Generator panel uses a two-column Requirements layout (buy cost | unlock status).

## Content pack layout

```
content/<pack-id>/
  manifest.json
  framework.json      gameVersion, tiers, UI defaults
  generators.json
  resources.json
  upgrades.json
  ascension.json
  events.json
  drops.json
  ...
```

Register packs in `content/registry.json`.

## Testing

```
scripts/test.py
  ├── tests/automation/content_validator.py   JSON validation (source of truth)
  ├── tests/test_content.py                   pytest content checks
  └── tests/e2e/                              Playwright smoke + playthrough
```

`scripts/bundle.py` was removed; validation merged into `test.py`.

## Development policy

- **Focus:** Dr Dirt (`dr-dirt`) — primary default pack.
- **Secondary:** Cosmic Time Factory remains registered for demo/hot-swap.
- **Balance edits:** JSON only; run `python3 scripts/test.py` after changes.
- **Breaking changes:** Bump `framework.save.gameVersion` in the affected pack.

## Repository

Remote: [github.com/mhaiprojects/Idle-Game-Framework-A](https://github.com/mhaiprojects/Idle-Game-Framework-A)

## Related docs

- [`CONTENT_CONVENTIONS.md`](CONTENT_CONVENTIONS.md) — Dr Dirt design rules
- [`GENERATOR_CHANGES.md`](GENERATOR_CHANGES.md) — rebalance history
- [`tests/README.md`](../tests/README.md) — automation API
