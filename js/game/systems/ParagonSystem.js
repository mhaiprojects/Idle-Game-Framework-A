import { FormulaEngine } from '../FormulaEngine.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { ModifierSystem } from '../ModifierSystem.js';

export const ParagonSystem = {
  isEnabled(config) {
    return config.paragon?.enabled === true;
  },

  isUnlocked(state, config) {
    if (!this.isEnabled(config)) return false;
    const unlock = config.paragon.unlockConditions;
    if (!unlock) return false;
    return FormulaEngine.evaluateUnlockConditions(unlock, state, config).met;
  },

  getLevelCost(state, config) {
    const p = config.paragon;
    const level = state.meta.paragon?.level || 0;
    return Math.floor(p.levelCostBase * Math.pow(p.levelCostScale, level));
  },

  canBuyLevel(state, config) {
    if (!this.isUnlocked(state, config)) return false;
    const cost = this.getLevelCost(state, config);
    return (state.meta.paragon?.currency || 0) >= cost;
  },

  buyLevel(state, config, gameState) {
    if (!this.canBuyLevel(state, config)) return false;
    const cost = this.getLevelCost(state, config);
    state.meta.paragon.currency -= cost;
    state.meta.paragon.level = (state.meta.paragon.level || 0) + 1;
    state.meta.paragon.lifetimeLevels = (state.meta.paragon.lifetimeLevels || 0) + 1;
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    return true;
  },

  onTranscendence(state, config) {
    if (!this.isEnabled(config)) return;
    const earn = config.paragon.paragonCurrency?.earnPerTranscendence || 0;
    if (earn <= 0) return;
    state.meta.paragon.currency = (state.meta.paragon.currency || 0) + earn;
    state.meta.paragon.lifetimeCurrencyEarned = (state.meta.paragon.lifetimeCurrencyEarned || 0) + earn;
  },

  getDisplay(state, config, formatNumber) {
    const fmt = formatNumber || (n => String(n));
    if (!this.isEnabled(config)) return { enabled: false };
    const unlocked = this.isUnlocked(state, config);
    const level = state.meta.paragon?.level || 0;
    const cost = this.getLevelCost(state, config);
    const currency = state.meta.paragon?.currency || 0;
    const perLevel = config.paragon?.multiplierPerLevel || 0;
    const totalBonus = (perLevel * level * 100).toFixed(1);

    return {
      enabled: true,
      unlocked,
      level,
      currency,
      cost,
      canBuy: unlocked && currency >= cost,
      totalBonusPercent: totalBonus,
      multiplierPerLevelPercent: (perLevel * 100).toFixed(1),
      rulesExplanation: config.paragon.paragonCurrency?.rulesExplanation || '',
      unlockRequirements: unlocked ? [] : ConfigManager.buildRequirementRowsFromConditions(
        config.paragon.unlockConditions, state, fmt
      ),
      costProgress: ConfigManager.buildProgressEntry({
        current: currency,
        required: cost,
        icon: config.paragon.paragonCurrency?.icon || '💎',
        name: config.paragon.paragonCurrency?.displayName || 'Paragon Essence',
        code: 'paragonCurrency',
        formatNumber: fmt
      })
    };
  }
};
