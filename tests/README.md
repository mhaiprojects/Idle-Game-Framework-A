# Test automation (agents & CI)

Automated checks to validate content packs, bundles, and full browser gameplay.

## Quick start

```bash
python3 scripts/run-test-automation.py
```

This will:

1. Regenerate JS bundles from content packs
2. Validate all `content/*` JSON (generator chains, primary resource, tiers)
3. Launch a local HTTP server and run Playwright E2E tests in headless Chromium

## Options

| Command | Purpose |
|---------|---------|
| `python3 scripts/run-test-automation.py --quick` | Skip bundle regen |
| `python3 scripts/run-test-automation.py --content` | Content/bundle validation only (no browser) |
| `python3 scripts/run-test-automation.py --e2e` | Browser tests only |
| `python3 scripts/run-test-automation.py --full-playthrough` | Exhaustive 100× playthrough (on request) |

Default pytest runs **exclude** `full_playthrough` tests. Run them explicitly with `--full-playthrough` or:

```bash
.venv-test/bin/pytest tests/e2e/test_full_playthrough.py -v -m full_playthrough -s --override-ini='addopts=-ra --tb=short'
```

The playthrough simulates **100× speed**, buys generators/upgrades/prestige bonuses as they unlock, visits UI tabs, prestiges/ascends, and equips items. Each action logs to the browser console as `[AFK-PLAYTHROUGH] [OK|FAIL|INFO|SKIP] category: message` — pytest forwards these lines to the terminal when run with `-s`. Up to **20 attempts** per content pack until all features are covered.

## First-time setup

The runner creates `.venv-test/` and installs dependencies from `requirements-test.txt` automatically.

Manual setup:

```bash
python3 -m venv .venv-test
.venv-test/bin/pip install -r requirements-test.txt
.venv-test/bin/playwright install chromium
```

## In-browser test API

When loaded with `?automation=1`, the game exposes `window.__AFK_TEST__`:

| Method | Description |
|--------|-------------|
| `getContentId()` | Active content pack id |
| `getPrimary()` | Primary resource quantity |
| `tap()` | Perform tap |
| `addPrimary(n)` | Grant primary currency (testing) |
| `buyGenerator(code)` | Purchase generator |
| `setTab(id)` | Switch UI tab |
| `switchContent(id)` | Hot-swap game/theme |
| `runFullPlaythrough(opts)` | 100× sim: buy generators/upgrades/items as they unlock (logs to console with `[AFK-PLAYTHROUGH]`) |
| `setSpeed(n)` | Set game loop speed multiplier |
| `runSelfTest()` | Run built-in assertion suite |

Self-test only: open `index.html?selftest=1` — results in `window.__AFK_SELFTEST_RESULTS__`.

## Agent workflow

After editing content or engine code:

1. `python3 scripts/run-test-automation.py`
2. If E2E fails, read pytest output; use `?automation=1` in browser or Cursor browser MCP
3. Fix issues, re-run until green

## Test layout

```
tests/
  automation/content_validator.py  # shared JSON validation
  test_content.py                  # pytest: content + bundles
  e2e/
    conftest.py                    # HTTP server fixture
    test_game_smoke.py             # boot, tap, buy, game selector
    test_full_playthrough.py       # opt-in 100x exhaustive playthrough
```
