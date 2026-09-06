# Dr Dirt Generator Rebalance

Production formula: `(Flat base rate) × (1 + Σ Increased) × Π More`

- **Purchase (`costResources`)** — one-time build cost (mostly stone/brick/food).
- **Operation (`consumes`)** — ongoing inputs per second while producing.
- **Duplicate outputs removed** — each generator has at most one output line per resource+role.

See also [`CONTENT_CONVENTIONS.md`](CONTENT_CONVENTIONS.md) for current design rules.

---

## 2026-08 content logic polish (canonical current state)

Further cleanup after the initial rebalance. **Source of truth:** `content/dr-dirt/generators.json`.

| Generator | displayName | Primary | Removed / changed |
|-----------|-------------|---------|-------------------|
| Gatherer (`rockGatherer`) | Gatherer | stone + wood unlockGate | Renamed from "Rock Gatherer" |
| Woodcutter | Woodcutter | wood only | Removed game unlockGate |
| Hunter | Hunter | game only | Removed plants unlockGate |
| Farmer | Farmer | plants only | Removed food unlockGate |
| Campfire | Campfire | food | Removed copperOre unlockGate |
| Prospector | Prospector | ore traces | ironOre 0.02/s, gated by bronzeSmith |

Unlock-gate side outputs (coal from Trade Caravan, food trace from Steel Forge, gold from Iron Smelter) remain intentional — see CONTENT_CONVENTIONS.md.

---

## Intentional multi-generator resources

| Resource | Generators | Reason |
|----------|------------|--------|
| food | campfire, foodPackagingFactory | Stone cooking vs industrial packaging |
| gold | blacksmith, tradeCaravan | Craft sales vs long-distance trade |
| data | broadcastTower, internetHub, dataCenter | Analog → routed → hyperscale pipeline |

## Per-generator changes

### Gatherer (`rockGatherer`)

Display name **Gatherer**. Manual gathering ~70 kg/hour stone; incidental wood finds while quarrying.

**costResources**
- Before: `[{"resource":"stone","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1}]`

**produces**
- Before: `[{"resource":"stone","amount":1,"role":"primary"},{"resource":"wood","amount":0.3,"role":"unlockGate","forGenerator":"woodcutter"}]`
- After: `[{"resource":"stone","amount":0.8,"role":"primary"},{"resource":"wood","amount":0.2,"role":"unlockGate","forGenerator":"woodcutter"}]`

---

### Woodcutter (`woodcutter`)

Felling ~2 m³ timber/hour; wood only (2026-08 polish removed game side output).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1}]`

**produces**
- Before: `[{"resource":"wood","amount":1,"role":"primary"},{"resource":"game","amount":0.4,"role":"unlockGate","forGenerator":"hunter"}]`
- After (rebalance): `[{"resource":"wood","amount":0.6,"role":"primary"},{"resource":"game","amount":0.15,"role":"unlockGate","forGenerator":"hunter"}]`
- **Current:** `[{"resource":"wood","amount":0.6,"role":"primary"}]`

---

### Hunter (`hunter`)

Successful hunt ~6 kg meat/hour; game only (2026-08 polish removed plants side output).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":1}]`

**produces**
- Before: `[{"resource":"game","amount":1,"role":"primary"},{"resource":"plants","amount":0.2,"role":"unlockGate","forGenerator":"farmer"}]`
- After (rebalance): `[{"resource":"game","amount":0.25,"role":"primary"},{"resource":"plants","amount":0.12,"role":"unlockGate","forGenerator":"farmer"}]`
- **Current:** `[{"resource":"game","amount":0.25,"role":"primary"}]`

---

### Farmer (`farmer`)

Subsistence plot ~1.5 kg crops/hour; plants only (2026-08 polish removed food side output).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":1},{"resource":"game","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":1}]`

**produces**
- Before: `[{"resource":"plants","amount":1,"role":"primary"},{"resource":"food","amount":0.15,"role":"unlockGate","forGenerator":"campfire"}]`
- After (rebalance): `[{"resource":"plants","amount":0.4,"role":"primary"},{"resource":"food","amount":0.08,"role":"unlockGate","forGenerator":"campfire"}]`
- **Current:** `[{"resource":"plants","amount":0.4,"role":"primary"}]`

---

### Charcoal Kiln (`charcoalKiln`)

Pyrolysis ~25% wood mass to charcoal (historical kiln yield).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":2}]`
- After: `[{"resource":"stone","multiplier":2},{"resource":"wood","multiplier":2}]`

**consumes**
- Before: `[{"resource":"wood","amount":0.5}]`
- After: `[{"resource":"wood","amount":0.6}]`

**produces**
- Before: `[{"resource":"charcoal","amount":0.8,"role":"primary"},{"resource":"charcoal","amount":0.05,"role":"bonus","forGenerator":"copperSmelter"}]`
- After: `[{"resource":"charcoal","amount":0.15,"role":"primary"}]`

---

### Campfire (`campfire`)

Cooks raw game into food using wood fuel (2026-08 polish removed copperOre side output).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"wood","multiplier":2},{"resource":"game","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":2},{"resource":"wood","multiplier":2}]`

**consumes**
- Before: `[{"resource":"wood","amount":0.3},{"resource":"game","amount":0.4}]`
- After: `[{"resource":"wood","amount":0.15},{"resource":"game","amount":0.25}]`

**produces**
- Before: `[{"resource":"food","amount":1.5,"role":"primary"},{"resource":"copperOre","amount":0.02,"role":"unlockGate","forGenerator":"prospector"}]`
- After (rebalance): `[{"resource":"food","amount":0.35,"role":"primary"},{"resource":"copperOre","amount":0.015,"role":"unlockGate","forGenerator":"prospector"}]`
- **Current:** `[{"resource":"food","amount":0.35,"role":"primary"}]`

---

### Mason (`mason`)

~5:1 stone waste when cutting bricks (Roman masonry ratios).

**costResources**
- Before: `[{"resource":"stone","multiplier":2},{"resource":"wood","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":2},{"resource":"wood","multiplier":1}]`

**consumes**
- Before: `[{"resource":"stone","amount":0.5}]`
- After: `[{"resource":"stone","amount":1.0}]`

**produces**
- Before: `[{"resource":"brick","amount":0.6,"role":"primary"},{"resource":"brick","amount":0.1,"role":"unlockGate","forGenerator":"prospector"}]`
- After: `[{"resource":"brick","amount":0.2,"role":"primary"}]`

---

### Prospector (`prospector`)

Surveying finds surface ore traces; iron trace after bronze metallurgy knowledge.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":1},{"resource":"wood","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":1}]`

**produces**
- Before: `[{"resource":"stone","amount":0.5,"role":"bonus"},{"resource":"copperOre","amount":0.08,"role":"unlockGate","forGenerator":"copperMine"},{"resource":"tinOre","amount":0.06,"role":"unlockGate","forGenerator":"copperMine"},{"resource":"ironOre","amount":0.02,"role":"bonus","requiresUnlock":{"type":"characterUnlocked","character":"bronzeSmith"},"forGenerator":"ironMine"}]`
- After: `[{"resource":"stone","amount":0.3,"role":"bonus"},{"resource":"copperOre","amount":0.06,"role":"unlockGate","forGenerator":"copperMine"},{"resource":"tinOre","amount":0.045,"role":"unlockGate","forGenerator":"copperMine"},{"resource":"ironOre","amount":0.015,"role":"bonus","requiresUnlock":{"type":"characterUnlocked","character":"bronzeSmith"},"forGenerator":"ironMine"}]`

---

### Copper Mine (`copperMine`)

Shallow Bronze Age pit ~25 kg ore/hour per crew.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"food","multiplier":2},{"resource":"copperOre","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"food","multiplier":2},{"resource":"brick","multiplier":1}]`

**produces**
- Before: `[{"resource":"copperOre","amount":1,"role":"primary"},{"resource":"copperOre","amount":0.2,"role":"unlockGate","forGenerator":"copperSmelter"}]`
- After: `[{"resource":"copperOre","amount":0.35,"role":"primary"}]`

---

### Copper Smelter (`copperSmelter`)

Smelt ~80% ore to metal; charcoal fuel ~350 kg per tonne copper (scaled).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"copperOre","multiplier":3},{"resource":"charcoal","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":2},{"resource":"charcoal","multiplier":1}]`

**consumes**
- Before: `[{"resource":"copperOre","amount":0.8},{"resource":"charcoal","amount":0.3}]`
- After: `[{"resource":"copperOre","amount":0.35},{"resource":"charcoal","amount":0.12}]`

**produces**
- Before: `[{"resource":"copper","amount":0.7,"role":"primary"},{"resource":"copper","amount":0.1,"role":"bonus","forGenerator":"bronzeForge"}]`
- After: `[{"resource":"copper","amount":0.28,"role":"primary"}]`

---

### Tin Smelter (`tinSmelter`)

Tin smelting lower yield than copper; cassiterite processing losses.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"tinOre","multiplier":3},{"resource":"charcoal","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":2},{"resource":"charcoal","multiplier":1}]`

**consumes**
- Before: `[{"resource":"tinOre","amount":0.8},{"resource":"charcoal","amount":0.3}]`
- After: `[{"resource":"tinOre","amount":0.28},{"resource":"charcoal","amount":0.12}]`

**produces**
- Before: `[{"resource":"tin","amount":0.7,"role":"primary"},{"resource":"tin","amount":0.1,"role":"unlockGate","forGenerator":"bronzeForge"}]`
- After: `[{"resource":"tin","amount":0.22,"role":"primary"}]`

---

### Bronze Forge (`bronzeForge`)

Classic 88% copper / 12% tin bronze alloy by mass.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"copper","multiplier":3},{"resource":"tin","multiplier":2},{"resource":"charcoal","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":3}]`

**consumes**
- Before: `[{"resource":"copper","amount":0.5},{"resource":"tin","amount":0.3},{"resource":"charcoal","amount":0.2}]`
- After: `[{"resource":"copper","amount":0.25},{"resource":"tin","amount":0.08},{"resource":"charcoal","amount":0.1}]`

**produces**
- Before: `[{"resource":"bronze","amount":0.8,"role":"primary"}]`
- After: `[{"resource":"bronze","amount":0.32,"role":"primary"}]`

---

### Iron Mine (`ironMine`)

Medieval deep mine ~30 kg iron ore/hour.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"bronze","multiplier":3},{"resource":"ironOre","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"bronze","multiplier":2},{"resource":"food","multiplier":2}]`

**produces**
- Before: `[{"resource":"ironOre","amount":1,"role":"primary"},{"resource":"iron","amount":0.05,"role":"unlockGate","forGenerator":"ironSmelter"}]`
- After: `[{"resource":"ironOre","amount":0.4,"role":"primary"}]`

---

### Iron Smelter (`ironSmelter`)

Bloomery ~70% yield; slag byproduct hints at precious metal trade.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"ironOre","multiplier":4},{"resource":"charcoal","multiplier":2}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":3}]`

**consumes**
- Before: `[{"resource":"ironOre","amount":0.9},{"resource":"charcoal","amount":0.4}]`
- After: `[{"resource":"ironOre","amount":0.45},{"resource":"charcoal","amount":0.15}]`

**produces**
- Before: `[{"resource":"iron","amount":0.8,"role":"primary"},{"resource":"gold","amount":0.05,"role":"unlockGate","forGenerator":"blacksmith"}]`
- After: `[{"resource":"iron","amount":0.32,"role":"primary"},{"resource":"gold","amount":0.02,"role":"unlockGate","forGenerator":"blacksmith"}]`

---

### Blacksmith (`blacksmith`)

Forge tools sold for gold — craft value, not mining gold.

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"iron","multiplier":5},{"resource":"charcoal","multiplier":2}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"brick","multiplier":2},{"resource":"iron","multiplier":1}]`

**consumes**
- Before: `[{"resource":"iron","amount":0.6},{"resource":"charcoal","amount":0.3}]`
- After: `[{"resource":"iron","amount":0.4},{"resource":"charcoal","amount":0.12}]`

**produces**
- Before: `[{"resource":"gold","amount":0.4,"role":"primary"},{"resource":"gold","amount":0.1,"role":"unlockGate","forGenerator":"tradeCaravan"}]`
- After: `[{"resource":"gold","amount":0.06,"role":"primary"}]`

---

### Trade Caravan (`tradeCaravan`)

Trade surplus food/wood on long routes; distant lands export coal knowledge.

**costResources**
- Before: `[{"resource":"food","multiplier":3},{"resource":"wood","multiplier":2},{"resource":"gold","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"food","multiplier":2},{"resource":"gold","multiplier":1}]`

**consumes**
- Before: `null`
- After: `[{"resource":"food","amount":0.15},{"resource":"wood","amount":0.1}]`

**produces**
- Before: `[{"resource":"gold","amount":1.2,"role":"primary"},{"resource":"food","amount":0.5,"role":"bonus"},{"resource":"wood","amount":0.3,"role":"bonus"},{"resource":"coal","amount":0.08,"role":"unlockGate","forGenerator":"coalMine"}]`
- After: `[{"resource":"gold","amount":0.5,"role":"primary"},{"resource":"coal","amount":0.05,"role":"unlockGate","forGenerator":"coalMine"}]`

---

### Coal Mine (`coalMine`)

Industrial coal seam ~500 kg/hour per shaft (abstracted).

**costResources**
- Before: `[{"resource":"stone","multiplier":1},{"resource":"iron","multiplier":5},{"resource":"gold","multiplier":2}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"iron","multiplier":3},{"resource":"gold","multiplier":1}]`

**produces**
- Before: `[{"resource":"coal","amount":1.5,"role":"primary"},{"resource":"steel","amount":0.08,"role":"unlockGate","forGenerator":"steelForge"}]`
- After: `[{"resource":"coal","amount":1.0,"role":"primary"}]`

---

### Steel Forge (`steelForge`)

Bessemer-style ~85% iron+coal to steel; canning needs steel tools.

**costResources**
- Before: `[{"resource":"iron","multiplier":5},{"resource":"coal","multiplier":5},{"resource":"steel","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"iron","multiplier":2},{"resource":"coal","multiplier":2}]`

**consumes**
- Before: `[{"resource":"iron","amount":0.7},{"resource":"coal","amount":0.5}]`
- After: `[{"resource":"iron","amount":0.4},{"resource":"coal","amount":0.25}]`

**produces**
- Before: `[{"resource":"steel","amount":0.9,"role":"primary"},{"resource":"food","amount":0.2,"role":"unlockGate","forGenerator":"foodPackagingFactory"}]`
- After: `[{"resource":"steel","amount":0.35,"role":"primary"},{"resource":"food","amount":0.1,"role":"unlockGate","forGenerator":"foodPackagingFactory"}]`

---

### Food Packaging Factory (`foodPackagingFactory`)

Industrial packaging 10× campfire output from same inputs (canning efficiency).

**costResources**
- Before: `[{"resource":"steel","multiplier":3},{"resource":"game","multiplier":2},{"resource":"plants","multiplier":2}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"steel","multiplier":3}]`

**consumes**
- Before: `[{"resource":"steel","amount":0.2},{"resource":"game","amount":0.4},{"resource":"plants","amount":0.4}]`
- After: `[{"resource":"steel","amount":0.05},{"resource":"game","amount":0.2},{"resource":"plants","amount":0.2}]`

**produces**
- Before: `[{"resource":"food","amount":5,"role":"primary"},{"resource":"electricity","amount":0.03,"role":"unlockGate","forGenerator":"powerPlant"}]`
- After: `[{"resource":"food","amount":2.5,"role":"primary"},{"resource":"electricity","amount":0.02,"role":"unlockGate","forGenerator":"powerPlant"}]`

---

### Power Plant (`powerPlant`)

Coal plant ~40% thermal efficiency abstracted to electricity; telemetry seeds data age.

**costResources**
- Before: `[{"resource":"coal","multiplier":10},{"resource":"steel","multiplier":10}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"coal","multiplier":5},{"resource":"steel","multiplier":5}]`

**consumes**
- Before: `[{"resource":"coal","amount":0.8},{"resource":"steel","amount":0.1}]`
- After: `[{"resource":"coal","amount":0.5},{"resource":"steel","amount":0.02}]`

**produces**
- Before: `[{"resource":"electricity","amount":2,"role":"primary"},{"resource":"data","amount":0.02,"role":"unlockGate","forGenerator":"broadcastTower"}]`
- After: `[{"resource":"electricity","amount":1.8,"role":"primary"},{"resource":"data","amount":0.01,"role":"unlockGate","forGenerator":"broadcastTower"}]`

---

### Broadcast Tower (`broadcastTower`)

Analog radio/TV broadcasts — low bandwidth information (unique data source tier 3).

**costResources**
- Before: `[{"resource":"steel","multiplier":5},{"resource":"electricity","multiplier":3}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"steel","multiplier":5},{"resource":"electricity","multiplier":2}]`

**consumes**
- Before: `[{"resource":"electricity","amount":0.5}]`
- After: `[{"resource":"electricity","amount":0.6}]`

**produces**
- Before: `[{"resource":"data","amount":0.3,"role":"primary"},{"resource":"data","amount":0.1,"role":"unlockGate","forGenerator":"internetHub"}]`
- After: `[{"resource":"data","amount":0.15,"role":"primary"}]`

---

### Internet Hub (`internetHub`)

Packet routing amplifies data flow (net positive data after electricity cost).

**costResources**
- Before: `[{"resource":"steel","multiplier":3},{"resource":"electricity","multiplier":5},{"resource":"data","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"steel","multiplier":3},{"resource":"electricity","multiplier":3}]`

**consumes**
- Before: `[{"resource":"electricity","amount":0.4},{"resource":"data","amount":0.1}]`
- After: `[{"resource":"electricity","amount":0.35},{"resource":"data","amount":0.08}]`

**produces**
- Before: `[{"resource":"data","amount":0.8,"role":"primary"},{"resource":"data","amount":0.2,"role":"unlockGate","forGenerator":"dataCenter"}]`
- After: `[{"resource":"data","amount":0.45,"role":"primary"}]`

---

### Data Center (`dataCenter`)

Hyperscale storage/processing — main data producer; ~1 PB/day abstracted.

**costResources**
- Before: `[{"resource":"steel","multiplier":5},{"resource":"electricity","multiplier":5},{"resource":"data","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"steel","multiplier":5},{"resource":"electricity","multiplier":5}]`

**consumes**
- Before: `null`
- After: `[{"resource":"electricity","amount":0.5},{"resource":"data","amount":0.12}]`

**produces**
- Before: `[{"resource":"data","amount":1.5,"role":"primary"},{"resource":"compute","amount":0.1,"role":"unlockGate","forGenerator":"mlLaboratory"}]`
- After: `[{"resource":"data","amount":1.2,"role":"primary"},{"resource":"compute","amount":0.08,"role":"unlockGate","forGenerator":"mlLaboratory"}]`

---

### ML Laboratory (`mlLaboratory`)

GPU training converts datasets to compute cycles; early model artifacts.

**costResources**
- Before: `[{"resource":"steel","multiplier":3},{"resource":"data","multiplier":5},{"resource":"compute","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"steel","multiplier":3},{"resource":"data","multiplier":3}]`

**consumes**
- Before: `null`
- After: `[{"resource":"data","amount":0.35},{"resource":"electricity","amount":0.2}]`

**produces**
- Before: `[{"resource":"compute","amount":1.5,"role":"primary"},{"resource":"intelligence","amount":0.05,"role":"unlockGate","forGenerator":"agiCore"}]`
- After: `[{"resource":"compute","amount":0.8,"role":"primary"},{"resource":"intelligence","amount":0.03,"role":"unlockGate","forGenerator":"agiCore"}]`

---

### AGI Core (`agiCore`)

AGI synthesis — high compute/data cost for general intelligence output.

**costResources**
- Before: `[{"resource":"compute","multiplier":20},{"resource":"data","multiplier":10},{"resource":"intelligence","multiplier":1}]`
- After: `[{"resource":"stone","multiplier":1},{"resource":"compute","multiplier":10},{"resource":"data","multiplier":5}]`

**consumes**
- Before: `null`
- After: `[{"resource":"compute","amount":0.5},{"resource":"data","amount":0.25}]`

**produces**
- Before: `[{"resource":"intelligence","amount":5,"role":"primary"},{"resource":"compute","amount":0.5,"role":"bonus"}]`
- After: `[{"resource":"intelligence","amount":0.15,"role":"primary"}]`

---

## Production logic summary

*Updated 2026-08 to match content logic polish.*

- **Gatherer** (`rockGatherer`): +0.8/s stone, +0.2/s wood (unlockGate); −—. Manual gathering; incidental timber while quarrying.
- **Woodcutter** (`woodcutter`): +0.6/s wood; −—. Felling ~2 m³ timber/hour.
- **Hunter** (`hunter`): +0.25/s game; −—. Successful hunt ~6 kg meat/hour.
- **Farmer** (`farmer`): +0.4/s plants; −—. Subsistence plot ~1.5 kg crops/hour.
- **Charcoal Kiln** (`charcoalKiln`): +0.15/s charcoal; −0.6/s wood. Pyrolysis ~25% wood mass to charcoal (historical kiln yield).
- **Campfire** (`campfire`): +0.35/s food; −0.15/s wood, 0.25/s game. Cooks raw game into food.
- **Mason** (`mason`): +0.2/s brick; −1.0/s stone. ~5:1 stone waste when cutting bricks (Roman masonry ratios).
- **Prospector** (`prospector`): +—; −—. Surveying finds surface ore traces; iron trace after bronze metallurgy knowledge.
- **Copper Mine** (`copperMine`): +0.35/s copperOre; −—. Shallow Bronze Age pit ~25 kg ore/hour per crew.
- **Copper Smelter** (`copperSmelter`): +0.28/s copper; −0.35/s copperOre, 0.12/s charcoal. Smelt ~80% ore to metal; charcoal fuel ~350 kg per tonne copper (scaled).
- **Tin Smelter** (`tinSmelter`): +0.22/s tin; −0.28/s tinOre, 0.12/s charcoal. Tin smelting lower yield than copper; cassiterite processing losses.
- **Bronze Forge** (`bronzeForge`): +0.32/s bronze; −0.25/s copper, 0.08/s tin, 0.1/s charcoal. Classic 88% copper / 12% tin bronze alloy by mass.
- **Iron Mine** (`ironMine`): +0.4/s ironOre; −—. Medieval deep mine ~30 kg iron ore/hour.
- **Iron Smelter** (`ironSmelter`): +0.32/s iron; −0.45/s ironOre, 0.15/s charcoal. Bloomery ~70% yield; slag byproduct hints at precious metal trade.
- **Blacksmith** (`blacksmith`): +0.06/s gold; −0.4/s iron, 0.12/s charcoal. Forge tools sold for gold — craft value, not mining gold.
- **Trade Caravan** (`tradeCaravan`): +0.5/s gold; −0.15/s food, 0.1/s wood. Trade surplus food/wood on long routes; distant lands export coal knowledge.
- **Coal Mine** (`coalMine`): +1.0/s coal; −—. Industrial coal seam ~500 kg/hour per shaft (abstracted).
- **Steel Forge** (`steelForge`): +0.35/s steel; −0.4/s iron, 0.25/s coal. Bessemer-style ~85% iron+coal to steel; canning needs steel tools.
- **Food Packaging Factory** (`foodPackagingFactory`): +2.5/s food; −0.05/s steel, 0.2/s game, 0.2/s plants. Industrial packaging 10× campfire output from same inputs (canning efficiency).
- **Power Plant** (`powerPlant`): +1.8/s electricity; −0.5/s coal, 0.02/s steel. Coal plant ~40% thermal efficiency abstracted to electricity; telemetry seeds data age.
- **Broadcast Tower** (`broadcastTower`): +0.15/s data; −0.6/s electricity. Analog radio/TV broadcasts — low bandwidth information (unique data source tier 3).
- **Internet Hub** (`internetHub`): +0.45/s data; −0.35/s electricity, 0.08/s data. Packet routing amplifies data flow (net positive data after electricity cost).
- **Data Center** (`dataCenter`): +1.2/s data; −0.5/s electricity, 0.12/s data. Hyperscale storage/processing — main data producer; ~1 PB/day abstracted.
- **ML Laboratory** (`mlLaboratory`): +0.8/s compute; −0.35/s data, 0.2/s electricity. GPU training converts datasets to compute cycles; early model artifacts.
- **AGI Core** (`agiCore`): +0.15/s intelligence, +0.04/s compute (bonus); −0.5/s compute, 0.25/s data. AGI synthesis — high compute/data cost for general intelligence output.
- **Quantum Processor** (`quantumProcessor`): +0.08/s quantumFlops; −0.8/s compute, 0.3/s electricity. Post-classical quantum operations.
- **Neural Mesh** (`neuralMesh`): +0.05/s meshNodes, +0.1/s intelligence (secondary); −0.15/s quantumFlops, 0.4/s data, 0.25/s electricity. Planetary distributed cognition mesh.