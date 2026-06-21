import { FormulaEngine } from './FormulaEngine.js';

let cachedMods = null;
let cacheKey = null;

export const ModifierSystem = {
  invalidate() {
    cachedMods = null;
    cacheKey = null;
  },

  collect(state, config) {
    const key = state._modCacheKey || '';
    if (cachedMods && cacheKey === key) return cachedMods;

    const mods = [];
    const now = Date.now();

    for (const upgrade of config.upgrades.upgrades) {
      const us = state.upgrades[upgrade.codeName];
      if (!us || us.purchaseCount <= 0) continue;
      const effect = upgrade.effect;
      this._addEffectMods(mods, effect, `upgrade:${upgrade.codeName}`, upgrade.category, upgrade.codeName, us.purchaseCount);
    }

    for (const ach of config.achievements.achievements) {
      const as = state.achievements[ach.codeName];
      if (!as?.unlocked) continue;
      const effect = ach.reward?.effect || (ach.reward?.type === 'modifierUnlock' ? ach.reward.effect : null);
      if (effect) this._addEffectMods(mods, effect, `achievement:${ach.codeName}`, null, null, 1);
    }

    for (const artifact of config.artifacts.artifacts) {
      if (!state.artifacts.acquired[artifact.codeName]) continue;
      this._addEffectMods(mods, artifact.effect, `artifact:${artifact.codeName}`, artifact.effect.category, null, 1);
    }

    const prestigeBonuses = config.prestige.prestigeBonuses || [];
    for (const bonus of prestigeBonuses) {
      const level = state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
      if (level <= 0) continue;
      const perLevel = bonus.effect.multiplierPerLevel || 0;
      const mult = 1 + perLevel * level;
      this._addEffectMods(mods, { ...bonus.effect, multiplier: mult }, `prestige:${bonus.codeName}`, null, null, 1);
    }

    for (const char of config.characters.characters) {
      const cs = state.characters[char.codeName];
      if (!cs?.activated) continue;
      if (char.baseStats?.globalMultiplier) {
        mods.push({ codeName: `char:${char.codeName}`, target: 'global', type: 'multiplicative', value: char.baseStats.globalMultiplier, priority: 20 });
      }
      if (char.baseStats?.clickMultiplier) {
        mods.push({ codeName: `char:${char.codeName}:click`, target: 'click', type: 'multiplicative', value: char.baseStats.clickMultiplier, priority: 20 });
      }
      if (char.baseStats?.categoryMultiplier) {
        const cm = char.baseStats.categoryMultiplier;
        mods.push({ codeName: `char:${char.codeName}:cat`, target: 'category', targetId: cm.category, type: 'multiplicative', value: cm.multiplier, priority: 20 });
      }
    }

    for (const [itemCode, qty] of Object.entries(state.inventory)) {
      if (qty <= 0) continue;
      const item = config.items.items.find(i => i.codeName === itemCode);
      if (!item || item.type !== 'equipable') continue;
      const equipped = Object.values(state.characters).some(c =>
        Object.values(c.equipment || {}).includes(itemCode)
      );
      if (equipped && item.effect) {
        this._addEffectMods(mods, item.effect, `equip:${itemCode}`, null, null, 1);
      }
    }

    for (const buff of state.activeBuffs || []) {
      if (buff.expiresAt && buff.expiresAt <= now) continue;
      this._addEffectMods(mods, buff.effect, `buff:${buff.codeName}`, buff.effect.category, null, 1);
    }

    for (const evt of state.activeEvents || []) {
      if (evt.expiresAt && evt.expiresAt <= now) continue;
      this._addEffectMods(mods, evt.effect, `event:${evt.codeName}`, evt.effect.category, null, 1);
    }

    cachedMods = mods;
    cacheKey = key;
    return mods;
  },

  _addEffectMods(mods, effect, codeName, category, targetId, count) {
    if (!effect) return;
    const mult = effect.multiplier || 1;
    const val = effect.type === 'costReduction' ? mult : mult;

    switch (effect.type) {
      case 'globalMultiplier':
        mods.push({ codeName, target: 'global', type: 'multiplicative', value: val, priority: 30 });
        break;
      case 'clickMultiplier':
        mods.push({ codeName, target: 'click', type: 'multiplicative', value: val, priority: 10 });
        break;
      case 'generatorMultiplier':
        mods.push({ codeName, target: 'generator', targetId: targetId || effect.generator, type: 'multiplicative', value: val, priority: 15 });
        break;
      case 'categoryMultiplier':
        mods.push({ codeName, target: 'category', targetId: effect.category || category, type: 'multiplicative', value: val, priority: 20 });
        break;
      case 'costReduction':
        mods.push({ codeName, target: 'cost', type: 'multiplicative', value: val, priority: 5 });
        break;
      case 'resourceMultiplier':
        mods.push({ codeName, target: 'resource', targetId: effect.resource, type: 'multiplicative', value: val, priority: 25 });
        break;
    }
  },

  applyTemporaryBuff(state, effect, codeName, durationSeconds) {
    const expiresAt = Date.now() + durationSeconds * 1000;
    state.activeBuffs = state.activeBuffs || [];
    state.activeBuffs.push({ codeName, effect, expiresAt });
    this.invalidate();
  }
};
