# Dr Dirt — Generator & Upgrade Audit

**Audited:** 2026-08-07  
**Scope:** display name, description, and production alignment in `generators.json` and `upgrades.json`.

Use this when polishing copy or deciding whether to change JSON vs description only.

## Generators — aligned (no change needed)

Woodcutter, Hunter, Farmer, Charcoal Kiln, Campfire, Mason, Copper Mine, Copper Smelter, Tin Smelter, Bronze Forge, Iron Mine, Blacksmith, Coal Mine, Food Packaging Factory, Broadcast Tower, Internet Hub, ML Laboratory, AGI Core, Neural Mesh.

## Generators — recommended description updates

| Generator | Issue | Recommendation |
|-----------|-------|----------------|
| **Gatherer** | Description is stone-only; also produces wood (unlockGate) | Add: "occasionally finds usable timber" |
| **Prospector** | Tin has no dedicated mine | Clarify copper, tin, and (later) iron traces in description |
| **Iron Smelter** | Produces gold unlockGate; not in description | Mention trace precious metals / blacksmith funding |
| **Trade Caravan** | Produces coal unlockGate; not in description | Mention learning of distant coal deposits |
| **Steel Forge** | Produces food unlockGate (canning unlock, not literal food) | Mention steel tooling unlocks industrial packaging |
| **Power Plant** | Produces data unlockGate | Mention telemetry seeding information age |
| **Data Center** | Produces compute unlockGate | Mention compute spun off for model training |
| **Quantum Processor** | Description says "compute"; produces `quantumFlops` | Use "quantum flop operations" wording |

## Generators — optional

| Generator | Note |
|-----------|------|
| **Internet Hub** | Category `digital` but unlocks at tier 3; consider recategorizing to `industrial` if era upgrades should match unlock timing |
| **Neural Mesh** | Secondary intelligence co-production could be noted in description |

## Content metadata fix (authoring)

In `generators.json`, prospector `tinOre` has `"forGenerator": "copperMine"` — should be `"tinSmelter"` (does not affect gameplay).

## Upgrades — aligned

Sharper Tools, Better Foraging, Efficient Labor, Bronze Casting, Feudal Logistics, Industrial Efficiency, Neural Optimization, Consciousness Upload, Mesh Amplifier, Quantum Entanglement.

## Upgrades — recommended change

| Upgrade | Issue | Recommendation |
|---------|-------|----------------|
| **Quantum Processing** | Name/icon imply `quantumFlops`; effect buffs **`compute`** | **Rename to "Compute Optimization"** (preferred), or clarify description as classical compute only |

`Quantum Entanglement` already covers `quantumFlops` — avoid two "quantum" upgrades on different resources without clear labeling.

## Priority if implementing

1. Quantum Processing rename/clarify
2. Gatherer description
3. Trade Caravan, Steel Forge, Iron Smelter descriptions
4. Quantum Processor description
5. Power Plant, Data Center descriptions
6. Prospector `forGenerator` metadata fix
