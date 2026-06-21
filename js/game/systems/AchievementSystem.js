import { FormulaEngine } from '../FormulaEngine.js';
import { ModifierSystem } from '../ModifierSystem.js';

export const AchievementSystem = {
  checkAll(state, config, gameState) {
    const mods = ModifierSystem.collect(state, config);
    const primary = config.resources.resources.find(r => r.isPrimary);

    for (const ach of config.achievements.achievements) {
      if (state.achievements[ach.codeName]?.unlocked) continue;
      if (this._checkRequirement(ach.requirement, state, config, mods, primary)) {
        gameState.unlockAchievement(ach.codeName);
      }
    }
  },

  _checkRequirement(req, state, config, mods, primary) {
    switch (req.type) {
      case 'totalTaps':
        return state.stats.totalTaps >= req.amount;
      case 'totalClicks':
        return state.stats.totalClicks >= req.amount;
      case 'generatorOwned':
        return (state.generators[req.generator]?.quantityPurchased || 0) >= req.amount;
      case 'generatorCount': {
        let total = 0;
        for (const g of Object.values(state.generators)) total += g.quantityPurchased;
        return total >= req.amount;
      }
      case 'resourceEarned':
        return (state.resources[req.resource]?.totalEarned || 0) >= req.amount;
      case 'primaryCurrencyRateReached':
        return FormulaEngine.calculatePrimaryCurrencyRate(state, config, mods) >= req.amount;
      case 'ppsReached':
        return FormulaEngine.calculatePrimaryCurrencyRate(state, config, mods) >= req.amount;
      case 'prestigeCount': {
        const tier = state.meta.ascension.currentTier;
        return (state.meta.ascension.tiers[tier]?.prestigeCount || 0) >= req.amount;
      }
      case 'ascensionCount':
        return state.meta.ascension.totalAscensions >= req.amount;
      case 'artifactCount':
        return Object.keys(state.artifacts.acquired).length >= req.amount;
      case 'itemCollected':
        return (state.inventory[req.item] || 0) >= req.amount;
      case 'playTime':
        return state.stats.playTimeSeconds >= req.amount;
      default:
        return false;
    }
  }
};
