# Content Expansion — Task List (Pending Approval)

> Request: Major content and systems expansion (equipment tiers, consumables, characters, artifacts, achievements, prestige, generators).  
> **Status:** Approved for implementation — work tracked below.

---

## 1. Equipment (Common / Rare / Epic per slot)

1.1 Add **27 equippable items** — Common, Rare, and Epic variant for each of the 9 equipment slots (cape, helmet, amulet, mainHand, body, offHand, boots, belt, pet).

1.2 Define tier-specific base effects and rarity multipliers (Common < Rare < Epic) in config; retire or remap legacy single-rarity equipables.

1.3 Implement **dynamic equipment drop tables** weighted by:
- Dominant **generator category** among owned generators (temporal / stellar / quantum / void)
- **Total generators purchased** (quantity owned across all generators)
- **Current ascension tier**

1.4 Add drop-rate config schema in `drops.json` / `framework.json` and engine logic in `DropSystem` to roll tiered equipment on tick/click drops.

1.5 Update inventory UI labels/icons for new tier naming (Common / Rare / Epic).

---

## 2. Consumables (+10)

2.1 Add **10 new consumable items** with varied effects (production boost, tap boost, cost reduction, offline bonus, etc.).

2.2 Add consumables to appropriate drop tables with ascension-gated availability where needed.

2.3 Ensure action-bar eligibility and More Info modals work for all new consumables.

---

## 3. Characters (+5) & Effects section

3.1 Add **5 new characters** with distinct `baseStats` (global, click, category, or hybrid) and active skills.

3.2 Define unlock conditions tied to ascension tier, prestige count, or generator milestones.

3.3 Add **Effects** section on character cards (below Equipment) summarizing **combined passive modifiers** from:
- Character base stats (when active)
- All equipped items on that character

3.4 Reuse shared effect-description helpers; show one row per effect type with aggregated multiplier/value.

3.5 Include Effects summary in character More Info modal.

---

## 4. Artifacts (+20)

4.1 Add **20 new artifacts** (24 total) with varied permanent effects.

4.2 Gate artifact drops behind **specific generator ownership** and **ascension tier** in drop table config.

4.3 Replace single `artifactDrop` table with tiered / conditional artifact drop entries.

4.4 Update Artifact panel and collection UI for larger set (no pagination required initially).

---

## 5. Achievements (+30)

5.1 Add **30 new achievements** (38 total).

5.2 **All achievements grant passive effects** — standardize rewards to `modifierUnlock` with permanent gameplay modifiers (no one-time resource-only rewards for new entries; migrate existing 8 where feasible).

5.3 Cover diverse requirement types: taps, generators, resources, prestiges, ascensions, artifacts, equipment, characters.

5.4 Ensure `ModifierSystem` applies unlocked achievement passives (already supported — verify for all reward shapes).

---

## 6. Prestige requirements (scaling & multi-currency)

6.1 Prestige minimum requirements **scale +20% per lifetime prestige** (compound: `base × 1.2^lifetimePrestiges`).

6.2 Require **multiple resource types** at once (not primary currency only), limited to resources **available at current ascension tier**.

6.3 Add `prestigeMinimumBase` config with per-tier resource thresholds; engine builds scaled `prestigeMinimum` at runtime.

6.4 Show scaled requirements with progress bars on Ascension panel (reuse `UnlockRequirementsList`).

---

## 7. Prestige Shards — rules, milestones & UI

7.1 Document shard gain formula in config defaults (logarithmic run value → shards).

7.2 **Next shard milestone** scales **exponentially** harder; only count run earnings from **ascension-available resources** toward shard progress.

7.3 Add `getPrestigeShardProgress()` returning one **progress bar per sub-requirement** (per weighted resource contribution toward next shard).

7.4 Add **Prestige Shards** explainer section on Ascension panel with progress bars and projected gain.

7.5 Update More Info modal for prestige soft reset with full rules text.

---

## 8. Prestige shop allocation reset

8.1 On prestige perform: **reset `purchasedBonuses` levels to 0** (allocation reset).

8.2 **Keep accumulated Prestige Shards** (`meta.prestige.currency`) and lifetime totals.

8.3 Update lost/kept lists in UI — shop **levels** lost, **shards** kept.

---

## 9. Prestige shop (12 options, 3 per ascension)

9.1 Expand to **12 prestige bonuses** total.

9.2 Unlock **3 shop tiers** per ascension tier (0–3): first 3 at ascension 0, next 3 at tier 1, etc. via `requiredFeature: prestigeShop:tierN`.

9.3 Add `prestigeShop:tier1`, `prestigeShop:tier3` feature unlocks to `ascension.json` (tier2 exists).

9.4 Balance costs, max levels, and effects across all 12 options.

---

## 10. Generators (12 total, 3 per ascension)

10.1 Expand to **12 generators** — **3 unlocked per ascension tier** (tiers 0–3).

10.2 Re-map `requiredFeature` / ascension `unlockedFeatures` to generator groups: `generators:tier0` … `generators:tier3` (or per-generator features).

10.3 Add **2 new generators** to fill tier 3 (and rebalance production chain validation).

10.4 Adjust unlock conditions so tier-0 generators depend only on tier-0 resources; higher tiers gate behind ascension features.

10.5 Run generator chain validation after restructure.

---

## 11. Integration & ship

11.1 Regenerate bundles (`scripts/bundle-for-file-protocol.py`).

11.2 Update `user-request-changes.draft.prompt.md` changelog entry.

11.3 Smoke-test: drops, prestige, ascension, character effects, shop tiers, generator gating.

11.4 Git commits per logical chunk (config / engine / UI).

---

## Approval

- [ ] User approves task breakdown  
- [x] Implementation started after list added to draft prompt  

---

*Related: [user-request-changes.draft.prompt.md](./user-request-changes.draft.prompt.md)*
