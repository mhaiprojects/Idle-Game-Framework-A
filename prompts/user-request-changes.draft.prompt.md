# User Request Change Log

> Living record of follow-up changes requested after the initial implementation prompt (`idle-game-framework.final.prompt.md`).  
> **Update this file** whenever the user asks for a new change — append a timestamped entry; do not silently edit `*.final.prompt.md` unless the user explicitly asks to promote framework spec changes.

---

## Template for new entries

```markdown
### Y-M-D-H-M-S — Short title

**Request:** (user’s words or paraphrase)

**Implemented:**
- Bullet list of files/behavior changed

**Framework prompt note:** (optional — if idle-game-framework.final.prompt.md should be updated)
```

**Timestamp format:** `Y-M-D-H-M-S` — year, month, day, hour, minute, second (e.g. `2026-6-21-14-30-0`).

---

## How to use (agent)

1. When the user requests a change, implement it in code/config.
2. Append a new entry under **Change log** using the template and a `Y-M-D-H-M-S` timestamp.
3. If the change alters framework rules (not just this game’s config), note whether `idle-game-framework.final.prompt.md` should be updated later.
4. After source/config edits, run `python3 scripts/bundle-for-file-protocol.py`.
5. **Git:** stage the changed files and create a commit whose message matches the change entry title (see **Git workflow** below).

---

## Git workflow

- Repository root: project directory (`CursorP2`).
- **After each user-requested change:** one commit with a short message derived from the change log entry, e.g. `Standardize unlock requirements listing`.
- Do not batch unrelated changes into one commit.
- Bundles (`js/*-bundle.js`, `js/config-bundle.js`) are committed alongside source edits.
- Do not commit secrets (`.env`, credentials).

**Initial history:** all work through the latest change log entry is captured in the bootstrap commit when the repo was first created.

---

## Change log

### 2026-6-21-0-0-0 — Initial build from spec

**Request:** Build the game from the MD spec (Cosmic Time Factory, phases 0–10).

**Implemented:**
- Full idle game: config JSON, engine, UI, bundles, `file://` bootstrap
- Theme: Time Shards primary currency, sci-fi, indigo/violet/amber, Inter font

---

### 2026-6-21-0-0-1 — Playable via `file://` (no server)

**Request:** Open `index.html` directly without a static server.

**Implemented:**
- Classic scripts only (no runtime ES modules)
- `js/config-bundle.js`, `js/afk-engine.bundle.js`, `js/afk-ui.bundle.js`
- `scripts/bundle-for-file-protocol.py` to regenerate shipped artifacts
- Vue via `vue.global.prod.js` CDN

---

### 2026-6-21-0-0-2 — CORS on `main.js`

**Request:** Fix `Cross-Origin Request Blocked` for `file://`.

**Implemented:** Removed `type="module"` from local scripts; bootstrap uses IIFE + `window.AFK` / `window.AFK_UI`.

---

### 2026-6-21-0-0-3 — Global redeclaration error

**Request:** Fix `Uncaught SyntaxError: redeclaration of non-configurable global property loadAllConfigs`.

**Implemented:** Bundles wrapped in IIFEs; expose only `AFK_CONFIG`, `AFK`, `AFK_UI`; `main.js` calls `AFK.*` without destructuring globals.

---

### 2026-6-21-0-0-4 — Generator chain, buy UX, display names

**Request:**
- Fix generator production chain validation warnings
- Disable Buy until affordable
- Use friendly resource display names (not raw `codeName`)

**Implemented:**
- Updated `config/generators.json` chain (e.g. temporalEngine → quantumFlux; cosmicFoundry gates)
- `canBuy` / disabled buy buttons in GeneratorPanel
- `ConfigManager` / UI helpers for `displayName` in costs and conditions

---

### 2026-6-21-0-0-5 — Remove PPS concept

**Request:** PPS is the same as primary currency; remove PPS terminology.

**Implemented:**
- `calculatePrimaryCurrencyRate`, `calculatePrimaryCurrencyBreakdown`
- Config keys: `percentOfPrimaryCurrencyRate`, `primaryCurrencyMultiplier`, `primaryCurrencyDecreasePerPrestige`
- UI shows “Time Shards/s” not “PPS”
- Save compat: `peakPPSThisRun` fallback reads retained where needed

**Framework prompt note:** Terminology section in final prompt already uses primary currency / primary currency rate.

---

### 2026-6-21-0-0-6 — Implement everything from prompts folder

**Request:** Check `prompts/` and implement remaining gaps.

**Implemented (high level):**
- Prestige shop UI, equipment equip/unequip, achievement reward types, stagnation hints
- Locked tabs, artifacts tab, tooltips, resource delta floats, event banner
- ProgressTracker real checks, save migration v1.1.0, dev formula inspector
- `validateGeneratorChain` hard fail at bundle time
- Display helpers on ConfigManager

---

### 2026-6-21-0-0-7 — Remove generator categories

**Request:** Simple flat list for all generators (no collapsible categories).

**Implemented:**
- GeneratorPanel flat list; removed `getGroupedByCategory` from GeneratorSystem
- Removed category header CSS

---

### 2026-6-21-0-0-8 — Lock modal, rich references, prestige tab unlocks

**Request:**
- Clicking LOCK opens a modal explaining unlock requirements
- Generator costs and other references use name & icon where possible
- Characters & Inventory unlocked after **1st prestige**
- Artifacts after **2nd prestige**

**Implemented:**
- `UnlockModal` component; locked tabs and feature locks open requirement modal with progress
- `formatResourceCostEntries`, `formatUnlockConditionDetail`, icons in costs/conditions
- `config/prestige.json` → `featureUnlocks`:
  - `tab:characters`, `tab:inventory`, `systems:drops` → `lifetimePrestiges ≥ 1`
  - `tab:artifacts` → `lifetimePrestiges ≥ 2`
- Character unlock conditions aligned to prestige counts
- Removed tab unlocks from ascension tier features (characters/inventory/artifacts)

---

### 2026-6-21-14-0-0 — Inline unlocks, info modals, character equip UI

**Request:**
- Use lock modal only when necessary; otherwise show unlock requirements inline
- Generators list unlock requirements inline
- Sidebar tabs use modal when space is tight
- Add UI for equipping items to characters
- Blue “!” more-info button on consumables, characters, etc. opening description/benefits/effects modal

**Implemented:**
- `UnlockRequirementsList` inline component for generators, upgrades, characters
- `UnlockModal` reserved for locked sidebar tabs only
- `MoreInfoButton` + `InfoModal` with `getEntityInfo()` / `describeEffect()` in main.js
- CharacterPanel equipment slots with equip select + unequip
- InventoryPanel improved equip controls + more info on items
- Generator/upgrade/artifact panels wired with more-info buttons

---

### 2026-6-21-14-30-0 — Fix duplicate const in UI bundle

**Request:** Fix `redeclaration of const UnlockRequirementsList` and `AFK_UI is undefined`.

**Implemented:**
- `strip_ui()` in `bundle-for-file-protocol.py` deduplicates import `const` declarations across panel files

---

### 2026-6-21-18-42-42 — Standardize unlock requirements listing

**Request:** Generator unlock requirements should list all conditions consistently with the modal; standardize and reuse shared unlock-requirements logic across UI.

**Implemented:**
- `ConfigManager`: `flattenUnlockConditions`, `buildUnlockRequirements`, `getCombinedUnlockRequirements`, `getUnlockRequirementsInfo`, `formatUnlockRequirementsText`; refactored `getFeatureUnlockInfo` / `getUnlockInfoFromConditions` to use shared builders
- `main.js`: precomputes `unlockRequirements` on generator/upgrade/character display data via `getCombinedUnlockRequirements`; generator info modal uses same combined list
- Panels (`GeneratorPanel`, `UpgradePanel`, `CharacterPanel`) and `UnlockModal` all render `UnlockRequirementsList` from precomputed `unlockRequirements`
- Removed duplicate per-panel formatting props from `App.vue.js`

---

## Related files

- [idle-game-framework.final.prompt.md](./idle-game-framework.final.prompt.md) — full implementation spec
- [ai-prompt-defaults.final.prompt.md](./ai-prompt-defaults.final.prompt.md) — generic agent communication rules
