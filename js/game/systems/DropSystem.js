import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';

export const DropSystem = {
  onTick(state, config, deltaSeconds, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:drops', state)) return;

    for (const table of config.drops.dropTables) {
      if (table.trigger !== 'tick') continue;
      if (table.codeName === 'artifactDrop' && !ConfigManager.isFeatureUnlocked('tab:artifacts', state)) continue;

      const chance = table.chancePerSecond * deltaSeconds;
      if (Math.random() > chance) continue;

      const entry = this._rollEntry(table.entries);
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

  _rollEntry(entries) {
    const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
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
