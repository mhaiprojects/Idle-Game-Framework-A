# Dr Dirt — AI-Led Development Plan

> **Owner:** AI development agent  
> **Game:** Dr Dirt (Stone Age → AI Age idle/incremental)  
> **Last updated:** 2026-07-30  
> **Status:** ✅ Complete — Phases 1–4 implemented

---

## Vision

Make Dr Dirt feel like a complete civilization journey with a satisfying **mid-game build variety** and a **long-tail end-game loop** that keeps players engaged after reaching the AI Age. The UI should feel alive: responsive taps, clear progress, celebratory milestones, and a cohesive earth-toned theme.

---

## Design Principles (Constraints)

These come from the existing framework spec and must not be violated:

1. **Vue 3 UI only** — no business logic in components; all actions via `GameFacade`
2. **FormulaEngine owns all math** — no numeric literals outside JSON config (except 0/1/−1 in engine)
3. **Config-driven content** — generators, upgrades, achievements, etc. live in `content/dr-dirt/*.json`
4. **Unified unlock schema** — `unlockConditions` with AND/OR operators everywhere
5. **Artifacts never cleared** on prestige, ascension, or transcendence
6. **Ascension is one-way** — difficulty never decreases
7. **Generator chain validation** must pass CI (`python3 scripts/test.py`)

---

## Phase 1 — End-Game Loop Foundation ✅

### 1.1 Prestige Shop Persistence Fix
- `resetPrestigeShopAllocation: false` — shop purchases are permanent investments

### 1.2 Transcendence System (Post-AI Meta Layer)
- Unlock: AI Age (tier 4) + 3 lifetime prestiges
- Currency: Cosmic Insight from intelligence this run (logarithmic)
- 8 permanent transcendence upgrades; Transcendence tab (🌌)

### 1.3 End-Game Content Expansion
- Long-tail achievements, AI-era events, upgrades, prestige bonuses

### 1.4 UI & Engagement Polish
- Theme color, milestone celebrations, tab badges, tap polish, max-tier banner

---

## Phase 2 — Automation & Challenges ✅

### 2.1 Smart Automation (Settings tab)
- Auto-buy generator, auto-buy upgrade, auto-prestige with threshold slider

### 2.2 Rotating Directives (Transcendence tab)
- 3 daily challenges; +25% Cosmic Insight when all complete

### 2.3 Tutorial Flow
- 5-step overlay; skip/replay from Settings

---

## Phase 3 — Depth & Variety ✅

### 3.1 Generator Synergies
- `content/dr-dirt/synergies.json` — 6 combo bonuses via ModifierSystem
- Stats panel shows active/inactive synergies

### 3.2 Additional AI-Era Generators
- Quantum Processor → quantumFlops
- Neural Mesh → meshNodes
- Mesh Amplifier & Quantum Entanglement upgrades

### 3.3 Paragon Layer (Post-Transcendence)
- Unlocks at 10 transcendences; Paragon Essence currency
- Infinite +0.1%/level global scaling; Paragon tab (💎)

### 3.4 Sound & Haptics
- `SoundSystem.js` — Web Audio tones + optional `navigator.vibrate`
- Wired to tap, purchase, achievement, prestige events via EventBus

---

## Phase 4 — Platform & Content ✅

### 4.1 Second Content Pack
- `cosmic-time-factory` registered in `content/registry.json`

### 4.2 Seasonal Events
- 5 date-gated events (`startDate`/`endDate` MM-DD) in `events.json`
- `EventSystem._isEventInSeason()` filters out-of-season events

### 4.3 Cloud Save / Export QR
- `ShareSaveManager.js` — base64 share codes (`AFK1:` prefix)
- Export/import in Settings; QR via api.qrserver.com; cross-pack import support

---

## Content Balance Targets

| Metric | Pre-Phase 1 | Phase 1 | Phase 3 (Target) | **Current** |
|--------|-------------|---------|------------------|-------------|
| Achievements | 11 | 17 | 25+ | **25** |
| AI-era upgrades | 1 | 3 | 5 | **5** |
| Events | 7 | 10 | 15 | **15** |
| End-game currencies | 1 | 2 | 3 | **3** |
| Prestige shop reset | Yes | No | No | **No** |

---

## How to Verify Changes

```bash
python3 scripts/serve.py
# Open http://127.0.0.1:8765/index.html

python3 scripts/test.py          # validation + E2E
python3 scripts/test.py --full-playthrough  # exhaustive sim
```

Debug: `?debug=1` | Automation: `?automation=1`

---

## Change Log

| Date | Phase | Summary |
|------|-------|---------|
| 2026-07-30 | 1 | Transcendence system, prestige shop fix, content expansion, UI polish |
| 2026-07-30 | 2 | Smart automation, daily directives, tutorial overlay, run tracking |
| 2026-07-30 | 3–4 | Synergies, AI generators, Paragon, sound/haptics, seasonal events, share/QR save, cosmic-time-factory |
