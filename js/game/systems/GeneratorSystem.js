import { FormulaEngine } from '../FormulaEngine.js';
import { ConfigManager } from '../../core/ConfigManager.js';

export const GeneratorSystem = {
  getResourceLabel(code, config) {
    return ConfigManager.getResource(code)?.displayName || code;
  },

  getGeneratorLabel(code, config) {
    return ConfigManager.getGenerator(code)?.displayName || code;
  },

  _canAffordCost(state, costs) {
    return Object.entries(costs).every(([res, amt]) => (state.resources[res]?.quantity || 0) >= amt);
  },

  buildProductionRows(state, config, mods, genCode) {
    return FormulaEngine.calculateGeneratorProduction(state, config, mods, genCode)
      .map(p => {
        const res = ConfigManager.getResource(p.resource);
        return {
          ...p,
          icon: res?.icon || '',
          name: res?.displayName || p.resource
        };
      });
  },

  getDisplayData(state, config, mods) {
    const multiplier = state.ui.purchaseMultiplier;
    const primaryBreakdown = FormulaEngine.calculatePrimaryCurrencyBreakdown(state, config, mods);

    return config.generators.generators.map(gen => {
      const gs = state.generators[gen.codeName];
      const unlock = FormulaEngine.evaluateUnlockConditions(gen.unlockConditions, state, config);
      const owned = gs.quantityPurchased;
      const nextCost = FormulaEngine.calculateGeneratorCost(gen, owned, mods, config, state);
      const bulkQty = this.getBulkQuantity(state, config, gen.codeName, multiplier, mods);
      const buyCost = bulkQty > 0
        ? FormulaEngine.calculateBulkCost(gen, owned, bulkQty, mods, config, state)
        : nextCost;
      const genPrimary = primaryBreakdown.breakdown.find(b => b.generator === gen.codeName)?.amount || 0;
      const featureLocked = gen.requiredFeature && !ConfigManager.isFeatureUnlocked(gen.requiredFeature, state);
      const isUnlocked = gs.isUnlocked && unlock.met && !featureLocked;
      const canBuy = isUnlocked && bulkQty > 0 && this._canAffordCost(state, buyCost);
      const production = this.buildProductionRows(state, config, mods, gen.codeName);

      return {
        ...gen,
        owned,
        isUnlocked,
        unlockResult: unlock,
        nextCost: buyCost,
        buyQuantity: bulkQty,
        canBuy,
        production,
        primaryCurrencyRate: genPrimary,
        primaryCurrencyPercent: primaryBreakdown.total > 0 ? (genPrimary / primaryBreakdown.total) * 100 : 0,
        featureLocked
      };
    });
  },

  getBulkQuantity(state, config, genCode, multiplier, mods) {
    const gen = ConfigManager.getGenerator(genCode);
    const gs = state.generators[genCode];
    if (multiplier === 'MAX') {
      const balances = {};
      for (const [code, r] of Object.entries(state.resources)) {
        balances[code] = r.quantity;
      }
      return FormulaEngine.calculateMaxAffordable(gen, gs.quantityPurchased, balances, mods, config, state);
    }
    return multiplier;
  }
};
