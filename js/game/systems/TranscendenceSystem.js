import { FormulaEngine } from '../FormulaEngine.js';
import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { ModifierSystem } from '../ModifierSystem.js';
import { initPrestigeRun } from './RunTracker.js';
import { DirectiveSystem } from './DirectiveSystem.js';
import { ParagonSystem } from './ParagonSystem.js';

export const TranscendenceSystem = {
  isEnabled(config) {
    return config.transcendence?.enabled === true;
  },

  isUnlocked(state, config) {
    if (!this.isEnabled(config)) return false;
    const unlock = config.transcendence.unlockConditions;
    if (!unlock) return false;
    return FormulaEngine.evaluateUnlockConditions(unlock, state, config).met;
  },

  canTranscend(state, config) {
    if (!this.isUnlocked(state, config)) return false;
    const earned = state.meta.transcendence?.run?.intelligenceEarnedThisRun || 0;
    const minimum = config.transcendence.transcendenceCurrency.minimumResourceValue;
    return earned >= minimum;
  },

  getProjectedGain(state, config) {
    return FormulaEngine.calculateTranscendenceGain(state, config);
  },

  perform(state, config, gameState) {
    if (!this.canTranscend(state, config)) return false;

    const gain = FormulaEngine.calculateTranscendenceGain(state, config);
    DirectiveSystem.consumeBonus(state);
    const profile = config.transcendence.onTranscendence;

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
      state.stats.totalTaps = 0;
    }

    if (profile.resetPrestigeRun) {
      initPrestigeRun(state, config);
    }

    if (profile.resetPrestigeShopAllocation) {
      state.meta.prestige.purchasedBonuses = {};
    }

    state.meta.transcendence.run = { intelligenceEarnedThisRun: 0 };

    const starting = config.transcendence.startingResourcesAfterTranscendence || {};
    for (const [res, amt] of Object.entries(starting)) {
      gameState.addResource(res, amt, 'transcendence_start');
    }

    state.meta.transcendence.currency += gain;
    state.meta.transcendence.lifetimeCurrencyEarned += gain;
    state.meta.transcendence.totalTranscendences++;

    ParagonSystem.onTranscendence(state, config);

    ModifierSystem.invalidate();
    gameState._bumpModCache();
    EventBus.emit(EVENTS.TRANSCENDENCE_PERFORMED, { gain });
    return true;
  },

  buyUpgrade(state, config, upgradeCode, gameState) {
    const upgrade = config.transcendence.transcendenceUpgrades.find(u => u.codeName === upgradeCode);
    if (!upgrade) return false;

    const level = state.meta.transcendence.purchasedUpgrades[upgradeCode] || 0;
    if (level >= upgrade.maxLevel) return false;
    const cost = upgrade.cost * (level + 1);
    if (state.meta.transcendence.currency < cost) return false;

    state.meta.transcendence.currency -= cost;
    state.meta.transcendence.purchasedUpgrades[upgradeCode] = level + 1;
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    return true;
  },

  getLostKept(config) {
    const p = config.transcendence.onTranscendence;
    const lost = ['Resource balances', 'Generator quantities', 'Upgrade levels', 'Temporary buffs', 'Run stats'].filter((_, i) =>
      [p.clearCurrency, p.clearGeneratorQuantities, p.clearUpgrades, p.clearTemporaryBuffs, p.resetRunStats][i]
    );
    if (p.resetPrestigeRun) lost.push('Prestige run progress');
    return {
      lost,
      kept: [
        'Artifacts',
        'Generator unlocks',
        'Achievements',
        'Ascension tier',
        'Prestige shop levels',
        'Cosmic Insight (currency)',
        'Transcendence upgrades',
        'Characters',
        'Lifetime milestones'
      ]
    };
  }
};
