import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';

export const DropSystem = {
  onTick(state, config, deltaSeconds, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:drops', state)) return;

    for (const table of config.drops.dropTables) {
      if (table.trigger !== 'tick') continue;
      if (table.codeName === 'artifactDrop' && !ConfigManager.isFeatureUnlocked('tab:artifacts', state)) continue;

      let chance = table.chancePerSecond * deltaSeconds;
      if (table.codeName === 'equipmentDrop') {
        chance *= this._equipmentDropMultiplier(state, config);
      }

      if (Math.random() > chance) continue;

      let entry;
      if (table.codeName === 'equipmentDrop') {
        entry = this._rollEquipmentEntry(table, state, config);
      } else if (table.codeName === 'artifactDrop') {
        entry = this._rollArtifactEntry(table, state, config);
      } else {
        entry = this._rollEntry(table.entries);
      }
      if (!entry) continue;

      if (entry.artifact) {
        gameState.acquireArtifact(entry.artifact);
      } else if (entry.item) {
        const qty = this._rollQuantity(entry.quantity);
        gameState.addItem(entry.item, qty);
        EventBus.emit(EVENTS.ITEM_DROPPED, { item: entry.item, quantity: qty });
      }
    }
  },

  onClick(state, config, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:drops', state)) return;

    for (const table of config.drops.dropTables) {
      if (table.trigger !== 'click') continue;
      if (Math.random() > table.chance) continue;

      const entry = this._rollEntry(table.entries);
      if (!entry || !entry.item) continue;

      const qty = this._rollQuantity(entry.quantity);
      gameState.addItem(entry.item, qty);
      EventBus.emit(EVENTS.ITEM_DROPPED, { item: entry.item, quantity: qty });
    }
  },

  _equipmentDropMultiplier(state, config) {
    const mods = config.drops.equipmentDropModifiers;
    if (!mods) return 1;
    let totalOwned = 0;
    for (const g of Object.values(state.generators)) totalOwned += g.quantityPurchased || 0;
    return 1 + totalOwned * (mods.quantityBonusPerGenerator || 0);
  },

  _rollEquipmentEntry(table, state, config) {
    const mods = config.drops.equipmentDropModifiers;
    const tier = state.meta.ascension.currentTier;
    const tierWeights = mods?.tierWeightsByAscension?.[String(tier)]
      || mods?.tierWeightsByAscension?.['0']
      || { common: 0.6, rare: 0.3, epic: 0.1 };

    const eligible = table.entries.filter(e => {
      const dropTier = e.dropTier || 'common';
      const w = tierWeights[dropTier] ?? 0.33;
      return Math.random() <= w;
    });

    return this._rollEntry(eligible.length ? eligible : table.entries);
  },

  _rollArtifactEntry(table, state, config) {
    const tier = state.meta.ascension.currentTier;
    const eligible = table.entries.filter(e => {
      const req = e.dropRequirements;
      if (!req) return true;
      if (tier < (req.minAscensionTier || 0)) return false;
      return (state.generators[req.generator]?.quantityPurchased || 0) > 0;
    });
    if (!eligible.length) return null;
    return this._rollEntry(eligible);
  },

  _rollEntry(entries) {
    const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
    if (totalWeight <= 0) return null;
    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  },

  _rollQuantity(range) {
    if (!range) return 1;
    const [min, max] = range;
    return min + Math.floor(Math.random() * (max - min + 1));
  }
};
