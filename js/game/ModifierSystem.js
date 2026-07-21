import { FormulaEngine } from './FormulaEngine.js';
import { ConfigManager } from '../core/ConfigManager.js';

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
        mods.push({
          codeName: `char:${char.codeName}`,
          target: 'global',
          type: 'multiplicative',
          stackKind: 'more',
          value: char.baseStats.globalMultiplier,
          priority: 20
        });
      }
      if (char.baseStats?.clickMultiplier) {
        mods.push({
          codeName: `char:${char.codeName}:click`,
          target: 'click',
          type: 'multiplicative',
          stackKind: 'more',
          value: char.baseStats.clickMultiplier,
          priority: 20
        });
      }
      if (char.baseStats?.categoryMultiplier) {
        const cm = char.baseStats.categoryMultiplier;
        mods.push({
          codeName: `char:${char.codeName}:cat`,
          target: 'category',
          targetId: cm.category,
          type: 'multiplicative',
          stackKind: 'more',
          value: cm.multiplier,
          priority: 20
        });
      }
    }

    for (const char of config.characters.characters) {
      const cs = state.characters[char.codeName];
      if (!cs) continue;
      for (const itemCode of Object.values(cs.equipment || {})) {
        if (!itemCode) continue;
        const item = config.items.items.find(i => i.codeName === itemCode);
        if (!item?.effect) continue;
        const stackQty = state.inventory[itemCode] ?? ConfigManager.getDefaultCalc('equipmentStackMinCopies');
        const effect = ConfigManager.getEffectiveItemEffect(item, stackQty);
        this._addEffectMods(mods, effect, `equip:${char.codeName}:${itemCode}`, null, null, 1);
      }
    }

    for (const buff of state.activeBuffs || []) {
      if (buff.expiresAt && buff.expiresAt <= now) continue;
      this._addEffectMods(
        mods, buff.effect, `buff:${buff.codeName}`, buff.effect.category, null, 1,
        { defaultStackKind: 'increased' }
      );
    }

    for (const evt of state.activeEvents || []) {
      if (evt.expiresAt && evt.expiresAt <= now) continue;
      this._addEffectMods(mods, evt.effect, `event:${evt.codeName}`, evt.effect.category, null, 1);
    }

    cachedMods = mods;
    cacheKey = key;
    return mods;
  },

  _addEffectMods(mods, effect, codeName, category, targetId, count, options = {}) {
    if (!effect) return;
    const mult = effect.multiplier ?? ConfigManager.getDefaultCalc('effectMultiplierDefault');
    const val = effect.type === 'costReduction' ? mult : mult;
    const stackKind = effect.stackKind || options.defaultStackKind || 'more';

    const pushMod = (target, targetIdValue, modType = 'multiplicative') => {
      mods.push({
        codeName,
        target,
        targetId: targetIdValue,
        type: modType,
        stackKind,
        value: val,
        priority: options.priority ?? 30
      });
    };

    switch (effect.type) {
      case 'globalMultiplier':
        pushMod('global', null);
        break;
      case 'clickMultiplier':
        pushMod('click', null, 'multiplicative');
        break;
      case 'generatorMultiplier':
        pushMod('generator', targetId || effect.generator);
        break;
      case 'categoryMultiplier':
        pushMod('category', effect.category || category);
        break;
      case 'costReduction':
        mods.push({
          codeName,
          target: 'cost',
          type: 'multiplicative',
          stackKind: 'more',
          value: val,
          priority: 5
        });
        break;
      case 'resourceMultiplier':
        pushMod('resource', effect.resource);
        break;
    }
  },

  applyTemporaryBuff(state, effect, codeName, durationSeconds) {
    const expiresAt = Date.now() + durationSeconds * 1000;
    state.activeBuffs = state.activeBuffs || [];
    state.activeBuffs.push({ codeName, effect, expiresAt });
    this.invalidate();
  },

  summarizeCharacterEffects(charCode, state, config, describeFn) {
    const char = config.characters.characters.find(c => c.codeName === charCode);
    const cs = state.characters[charCode];
    if (!char || !cs) return [];

    const describe = describeFn || (() => '');
    const buckets = {};

    const addEffect = (effect, source, activeOnly) => {
      if (!effect?.type) return;
      if (activeOnly && !cs.activated) return;
      const key = `${effect.type}:${effect.category || ''}:${effect.resource || ''}:${effect.generator || ''}`;
      if (!buckets[key]) {
        buckets[key] = { effect: { ...effect }, sources: [], product: effect.type === 'costReduction' ? 1 : 1 };
      }
      buckets[key].sources.push(source);
      const mult = effect.multiplier ?? 1;
      if (effect.type === 'costReduction') {
        buckets[key].product *= mult;
        buckets[key].effect.multiplier = buckets[key].product;
      } else {
        buckets[key].product *= mult;
        buckets[key].effect.multiplier = buckets[key].product;
      }
    };

    if (char.baseStats?.globalMultiplier) {
      addEffect({ type: 'globalMultiplier', multiplier: char.baseStats.globalMultiplier }, char.displayName, true);
    }
    if (char.baseStats?.clickMultiplier) {
      addEffect({ type: 'clickMultiplier', multiplier: char.baseStats.clickMultiplier }, char.displayName, true);
    }
    if (char.baseStats?.categoryMultiplier) {
      addEffect(char.baseStats.categoryMultiplier, char.displayName, true);
    }

    for (const itemCode of Object.values(cs.equipment || {})) {
      if (!itemCode) continue;
      const item = config.items.items.find(i => i.codeName === itemCode);
      if (!item?.effect) continue;
      const stackQty = state.inventory[itemCode] ?? ConfigManager.getDefaultCalc('equipmentStackMinCopies');
      const effect = ConfigManager.getEffectiveItemEffect(item, stackQty);
      addEffect(effect, item.displayName, false);
    }

    return Object.values(buckets).map(b => ({
      label: describe(b.effect),
      sources: b.sources.join(', '),
      effect: b.effect
    }));
  }
};
