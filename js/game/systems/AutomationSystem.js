import { GeneratorSystem } from './GeneratorSystem.js';
import { PrestigeSystem } from './PrestigeSystem.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { FormulaEngine } from '../FormulaEngine.js';

function costTotal(cost) {
  return Object.values(cost || {}).reduce((sum, amt) => sum + amt, 0);
}

export const AutomationSystem = {
  _accumulator: 0,

  tick(state, config, deltaSec, gameState) {
    const fw = config.framework?.automation;
    if (!fw) return;

    this._accumulator += deltaSec;
    const interval = fw.tickIntervalSeconds ?? 1;
    if (this._accumulator < interval) return;
    this._accumulator = 0;

    const settings = state.settings;
    if (!settings.autoBuyGenerator && !settings.autoBuyUpgrade && !settings.autoPrestige) return;

    const mods = gameState.getMods();

    if (settings.autoBuyUpgrade) {
      const best = this._findBestAffordableUpgrade(state, config, mods);
      if (best) gameState.buyUpgrade(best);
    }

    if (settings.autoBuyGenerator) {
      const cheapest = this._findCheapestAffordableGenerator(state, config, mods);
      if (cheapest) gameState.buyGenerator(cheapest.codeName, cheapest.buyQuantity);
    }

    if (settings.autoPrestige) {
      const threshold = settings.autoPrestigeThreshold ?? fw.autoPrestigeThresholdDefault ?? 1;
      const gain = PrestigeSystem.getProjectedGain(state, config);
      if (PrestigeSystem.canPrestige(state, config) && gain >= threshold) {
        PrestigeSystem.perform(state, config, gameState);
      }
    }
  },

  _findCheapestAffordableGenerator(state, config, mods) {
    const affordable = GeneratorSystem.getDisplayData(state, config, mods)
      .filter(g => g.canBuy && g.buyQuantity > 0);
    if (!affordable.length) return null;

    affordable.sort((a, b) => costTotal(a.nextCost) - costTotal(b.nextCost));
    return affordable[0];
  },

  _findBestAffordableUpgrade(state, config, mods) {
    const primaryRate = FormulaEngine.calculatePrimaryCurrencyRate(state, config, mods);
    let bestCode = null;
    let bestEff = 0;

    for (const u of config.upgrades.upgrades) {
      const us = state.upgrades[u.codeName];
      const unlock = FormulaEngine.evaluateUnlockConditions(u.unlockConditions, state, config);
      if (!unlock.met) continue;

      const cost = FormulaEngine.calculateUpgradeCost(u, us.purchaseCount, config);
      const canAfford = (state.resources[u.costResource]?.quantity || 0) >= cost;
      const maxed = ConfigManager.isUpgradeMaxed(u, us.purchaseCount);
      if (!canAfford || maxed) continue;

      let efficiency = 0;
      if (u.effect?.type === 'globalMultiplier' && cost > 0) {
        efficiency = (primaryRate * (u.effect.multiplier - 1)) / cost;
      } else if (u.effect?.type === 'clickMultiplier' && cost > 0) {
        const tapGain = FormulaEngine.calculateTapGain(state, config, mods);
        efficiency = (tapGain * (u.effect.multiplier - 1)) / cost;
      } else if (cost > 0) {
        efficiency = 1 / cost;
      }

      if (efficiency > bestEff) {
        bestEff = efficiency;
        bestCode = u.codeName;
      }
    }

    return bestCode;
  }
};
