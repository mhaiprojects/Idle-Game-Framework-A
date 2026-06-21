import { FormulaEngine } from '../FormulaEngine.js';
import { ModifierSystem } from '../ModifierSystem.js';
import { ConfigManager } from '../../core/ConfigManager.js';

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

  getRequirementRow(req, state, config, formatNumber) {
    const fmt = formatNumber || (n => n);
    const mods = ModifierSystem.collect(state, config);
    const primary = config.resources.resources.find(r => r.isPrimary);
    const met = this._checkRequirement(req, state, config, mods, primary);
    let progress = met ? 1 : 0;
    let icon = ConfigManager.getDefaultIcon('achievement');
    let label = req.type;

    switch (req.type) {
      case 'totalTaps': {
        const current = state.stats.totalTaps;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '👆';
        label = ConfigManager.formatAchievementLabel('totalTaps', { current, required: req.amount });
        break;
      }
      case 'totalClicks': {
        const current = state.stats.totalClicks || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '👆';
        label = ConfigManager.formatAchievementLabel('totalClicks', { current, required: req.amount });
        break;
      }
      case 'generatorOwned': {
        const gen = config.generators.generators.find(g => g.codeName === req.generator);
        const current = state.generators[req.generator]?.quantityPurchased || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = gen?.icon || ConfigManager.getDefaultIcon('generator');
        label = ConfigManager.formatAchievementLabel('generatorOwned', {
          name: gen?.displayName || req.generator,
          current,
          required: req.amount
        });
        break;
      }
      case 'generatorCount': {
        let current = 0;
        for (const g of Object.values(state.generators)) current += g.quantityPurchased;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = ConfigManager.getDefaultIcon('generator');
        label = ConfigManager.formatAchievementLabel('generatorCount', { current, required: req.amount });
        break;
      }
      case 'resourceEarned': {
        const res = ConfigManager.getResource(req.resource);
        const current = state.resources[req.resource]?.totalEarned || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = res?.icon || ConfigManager.getDefaultIcon('resource');
        label = ConfigManager.formatAchievementLabel('resourceEarned', {
          name: res?.displayName || req.resource,
          current: fmt(current),
          required: fmt(req.amount)
        });
        break;
      }
      case 'primaryCurrencyRateReached':
      case 'ppsReached': {
        const current = FormulaEngine.calculatePrimaryCurrencyRate(state, config, mods);
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = primary?.icon || ConfigManager.getDefaultIcon('primaryCurrency');
        label = ConfigManager.formatAchievementLabel('primaryCurrencyRate', {
          name: primary?.displayName || 'Primary currency',
          current: fmt(current),
          required: fmt(req.amount)
        });
        break;
      }
      case 'prestigeCount': {
        const tier = state.meta.ascension.currentTier;
        const current = state.meta.ascension.tiers[tier]?.prestigeCount || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = ConfigManager.getDefaultIcon('ascension');
        label = ConfigManager.formatAchievementLabel('prestigeCount', { current, required: req.amount });
        break;
      }
      case 'ascensionCount': {
        const current = state.meta.ascension.totalAscensions || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = ConfigManager.getDefaultIcon('ascension');
        label = ConfigManager.formatAchievementLabel('ascensionCount', { current, required: req.amount });
        break;
      }
      case 'artifactCount': {
        const current = Object.keys(state.artifacts.acquired).length;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🔮';
        label = ConfigManager.formatAchievementLabel('artifactCount', { current, required: req.amount });
        break;
      }
      case 'itemCollected': {
        const item = config.items.items.find(i => i.codeName === req.item);
        const current = state.inventory[req.item] || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = item?.icon || ConfigManager.getDefaultIcon('unknown');
        label = ConfigManager.formatAchievementLabel('itemCollected', {
          name: item?.displayName || req.item,
          current,
          required: req.amount
        });
        break;
      }
      case 'playTime': {
        const current = Math.floor(state.stats.playTimeSeconds);
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '⏱️';
        label = ConfigManager.formatAchievementLabel('playTime', { current, required: req.amount });
        break;
      }
      default:
        break;
    }

    return { icon, label, progress, met };
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
