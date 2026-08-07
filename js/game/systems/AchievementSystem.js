import { FormulaEngine } from '../FormulaEngine.js';
import { ModifierSystem } from '../ModifierSystem.js';
import { ConfigManager } from '../../core/ConfigManager.js';

function getGeneratorTiers(config) {
  return config.framework?.generatorTiers || {};
}

export const AchievementSystem = {
  getGeneratorTier(codeName, config) {
    const tiers = getGeneratorTiers(config);
    for (const [tier, codes] of Object.entries(tiers)) {
      if (codes.includes(codeName)) return Number(tier);
    }
    return 0;
  },

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
      case 'lifetimePrestiges': {
        const current = state.meta.milestones.lifetimePrestiges || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🔄';
        label = `${current} / ${req.amount} lifetime prestiges`;
        break;
      }
      case 'ascensionTier': {
        const current = state.meta.ascension.currentTier;
        progress = req.minTier > 0 ? Math.min(1, current / req.minTier) : 1;
        icon = '🌅';
        label = `Ascension tier ${current} / ${req.minTier}`;
        break;
      }
      case 'charactersUnlocked': {
        const current = Object.values(state.characters).filter(c => c.unlocked).length;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '👥';
        label = `${current} / ${req.amount} characters unlocked`;
        break;
      }
      case 'equipmentSlotsFilled': {
        const current = Math.max(...Object.values(state.characters).map(c =>
          Object.values(c.equipment || {}).filter(Boolean).length
        ), 0);
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🎒';
        label = `${current} / ${req.amount} equipment slots filled (best character)`;
        break;
      }
      case 'itemHeld': {
        const current = Math.max(...Object.values(state.inventory), 0);
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '📦';
        label = `Hold ${req.amount}+ of any item (best: ${current})`;
        break;
      }
      case 'upgradeLevels': {
        let current = 0;
        for (const u of Object.values(state.upgrades)) current += u.purchaseCount || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🔧';
        label = `${current} / ${req.amount} upgrade levels purchased`;
        break;
      }
      case 'eventsSeen': {
        const current = state.stats.eventsSeen || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🎲';
        label = `${current} / ${req.amount} random events seen`;
        break;
      }
      case 'offlineSeconds': {
        const current = state.stats.offlineSecondsClaimed || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🌙';
        label = `${Math.floor(current)}s / ${req.amount}s offline progress claimed`;
        break;
      }
      case 'prestigeShopLevels': {
        let current = 0;
        for (const lvl of Object.values(state.meta.prestige.purchasedBonuses || {})) current += lvl || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🛒';
        label = `${current} / ${req.amount} prestige shop levels purchased`;
        break;
      }
      case 'transcendenceCount': {
        const current = state.meta.transcendence?.totalTranscendences || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🌌';
        label = `${current} / ${req.amount} transcendences performed`;
        break;
      }
      case 'paragonLevel': {
        const current = state.meta.paragon?.level || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '💎';
        label = `${current} / ${req.amount} paragon levels`;
        break;
      }
      case 'transcendenceUpgradeLevels': {
        let current = 0;
        for (const lvl of Object.values(state.meta.transcendence?.purchasedUpgrades || {})) current += lvl || 0;
        progress = req.amount > 0 ? Math.min(1, current / req.amount) : 1;
        icon = '🛸';
        label = `${current} / ${req.amount} transcendence upgrade levels`;
        break;
      }
      case 'generatorsOwnedTier': {
        const tiers = getGeneratorTiers(config);
        const codes = tiers[req.tier] || [];
        const current = codes.filter(c => (state.generators[c]?.quantityPurchased || 0) >= (req.amount || 1)).length;
        progress = codes.length > 0 ? Math.min(1, current / codes.length) : 0;
        icon = '🏭';
        label = `${current} / ${codes.length} tier-${req.tier} generators owned`;
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
      case 'lifetimePrestiges':
        return (state.meta.milestones.lifetimePrestiges || 0) >= req.amount;
      case 'ascensionTier':
        return state.meta.ascension.currentTier >= req.minTier;
      case 'charactersUnlocked':
        return Object.values(state.characters).filter(c => c.unlocked).length >= req.amount;
      case 'equipmentSlotsFilled':
        return Object.values(state.characters).some(c =>
          Object.values(c.equipment || {}).filter(Boolean).length >= req.amount
        );
      case 'itemHeld':
        return Object.values(state.inventory).some(qty => qty >= req.amount);
      case 'upgradeLevels': {
        let total = 0;
        for (const u of Object.values(state.upgrades)) total += u.purchaseCount || 0;
        return total >= req.amount;
      }
      case 'eventsSeen':
        return (state.stats.eventsSeen || 0) >= req.amount;
      case 'offlineSeconds':
        return (state.stats.offlineSecondsClaimed || 0) >= req.amount;
      case 'prestigeShopLevels': {
        let total = 0;
        for (const lvl of Object.values(state.meta.prestige.purchasedBonuses || {})) total += lvl || 0;
        return total >= req.amount;
      }
      case 'transcendenceCount':
        return (state.meta.transcendence?.totalTranscendences || 0) >= req.amount;
      case 'paragonLevel':
        return (state.meta.paragon?.level || 0) >= req.amount;
      case 'transcendenceUpgradeLevels': {
        let total = 0;
        for (const lvl of Object.values(state.meta.transcendence?.purchasedUpgrades || {})) total += lvl || 0;
        return total >= req.amount;
      }
      case 'generatorsOwnedTier': {
        const tiers = getGeneratorTiers(config);
        const codes = tiers[req.tier] || [];
        if (req.tier === 0 && req.amount > 1) {
          return codes.every(c => (state.generators[c]?.quantityPurchased || 0) >= req.amount);
        }
        return codes.every(c => (state.generators[c]?.quantityPurchased || 0) >= (req.amount || 1));
      }
      default:
        return false;
    }
  }
};
