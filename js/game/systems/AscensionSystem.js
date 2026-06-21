import { FormulaEngine } from '../FormulaEngine.js';
import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { ModifierSystem } from '../ModifierSystem.js';

export const AscensionSystem = {
  getNextTier(state, config) {
    const current = state.meta.ascension.currentTier;
    if (current >= config.ascension.maxTier) return null;
    return config.ascension.ascensionTiers.find(t => t.tier === current + 1);
  },

  canAscend(state, config) {
    const next = this.getNextTier(state, config);
    if (!next) return { met: false, unmet: [] };
    return FormulaEngine.evaluateUnlockConditions(next.ascensionRequirements, state, config);
  },

  perform(state, config, gameState) {
    const next = this.getNextTier(state, config);
    if (!next) return false;

    const check = this.canAscend(state, config);
    if (!check.met) return false;

    const profile = next.onAscend || {};

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

    const newTier = next.tier;
    state.meta.ascension.currentTier = newTier;
    state.meta.ascension.tiers[newTier].prestigeCount = 0;
    state.meta.ascension.tiers[newTier].timesAscendedTo++;
    state.meta.ascension.totalAscensions++;

    for (const feature of next.unlockedFeatures || []) {
      EventBus.emit(EVENTS.FEATURE_UNLOCKED, { feature });
      gameState.showToast(`✨ Unlocked: ${feature}`);
    }

    ModifierSystem.invalidate();
    gameState._bumpModCache();
    EventBus.emit(EVENTS.ASCENSION_PERFORMED, { tier: newTier });
    return true;
  },

  getMilestoneProgress(state, config) {
    const next = this.getNextTier(state, config);
    if (!next?.ascensionRequirements) return [];
    const conditions = next.ascensionRequirements.conditions || [];
    return conditions.map(cond => ({
      condition: cond,
      progress: FormulaEngine.getConditionProgress(cond, state, config),
      met: FormulaEngine._evaluateSingleCondition(cond, state, config)
    }));
  },

  getLostKept(nextTier) {
    const p = nextTier?.onAscend || {};
    return {
      lost: ['Resource balances', 'Generator quantities'].filter((_, i) =>
        [p.clearCurrency, p.clearGeneratorQuantities][i]
      ),
      kept: ['Artifacts', 'Generator unlocks', 'Upgrade levels', 'Achievements', 'Characters', 'Inventory', 'Lifetime milestones', 'Prestige shop']
    };
  },

  getUnlockedFeaturesPreview(state, config) {
    const next = this.getNextTier(state, config);
    return next?.unlockedFeatures || [];
  }
};
