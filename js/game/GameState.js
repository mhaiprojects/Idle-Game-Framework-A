import { EventBus, EVENTS } from '../core/EventBus.js';
import { ConfigManager } from '../core/ConfigManager.js';
import { FormulaEngine } from './FormulaEngine.js';
import { ModifierSystem } from './ModifierSystem.js';

export function createInitialState(config) {
  const fw = config.framework;
  const resources = {};
  for (const r of config.resources.resources) {
    resources[r.codeName] = { quantity: 0, totalEarned: 0, totalSpent: 0 };
  }

  const generators = {};
  for (const g of config.generators.generators) {
    generators[g.codeName] = { quantityPurchased: 0, totalSpent: 0, totalEarned: 0, isUnlocked: !g.unlockConditions };
  }

  const upgrades = {};
  for (const u of config.upgrades.upgrades) {
    upgrades[u.codeName] = { purchaseCount: 0 };
  }

  const achievements = {};
  for (const a of config.achievements.achievements) {
    achievements[a.codeName] = { unlocked: false, unlockedAt: null };
  }

  const characters = {};
  for (const c of config.characters.characters) {
    characters[c.codeName] = { unlocked: false, activated: false, level: 1, experience: 0, equipment: {}, skillCooldownRemaining: 0 };
  }

  const milestones = { lifetimeResourcesGenerated: {}, lifetimeGeneratorPurchases: 0, lifetimePrestiges: 0 };
  for (const r of config.resources.resources) {
    milestones.lifetimeResourcesGenerated[r.codeName] = 0;
  }

  const tiers = {};
  for (const t of config.ascension.ascensionTiers) {
    tiers[t.tier] = { prestigeCount: 0, timesAscendedTo: t.tier === 0 ? 1 : 0 };
  }

  const urlParams = new URLSearchParams(window.location.search);
  const devMode = urlParams.get('debug') === '1';

  return {
    resources,
    generators,
    upgrades,
    achievements,
    characters,
    inventory: {},
    artifacts: { acquired: {} },
    activeBuffs: [],
    activeEvents: [],
    meta: {
      ascension: { currentTier: 0, tiers, totalAscensions: 0 },
      milestones,
      titles: [],
      prestige: {
        currency: 0,
        lifetimeCurrencyEarned: 0,
        purchasedBonuses: {},
        run: { resourcesEarnedThisRun: {}, peakPrimaryCurrencyRateThisRun: 0 }
      }
    },
    stats: { totalTaps: 0, totalClicks: 0, playTimeSeconds: 0, eventsSeen: 0, offlineSecondsClaimed: 0 },
    settings: {
      sidebarPosition: fw.ui.sidebarDefaultPosition,
      soundEnabled: true,
      notificationsEnabled: true,
      showTutorial: true,
      devMode
    },
    ui: {
      purchaseMultiplier: 1,
      activeTab: 'generators',
      toasts: [],
      modals: [],
      resourceDeltas: [],
      lastTapGain: 0,
      stagnationTimer: 0,
      lastPrimaryCurrencyRate: 0,
      bestUpgradeCode: null,
      formulaInspector: null,
      activeEventBanner: null
    },
    _modCacheKey: '0',
    _lastTapTime: 0,
    _tickAccumulator: 0
  };
}

export class GameState {
  constructor(config, savedState) {
    this.config = config;
    this.data = savedState ? this._mergeSave(savedState) : createInitialState(config);
    this._bumpModCache();
  }

  _mergeSave(saved) {
    const fresh = createInitialState(this.config);
    const merged = deepMerge(fresh, saved);
    this._sanitizeEphemeralUI(merged);
    merged.settings.devMode = new URLSearchParams(window.location.search).get('debug') === '1';
    return merged;
  }

  _sanitizeEphemeralUI(data) {
    if (!data.ui) data.ui = {};
    data.ui.toasts = [];
    data.ui.modals = [];
    data.ui.resourceDeltas = [];
    data.ui.lastTapGain = 0;
    data.ui.stagnationTimer = 0;
    data.ui.lastPrimaryCurrencyRate = 0;
    data.ui.bestUpgradeCode = null;
    data.ui.formulaInspector = null;
    data.ui.activeEventBanner = null;
  }

  _bumpModCache() {
    this.data._modCacheKey = String(Date.now());
    ModifierSystem.invalidate();
  }

  get state() { return this.data; }

  getMods() {
    return ModifierSystem.collect(this.data, this.config);
  }

  addResource(codeName, amount, source) {
    if (amount === 0) return;
    const res = this.data.resources[codeName];
    if (!res) return;

    if (amount > 0) {
      res.quantity += amount;
      res.totalEarned += amount;
      this.data.meta.milestones.lifetimeResourcesGenerated[codeName] =
        (this.data.meta.milestones.lifetimeResourcesGenerated[codeName] || 0) + amount;
      this.data.meta.prestige.run.resourcesEarnedThisRun[codeName] =
        (this.data.meta.prestige.run.resourcesEarnedThisRun[codeName] || 0) + amount;
      EventBus.emit(EVENTS.RESOURCE_GAINED, { resource: codeName, amount, source });
    } else {
      res.quantity += amount;
      res.totalSpent += Math.abs(amount);
      EventBus.emit(EVENTS.RESOURCE_SPENT, { resource: codeName, amount: Math.abs(amount), source });
    }
    EventBus.emit(EVENTS.RESOURCE_CHANGED, { resource: codeName, quantity: res.quantity });
  }

  spendResources(costs) {
    for (const [res, amt] of Object.entries(costs)) {
      if ((this.data.resources[res]?.quantity || 0) < amt) return false;
    }
    for (const [res, amt] of Object.entries(costs)) {
      this.addResource(res, -amt, 'purchase');
    }
    return true;
  }

  performTap() {
    const fw = this.config.framework;
    const now = Date.now();
    if (fw.ui.tapAction.cooldownMs > 0 && now - this.data._lastTapTime < fw.ui.tapAction.cooldownMs) return 0;

    const mods = this.getMods();
    const gain = FormulaEngine.calculateTapGain(this.data, this.config, mods);
    const primary = ConfigManager.getPrimaryResource();
    this.addResource(primary.codeName, gain, 'tap');
    this.data.stats.totalTaps++;
    this.data.stats.totalClicks++;
    this.data.lastTapGain = gain;
    this.data.ui.lastTapGain = gain;
    this.data._lastTapTime = now;
    EventBus.emit(EVENTS.TAP_PERFORMED, { gain });
    EventBus.emit(EVENTS.CLICK_PERFORMED, { gain });
    return gain;
  }

  buyGenerator(codeName, qty) {
    const gen = ConfigManager.getGenerator(codeName);
    if (!gen) return false;

    const gs = this.data.generators[codeName];
    if (!gs.isUnlocked) {
      const unlock = FormulaEngine.evaluateUnlockConditions(gen.unlockConditions, this.data, this.config);
      if (!unlock.met) return false;
      gs.isUnlocked = true;
    }

    if (gen.requiredFeature && !ConfigManager.isFeatureUnlocked(gen.requiredFeature, this.data)) return false;

    const mods = this.getMods();
    const cost = FormulaEngine.calculateBulkCost(gen, gs.quantityPurchased, qty, mods, this.config, this.data);
    if (!this.spendResources(cost)) return false;

    gs.quantityPurchased += qty;
    gs.totalSpent += Object.values(cost).reduce((a, b) => a + b, 0);
    this.data.meta.milestones.lifetimeGeneratorPurchases += qty;
    this._bumpModCache();
    EventBus.emit(EVENTS.GENERATOR_PURCHASED, { generator: codeName, quantity: qty });
    return true;
  }

  buyUpgrade(codeName) {
    const upgrade = ConfigManager.getUpgrade(codeName);
    if (!upgrade) return false;

    const us = this.data.upgrades[codeName];
    if (ConfigManager.isUpgradeMaxed(upgrade, us.purchaseCount)) return false;

    const unlock = FormulaEngine.evaluateUnlockConditions(upgrade.unlockConditions, this.data, this.config);
    if (!unlock.met) return false;

    const cost = FormulaEngine.calculateUpgradeCost(upgrade, us.purchaseCount, this.config);
    if ((this.data.resources[upgrade.costResource]?.quantity || 0) < cost) return false;

    this.addResource(upgrade.costResource, -cost, 'upgrade');
    us.purchaseCount++;
    this._bumpModCache();
    EventBus.emit(EVENTS.UPGRADE_PURCHASED, { upgrade: codeName });
    return true;
  }

  activateSkill(codeName) {
    const char = this.config.characters.characters.find(c => c.activeSkill?.codeName === codeName);
    if (!char) return false;
    const cs = this.data.characters[char.codeName];
    if (!cs?.activated || cs.skillCooldownRemaining > 0) return false;

    const skill = char.activeSkill;
    ModifierSystem.applyTemporaryBuff(this.data, skill.effect, skill.codeName, skill.effect.durationSeconds);
    cs.skillCooldownRemaining = skill.cooldownSeconds;
    this._bumpModCache();
    EventBus.emit(EVENTS.SKILL_ACTIVATED, { skill: codeName });
    return true;
  }

  useBoost(itemCodeName) {
    const item = this.config.items.items.find(i => i.codeName === itemCodeName);
    if (!item || !item.actionBarEligible) return false;
    const qty = this.data.inventory[itemCodeName] || 0;
    if (qty <= 0) return false;

    this.data.inventory[itemCodeName] = qty - 1;
    if (item.effect?.durationSeconds) {
      ModifierSystem.applyTemporaryBuff(this.data, item.effect, itemCodeName, item.effect.durationSeconds);
    }
    this._bumpModCache();
    EventBus.emit(EVENTS.BOOST_USED, { item: itemCodeName });
    return true;
  }

  toggleCharacter(codeName) {
    const char = this.config.characters.characters.find(c => c.codeName === codeName);
    if (!char) return false;
    const cs = this.data.characters[codeName];
    const unlock = FormulaEngine.evaluateUnlockConditions(char.unlockConditions, this.data, this.config);
    if (!unlock.met) return false;

    cs.unlocked = true;
    if (cs.activated) {
      cs.activated = false;
    } else {
      const activeCount = Object.values(this.data.characters).filter(c => c.activated).length;
      const maxActive = this.config.framework.characters.maxActive;
      if (activeCount >= maxActive) return false;
      cs.activated = true;
    }
    this._bumpModCache();
    EventBus.emit(EVENTS.CHARACTER_ACTIVATED, { character: codeName, activated: cs.activated });
    return true;
  }

  addItem(codeName, quantity) {
    this.data.inventory[codeName] = (this.data.inventory[codeName] || 0) + quantity;
    EventBus.emit(EVENTS.ITEM_ACQUIRED, { item: codeName, quantity });
  }

  acquireArtifact(codeName) {
    if (this.data.artifacts.acquired[codeName]) return false;
    this.data.artifacts.acquired[codeName] = { acquiredAt: Date.now() };
    this._bumpModCache();
    EventBus.emit(EVENTS.ARTIFACT_ACQUIRED, { artifact: codeName });
    return true;
  }

  unlockAchievement(codeName) {
    const ach = this.data.achievements[codeName];
    if (!ach || ach.unlocked) return false;
    ach.unlocked = true;
    ach.unlockedAt = Date.now();

    const configAch = this.config.achievements.achievements.find(a => a.codeName === codeName);
    if (configAch?.reward) {
      const reward = configAch.reward;
      if (reward.type === 'resourceBonus') {
        this.addResource(reward.resource, reward.amount, 'achievement');
      } else if (reward.type === 'titleUnlock' && reward.title) {
        this.data.meta.titles = this.data.meta.titles || [];
        if (!this.data.meta.titles.includes(reward.title)) {
          this.data.meta.titles.push(reward.title);
        }
      } else if (reward.type === 'unlockGenerator' && reward.generator) {
        const gs = this.data.generators[reward.generator];
        if (gs) gs.isUnlocked = true;
      }
    }
    this._bumpModCache();
    EventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, { achievement: codeName });
    this.showToast(`${this.config.defaults.icons.toastAchievement} ${configAch?.displayName || codeName}`);
    return true;
  }

  showToast(message, durationMs) {
    const fw = this.config.framework;
    const id = Date.now();
    this.data.ui.toasts.push({ id, message });
    EventBus.emit(EVENTS.NOTIFICATION_SHOWN, { message });
    setTimeout(() => {
      this.data.ui.toasts = this.data.ui.toasts.filter(t => t.id !== id);
    }, durationMs || this.config.framework.ui.toastDurationMs);
  }

  showResourceDelta(resource, amount) {
    const id = Date.now() + Math.random();
    this.data.ui.resourceDeltas.push({ id, resource, amount });
    setTimeout(() => {
      this.data.ui.resourceDeltas = this.data.ui.resourceDeltas.filter(d => d.id !== id);
    }, this.config.framework.ui.toastDurationMs ?? this.config.defaults.calculations.toastDurationFallbackMs);
  }

  equipItem(characterCode, slot, itemCode) {
    const item = this.config.items.items.find(i => i.codeName === itemCode);
    if (!item || item.type !== 'equipable') return false;
    if ((this.data.inventory[itemCode] || 0) <= 0) return false;
    const cs = this.data.characters[characterCode];
    if (!cs?.unlocked) return false;
    if (item.slot && item.slot !== slot) return false;

    const available = ConfigManager.getAvailableEquipCount(this.data, itemCode, characterCode, slot);
    if (available <= 0 && cs.equipment?.[slot] !== itemCode) return false;

    cs.equipment = cs.equipment || {};
    cs.equipment[slot] = itemCode;
    this._bumpModCache();
    EventBus.emit(EVENTS.ITEM_EQUIPPED, { character: characterCode, slot, item: itemCode });
    return true;
  }

  unequipItem(characterCode, slot) {
    const cs = this.data.characters[characterCode];
    if (!cs?.equipment?.[slot]) return false;
    cs.equipment[slot] = null;
    this._bumpModCache();
    EventBus.emit(EVENTS.ITEM_EQUIPPED, { character: characterCode, slot, item: null });
    return true;
  }

  tickProduction(deltaSeconds) {
    const mods = this.getMods();

    for (const res of this.config.resources.resources) {
      const rate = FormulaEngine.calculateResourceRate(this.data, this.config, mods, res.codeName);
      const gain = rate * deltaSeconds;
      if (gain > 0) this.addResource(res.codeName, gain, 'production');
    }

    const primaryRate = FormulaEngine.calculatePrimaryCurrencyRate(this.data, this.config, mods);
    const peak = this.data.meta.prestige.run.peakPrimaryCurrencyRateThisRun
      ?? this.data.meta.prestige.run.peakPPSThisRun
      ?? this.config.defaults.calculations.peakPrimaryCurrencyRateFallback;
    if (primaryRate > peak) {
      this.data.meta.prestige.run.peakPrimaryCurrencyRateThisRun = primaryRate;
    }

    const fw = this.config.framework;
    if (primaryRate > this.data.ui.lastPrimaryCurrencyRate) {
      this.data.ui.stagnationTimer = 0;
    } else {
      this.data.ui.stagnationTimer += deltaSeconds;
    }
    this.data.ui.lastPrimaryCurrencyRate = primaryRate;

    for (const cs of Object.values(this.data.characters)) {
      if (cs.skillCooldownRemaining > 0) {
        cs.skillCooldownRemaining = Math.max(0, cs.skillCooldownRemaining - deltaSeconds);
      }
    }

    const now = Date.now();
    this.data.activeBuffs = (this.data.activeBuffs || []).filter(b => !b.expiresAt || b.expiresAt > now);
    this.data.activeEvents = (this.data.activeEvents || []).filter(e => !e.expiresAt || e.expiresAt > now);

    for (const gs of Object.values(this.data.generators)) {
      if (!gs.isUnlocked) continue;
    }

    for (const gen of this.config.generators.generators) {
      const gs = this.data.generators[gen.codeName];
      if (gs.isUnlocked) continue;
      const unlock = FormulaEngine.evaluateUnlockConditions(gen.unlockConditions, this.data, this.config);
      if (unlock.met) gs.isUnlocked = true;
    }

    this.data.stats.playTimeSeconds += deltaSeconds;
    EventBus.emit(EVENTS.GAME_TICK, { delta: deltaSeconds });
  }

  applyOfflineGains(gains, elapsedSeconds) {
    if (elapsedSeconds > 0) {
      this.data.stats.offlineSecondsClaimed = (this.data.stats.offlineSecondsClaimed || 0) + elapsedSeconds;
    }
    for (const [res, amt] of Object.entries(gains)) {
      if (amt > 0) this.addResource(res, amt, 'offline');
    }
    EventBus.emit(EVENTS.OFFLINE_PROGRESS, { gains });
  }

  setPurchaseMultiplier(value) {
    this.data.ui.purchaseMultiplier = value;
  }

  setSetting(key, value) {
    this.data.settings[key] = value;
  }

  toJSON() {
    const { _modCacheKey, _lastTapTime, _tickAccumulator, ...rest } = this.data;
    const copy = JSON.parse(JSON.stringify(rest));
    if (copy.ui) {
      copy.ui = {
        purchaseMultiplier: copy.ui.purchaseMultiplier ?? 1,
        activeTab: copy.ui.activeTab ?? 'generators'
      };
    }
    return copy;
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
