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

### 2026-6-21-19-0-38 — Unlock UI, consumable info, skill badges, equipment grid

**Request:**
- Show unlock requirements on object cards and in More Info modals
- Consumables: more-info icon with full details, short description, effect indicator
- Active skills on action bar show small character icon on skill slot
- Character equip UI: 3×3 grid (cape/helmet/amulet, hands/body, boots/belt/pet), pull from owned items, one character per item

**Implemented:**
- `InfoModal` renders `UnlockRequirementsList` when entity info includes `requirements` (generators, upgrades, characters)
- Consumable inventory cards: description, effect badge, enhanced item info modal (`Provides`, `Owned`, `Usage`)
- `SkillSlot`: character icon badge overlay + tooltip with character name
- `EquipmentGrid` component with 9-slot layout from `framework.json`; click slot to pick from available owned items
- `items.json`: expanded equipables for all nine slots; save migration `1.2.0` for legacy slot names
- `GameState.equipItem`: unequips item from any character before re-equipping (unique item rule)

---

### 2026-6-21-19-15-0 — Fix missing generator unlock requirements

**Request:** Unlock requirements info missing from generators and modal.

**Implemented:**
- UI bundle load order: `UnlockRequirementsList` and `EquipmentGrid` defined before components that import them
- `getEntityInfo` re-evaluates on UI tick so modal requirements stay current

---

### 2026-6-21-19-30-0 — Numeric unlock labels and ascension naming

**Request:** Use numeric unlock requirements (actual costs, not “Can afford”); consistent ascension naming as `Ascension N: Story Name`.

**Implemented:**
- `ConfigManager.formatAscensionTierLabel`, `formatFirstPurchaseCostLabel`, enhanced `formatUnlockConditionDetail` with current/required values
- `canAffordFirstPurchase` shows full first-purchase cost breakdown
- Ascension panel and feature unlock requirements use `Ascension 1: Awakened Realm` format
- `FormulaEngine.getConditionProgress` extended for afford, ascension tier, upgrade, lifetime prestiges

---

### 2026-6-21-20-0-0 — Animated progress bars for requirements and costs

**Request:** Unlock requirements, buy costs, levels, and progress numbers should show animated progress bars linked to resource/object availability.

**Implemented:**
- Shared `ProgressBar` and `ResourceProgressList` components with animated fill transitions
- `UnlockRequirementsList` always shows progress bars (including when met, green at 100%)
- Generator buy costs: per-resource held/required bars on unlocked cards
- Upgrade buy costs and level progress bars; prestige shop cost/level bars
- Ascension milestone checklist uses shared `ProgressBar`
- `ConfigManager.buildProgressEntry` / `buildCostProgressEntries` helpers

---

### 2026-6-21-21-0-0 — Per-resource generator bars, equip modal, rarity stacks

**Request:** Generator unlock/purchase requirements each get their own progress bar; equipment selection via modal sorted by rarity; stackable equipment with copy-based power; rarity multiplies base values.

**Implemented:**
- `canAffordFirstPurchase` expands to one progress row per cost resource in unlock lists
- `EquipSlotModal` on character grid slots — items sorted by rarity with effect preview
- `framework.equipment`: rarity multipliers, stack bonus per copy (+2% default)
- All equipables have rarity + `stackable: true`; power = base × rarity × stack copies
- Multiple characters can equip same item if enough inventory copies exist

---

### 2026-6-21-22-0-0 — Generator card production section

**Request:** Each generator card should show Production with resources generated and percentage of total production per resource.

**Implemented:**
- `FormulaEngine.calculateGeneratorProduction` — per-generator rates and % of global resource totals
- Generator cards show Production section with icon, name, `/s` rate, and % badge per produced resource

---

### 2026-6-21-22-30-0 — Consistent section labeling across UI

**Request:** Clearly label sections (e.g. Purchase Requirements, Production) on generator cards and apply the same grouping standard everywhere including modals and tabs.

**Implemented:**
- New `CardSection` component with `card-section` / `panel-section` styles and shared headings
- Generator cards: Production, Purchase Requirements, Unlock Requirements
- Upgrade/character/ascension/inventory/stats/settings/progress/artifact/achievement panels use labeled sections
- Info, unlock, equip, prestige/ascend, and offline modals use the same section pattern

---

### 2026-6-21-23-0-0 — Defaults config, section icons, card spacing

**Request:** Move all defaults (icons, calculation fallbacks) to a Defaults config file; prefix section titles with icons; separate card sections with line and space.

**Implemented:**
- `config/defaults.json` — icons, labels, calculations, equipment fallbacks, section/panel/tab definitions, unlock label templates
- `ConfigManager` helpers: `getDefaultIcon`, `getDefaultLabel`, `getDefaultCalc`, `getSection`, `getPanel`, `getTabs`
- Engine/UI read fallbacks from defaults instead of hardcoded literals
- `CardSection` / `PanelHeader` resolve titles and icons from defaults via `sectionKey` / `panelKey`
- Card sections use stronger top border and spacing between grouped blocks

---

### 2026-6-21-23-30-0 — Clear prestige/ascension and unlock requirements in UI

**Request:** Prestige and ascension requirements should be clear; all unlock requirements accessible on object cards and/or via More Info.

**Implemented:**
- Prestige card shows Prestige Requirements with progress bars; ascension card shows Ascension Requirements
- Prestige shop locked bonuses use full UnlockRequirementsList instead of a one-line lock reason
- Achievement cards show requirement progress when locked; More Info on prestige, ascension, shop bonuses, achievements
- Info modals for prestige, ascension, prestigeBonus, and achievement with full requirement details

---

### 2026-6-21-24-0-0 — Save system hardening and save management UI

**Request:** Apply save system recommendations; UI for managing, deleting, restoring, and reverting saves.

**Implemented:**
- `SaveManager`: checksum verification on load; auto-save vs rolling backup split; `listBackups`, `restoreBackup`, `deleteBackup`, `deleteAllBackups`, `getCurrentMeta`
- Import requires confirm; integrity warnings for bad checksums; `GAME_RESET` emitted on full reset
- Immediate save after prestige/ascension/import; flush save on tab hide / page unload
- Offline gains always applied; welcome-back modal only when away ≥ minimum seconds
- `GameState.toJSON()` strips ephemeral UI; load sanitizes transient UI fields; `devMode` only from `?debug=1`
- Settings panel: current save info, Save Now, export/import, rolling backup list with restore/delete, revert to latest, delete current save, reset game
- Labels/sections in `defaults.json`; save list styling in `css/styles.css`

---

### 2026-6-21-24-30-0 — Character equip slot lists inventory gear

**Request:** Clicking an equipment slot on the character page should list relevant available items from the Inventory tab.

**Implemented:**
- Equip slot modal reads owned equipables for that slot from `state.inventory` (same items as Inventory tab)
- Fixed callback wiring via App/GameFacade methods (no fragile `.bind` in template)
- Equipment grid cells are buttons; modal teleported to `body` for reliable display
- `getItemDisplay()` for equipped item labels; empty-slot hint points to Inventory tab

**Follow-up fix:** Modal now builds list via `ConfigManager.buildEquipSlotOptions` with live `uiTick` refresh; lists all slot gear (owned/unowned); equipment added to drop tables; inventory tab shows owned gear only.

---

## Related files

- [idle-game-framework.final.prompt.md](./idle-game-framework.final.prompt.md) — full implementation spec
- [ai-prompt-defaults.final.prompt.md](./ai-prompt-defaults.final.prompt.md) — generic agent communication rules
