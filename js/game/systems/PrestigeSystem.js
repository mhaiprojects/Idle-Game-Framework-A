import { FormulaEngine } from '../FormulaEngine.js';
import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { ModifierSystem } from '../ModifierSystem.js';
import { initPrestigeRun } from './RunTracker.js';
import { DirectiveSystem } from './DirectiveSystem.js';

export const PrestigeSystem = {
  canPrestige(state, config) {
    const minimum = FormulaEngine.getScaledPrestigeMinimum(state, config);
    return FormulaEngine.evaluateUnlockConditions(minimum, state, config).met;
  },

  getProjectedGain(state, config) {
    return FormulaEngine.calculatePrestigeGain(state, config);
  },

  perform(state, config, gameState) {
    if (!this.canPrestige(state, config)) return false;

    const gain = FormulaEngine.calculatePrestigeGain(state, config);
    const profile = config.prestige.onPrestige;
    const tier = state.meta.ascension.currentTier;

    if (profile.clearCurrency) {
      for (const r of Object.keys(state.resources)) {
        state.resources[r].quantity = 0;
      }
    }

    if (profile.clearGeneratorQuantities) {
      for (const g of Object.values(state.generators)) {
        g.quantityPurchased = 0;
      }
    }

    if (profile.clearUpgrades) {
      for (const u of Object.values(state.upgrades)) {
        u.purchaseCount = 0;
      }
    }

    if (profile.clearTemporaryBuffs) {
      state.activeBuffs = [];
      state.activeEvents = [];
    }

    if (profile.resetRunStats) {
      DirectiveSystem.onPrestigePerformed(state, config, gameState);
      initPrestigeRun(state, config);
    }

    if (profile.resetPrestigeShopAllocation) {
      state.meta.prestige.purchasedBonuses = {};
    }

    const starting = config.prestige.startingResourcesAfterPrestige || {};
    for (const [res, amt] of Object.entries(starting)) {
      gameState.addResource(res, amt, 'prestige_start');
    }

    state.meta.prestige.currency += gain;
    state.meta.prestige.lifetimeCurrencyEarned += gain;
    state.meta.ascension.tiers[tier].prestigeCount++;
    state.meta.milestones.lifetimePrestiges++;

    ModifierSystem.invalidate();
    gameState._bumpModCache();
    EventBus.emit(EVENTS.PRESTIGE_PERFORMED, { gain, tier });
    return true;
  },

  buyBonus(state, config, bonusCode, gameState) {
    const bonus = config.prestige.prestigeBonuses.find(b => b.codeName === bonusCode);
    if (!bonus) return false;
    if (bonus.requiredFeature && !ConfigManager.isFeatureUnlocked(bonus.requiredFeature, state)) return false;

    const level = state.meta.prestige.purchasedBonuses[bonusCode] || 0;
    if (level >= bonus.maxLevel) return false;
    const cost = bonus.cost * (level + 1);
    if (state.meta.prestige.currency < cost) return false;

    state.meta.prestige.currency -= cost;
    state.meta.prestige.purchasedBonuses[bonusCode] = level + 1;
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    return true;
  },

  getLostKept(config) {
    const p = config.prestige.onPrestige;
    const lost = ['Resource balances', 'Generator quantities', 'Upgrade levels', 'Temporary buffs', 'Run stats'].filter((_, i) =>
      [p.clearCurrency, p.clearGeneratorQuantities, p.clearUpgrades, p.clearTemporaryBuffs, p.resetRunStats][i]
    );
    if (p.resetPrestigeShopAllocation) lost.push('Prestige shop levels (allocation reset)');
    return {
      lost,
      kept: ['Artifacts', 'Generator unlocks', 'Achievements', 'Ascension tier', 'Prestige Shards (currency)', 'Prestige shop levels', 'Characters', 'Lifetime milestones']
    };
  }
};
