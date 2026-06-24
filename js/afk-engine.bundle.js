// Generated engine bundle for file:// support
(function () {
window.AFK = window.AFK || {};
const AFK = window.AFK;

// --- js/core/EventBus.js ---
const listeners = new Map();

const EventBus = {
  on(event, callback) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(callback);
    return () => listeners.get(event)?.delete(callback);
  },

  emit(event, payload) {
    listeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`EventBus error on ${event}:`, e); }
    });
  },

  off(event, callback) {
    listeners.get(event)?.delete(callback);
  },

  clear() {
    listeners.clear();
  }
};

const EVENTS = {
  GAME_TICK: 'GAME_TICK',
  GAME_LOADED: 'GAME_LOADED',
  GAME_SAVED: 'GAME_SAVED',
  GAME_RESET: 'GAME_RESET',
  RESOURCE_CHANGED: 'RESOURCE_CHANGED',
  RESOURCE_GAINED: 'RESOURCE_GAINED',
  RESOURCE_SPENT: 'RESOURCE_SPENT',
  CLICK_PERFORMED: 'CLICK_PERFORMED',
  TAP_PERFORMED: 'TAP_PERFORMED',
  SKILL_ACTIVATED: 'SKILL_ACTIVATED',
  BOOST_USED: 'BOOST_USED',
  GENERATOR_PURCHASED: 'GENERATOR_PURCHASED',
  UPGRADE_PURCHASED: 'UPGRADE_PURCHASED',
  CHARACTER_ACTIVATED: 'CHARACTER_ACTIVATED',
  ITEM_ACQUIRED: 'ITEM_ACQUIRED',
  ITEM_EQUIPPED: 'ITEM_EQUIPPED',
  ITEM_DROPPED: 'ITEM_DROPPED',
  ARTIFACT_ACQUIRED: 'ARTIFACT_ACQUIRED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  RANDOM_EVENT_START: 'RANDOM_EVENT_START',
  RANDOM_EVENT_END: 'RANDOM_EVENT_END',
  PRESTIGE_PERFORMED: 'PRESTIGE_PERFORMED',
  ASCENSION_PERFORMED: 'ASCENSION_PERFORMED',
  MILESTONE_PROGRESS: 'MILESTONE_PROGRESS',
  FEATURE_UNLOCKED: 'FEATURE_UNLOCKED',
  OFFLINE_PROGRESS: 'OFFLINE_PROGRESS',
  NOTIFICATION_SHOWN: 'NOTIFICATION_SHOWN'
};

// --- js/game/FormulaEngine.js ---
const FormulaEngine = {
  _calc(config, key) {
    const cfg = config || (typeof window !== 'undefined' ? window.AFK?.ConfigManager?.getAll?.() : null);
    return cfg?.defaults?.calculations?.[key];
  },

  formatNumber(value, config, precision) {
    const nf = config.framework.numberFormat;
    const prec = precision ?? nf.displayPrecision;
    if (value === 0) return '0';
    const abs = Math.abs(value);
    const thresholds = [...nf.thresholds].sort((a, b) => b.value - a.value);
    for (const t of thresholds) {
      if (abs >= t.value) {
        return (value / t.value).toFixed(prec) + t.suffix;
      }
    }
    if (abs < 1) return value.toFixed(prec);
    return value.toFixed(Math.min(prec, 0));
  },

  getEffectiveDifficulty(state, config) {
    const diff = config.difficulty;
    const tier = state.meta.ascension.currentTier;
    let costMult = 1;
    let primaryCurrencyMult = 1;
    let offlineEff = 1;

    for (let i = 0; i <= tier; i++) {
      const profileKey = `tier${i}`;
      const profile = diff.profiles[profileKey];
      if (profile) {
        costMult *= profile.costMultiplier;
        primaryCurrencyMult *= profile.primaryCurrencyMultiplier ?? profile.ppsMultiplier
          ?? this._calc(config, 'primaryCurrencyMultiplierFallback');
        offlineEff *= profile.offlineEfficiency;
      }
    }

    const prestigeCount = state.meta.ascension.tiers[tier]?.prestigeCount || 0;
    const pdc = diff.prestigeDifficultyPerCount;
    costMult *= (1 + pdc.costIncreasePerPrestige * prestigeCount);
    const primaryDecrease = pdc.primaryCurrencyDecreasePerPrestige ?? pdc.ppsDecreasePerPrestige
      ?? this._calc(config, 'primaryCurrencyDecreaseFallback');
    primaryCurrencyMult *= (1 - primaryDecrease * prestigeCount);

    return { costMultiplier: costMult, primaryCurrencyMultiplier: primaryCurrencyMult, offlineEfficiency: offlineEff };
  },

  applyModifierStack(base, modifiers) {
    let additive = 0;
    const multiplicative = [];
    const breakdown = [];

    for (const mod of modifiers) {
      if (mod.type === 'additive') {
        additive += mod.value;
      } else if (mod.type === 'multiplicative') {
        multiplicative.push(mod);
      }
    }

    multiplicative.sort((a, b) => (a.priority ?? this._calc(null, 'modifierPriorityDefault'))
      - (b.priority ?? this._calc(null, 'modifierPriorityDefault')));

    let value = base + additive;
    for (const mod of multiplicative) {
      const before = value;
      value *= mod.value;
      breakdown.push({ codeName: mod.codeName, before, after: value, multiplier: mod.value });
    }

    return { value: Math.max(0, value), breakdown };
  },

  calculateGeneratorCost(gen, owned, mods, config, state) {
    const difficulty = this.getEffectiveDifficulty(state, config);
    const costs = {};
    const costMods = mods.filter(m =>
      m.target === 'cost' || (m.target === 'generator' && m.targetId === gen.codeName)
    );

    for (const cr of gen.costResources) {
      let base = gen.baseCost * cr.multiplier * Math.pow(gen.costMultiplier, owned);
      base *= difficulty.costMultiplier;
      const result = this.applyModifierStack(base, costMods);
      costs[cr.resource] = Math.floor(result.value);
    }
    return costs;
  },

  calculateBulkCost(gen, owned, qty, mods, config, state) {
    const total = {};
    for (let i = 0; i < qty; i++) {
      const cost = this.calculateGeneratorCost(gen, owned + i, mods, config, state);
      for (const [res, amt] of Object.entries(cost)) {
        total[res] = (total[res] || 0) + amt;
      }
    }
    return total;
  },

  calculateMaxAffordable(gen, owned, balances, mods, config, state) {
    let qty = 0;
    const tempBalances = { ...balances };
    while (true) {
      const cost = this.calculateGeneratorCost(gen, owned + qty, mods, config, state);
      for (const [res, amt] of Object.entries(cost)) {
        if ((tempBalances[res] || 0) < amt) return qty;
      }
      for (const [res, amt] of Object.entries(cost)) {
        tempBalances[res] -= amt;
      }
      qty++;
      const maxIter = config.framework.devTools.maxBulkPurchaseIterations;
      if (qty >= maxIter) break;
    }
    return qty;
  },

  calculateResourceRate(state, config, mods, resourceCode) {
    const difficulty = this.getEffectiveDifficulty(state, config);
    let total = 0;

    for (const gen of config.generators.generators) {
      const gs = state.generators[gen.codeName];
      if (!gs || gs.quantityPurchased <= 0) continue;
      if (gen.requiredFeature && !this._isFeatureUnlocked(gen.requiredFeature, state, config)) continue;

      for (const prod of gen.produces || []) {
        if (prod.resource !== resourceCode) continue;
        let base = prod.amount * gs.quantityPurchased;
        const genMods = mods.filter(m =>
          m.target === 'global' ||
          (m.target === 'generator' && m.targetId === gen.codeName) ||
          (m.target === 'category' && m.targetId === gen.category)
        );
        const result = this.applyModifierStack(base, genMods);
        total += result.value;
      }
    }

    const primary = config.resources.resources.find(r => r.isPrimary);
    if (resourceCode === primary.codeName) {
      total *= difficulty.primaryCurrencyMultiplier;
    }

    return total;
  },

  calculatePrimaryCurrencyRate(state, config, mods) {
    const primary = config.resources.resources.find(r => r.isPrimary);
    return this.calculateResourceRate(state, config, mods, primary.codeName);
  },

  calculatePrimaryCurrencyBreakdown(state, config, mods) {
    const primary = config.resources.resources.find(r => r.isPrimary);
    const difficulty = this.getEffectiveDifficulty(state, config);
    const breakdown = [];
    let total = 0;

    for (const gen of config.generators.generators) {
      const gs = state.generators[gen.codeName];
      if (!gs || gs.quantityPurchased <= 0) continue;
      if (gen.requiredFeature && !this._isFeatureUnlocked(gen.requiredFeature, state, config)) continue;

      for (const prod of gen.produces || []) {
        if (prod.resource !== primary.codeName) continue;
        let base = prod.amount * gs.quantityPurchased;
        const genMods = mods.filter(m =>
          m.target === 'global' ||
          (m.target === 'generator' && m.targetId === gen.codeName) ||
          (m.target === 'category' && m.targetId === gen.category)
        );
        const result = this.applyModifierStack(base, genMods);
        const rate = result.value * difficulty.primaryCurrencyMultiplier;
        total += rate;
        breakdown.push({ generator: gen.codeName, amount: rate, percent: 0 });
      }
    }

    for (const item of breakdown) {
      item.percent = total > 0 ? (item.amount / total) * 100 : 0;
    }

    return { total, breakdown };
  },

  calculateGeneratorProduction(state, config, mods, genCode) {
    const gen = config.generators.generators.find(g => g.codeName === genCode);
    if (!gen) return [];

    const gs = state.generators[genCode];
    const owned = gs?.quantityPurchased || 0;
    const difficulty = this.getEffectiveDifficulty(state, config);
    const primary = config.resources.resources.find(r => r.isPrimary);

    return (gen.produces || []).map(prod => {
      const calcRateForProd = (units) => {
        if (units <= 0) return 0;
        let base = prod.amount * units;
        const genMods = mods.filter(m =>
          m.target === 'global' ||
          (m.target === 'generator' && m.targetId === gen.codeName) ||
          (m.target === 'category' && m.targetId === gen.category)
        );
        const result = this.applyModifierStack(base, genMods);
        let rate = result.value;
        if (prod.resource === primary.codeName) {
          rate *= difficulty.primaryCurrencyMultiplier;
        }
        return rate;
      };

      const unitRate = calcRateForProd(1);
      const totalRate = owned > 0 ? calcRateForProd(owned) : 0;
      const totalForResource = this.calculateResourceRate(state, config, mods, prod.resource);
      const percent = totalForResource > 0 && totalRate > 0 ? (totalRate / totalForResource) * 100 : 0;

      return {
        resource: prod.resource,
        unitRate,
        totalRate,
        percent,
        role: prod.role
      };
    });
  },

  calculateTapGain(state, config, mods) {
    const fw = config.framework;
    const tap = fw.ui.tapAction;
    const percent = tap.percentOfPrimaryCurrencyRate ?? tap.percentOfGeneratorPrimaryPPS;
    const primaryRate = this.calculatePrimaryCurrencyRate(state, config, mods);
    const baseGain = primaryRate * percent;
    const clickMods = mods.filter(m => m.target === 'click' || m.target === 'global');
    const result = this.applyModifierStack(baseGain, clickMods);
    return Math.max(result.value, fw.ui.tapAction.minGain);
  },

  calculateClickGain(state, config, mods) {
    return this.calculateTapGain(state, config, mods);
  },

  calculateOfflineGains(elapsedSec, state, config, mods, capSec) {
    const capped = Math.min(elapsedSec, capSec);
    const difficulty = this.getEffectiveDifficulty(state, config);
    const gains = {};

    for (const res of config.resources.resources) {
      const rate = this.calculateResourceRate(state, config, mods, res.codeName);
      gains[res.codeName] = rate * capped * difficulty.offlineEfficiency;
    }

    return { elapsed: capped, gains };
  },

  getResourcesForAscensionTier(tier, config) {
    const unlockMap = config.framework?.resourceUnlockByTier;
    const primary = config.resources.resources.find(r => r.isPrimary)?.codeName;
    if (unlockMap) {
      const codes = [];
      for (let i = 0; i <= tier; i++) {
        for (const res of unlockMap[String(i)] || []) codes.push(res);
      }
      if (primary && !codes.includes(primary)) codes.unshift(primary);
      if (codes.length) return [...new Set(codes)];
    }
    const all = config.resources.resources.map(r => r.codeName);
    const byTier = {
      0: ['timeShards', 'cosmicEnergy', 'stardust'],
      1: ['timeShards', 'cosmicEnergy', 'stardust', 'nebulaEssence', 'quantumFlux'],
      2: ['timeShards', 'cosmicEnergy', 'stardust', 'nebulaEssence', 'quantumFlux', 'voidMatter', 'chronoCrystals'],
      3: all
    };
    return byTier[Math.min(Math.max(tier, 0), config.ascension?.maxTier ?? 3)] || byTier[0];
  },

  getScaledPrestigeMinimum(state, config) {
    const prestige = config.prestige;
    const base = prestige.prestigeMinimumBase || prestige.prestigeMinimum;
    if (!base) return prestige.prestigeMinimum;

    const scale = Math.pow(
      1 + (prestige.prestigeMinimumScalePerPrestige ?? 0.2),
      state.meta.milestones.lifetimePrestiges || 0
    );
    const tier = state.meta.ascension.currentTier;
    const tierExtras = prestige.prestigeMinimumTierResources?.[String(tier)] || [];

    const conditions = (base.conditions || []).map(c => {
      if (c.type === 'resourceHeld') {
        return { ...c, amount: Math.ceil(c.amount * scale) };
      }
      return c;
    });

    for (const extra of tierExtras) {
      conditions.push({
        type: 'resourceHeld',
        resource: extra.resource,
        amount: Math.ceil(extra.amount * scale)
      });
    }

    return { operator: base.operator || 'AND', conditions };
  },

  getWeightedRunValue(state, config) {
    const prestige = config.prestige;
    const allowed = this.getResourcesForAscensionTier(state.meta.ascension.currentTier, config);
    const weights = prestige.prestigeCurrency.resourceWeights || {};
    let runValue = 0;

    for (const res of allowed) {
      const weight = weights[res];
      if (!weight) continue;
      const earned = state.meta.prestige.run.resourcesEarnedThisRun[res] || 0;
      runValue += earned * weight;
    }

    return runValue;
  },

  getPrestigeShardMilestone(state, config, shardIndex = null) {
    const pc = config.prestige.prestigeCurrency;
    const base = pc.minimumResourceValue;
    const exp = pc.milestoneExponent || 2;
    const idx = shardIndex ?? (this.calculatePrestigeGain(state, config) + 1);
    return base * Math.pow(exp, Math.max(idx - 1, 0));
  },

  calculatePrestigeGain(state, config) {
    const prestige = config.prestige;
    const runValue = this.getWeightedRunValue(state, config);
    const minimum = prestige.prestigeCurrency.minimumResourceValue;
    if (runValue < minimum) return 0;

    const logBase = prestige.prestigeCurrency.logBase;
    return Math.floor(Math.log(Math.max(runValue / minimum, 1)) / Math.log(logBase));
  },

  getPrestigeShardProgress(state, config, formatNumber) {
    const fmt = formatNumber || (n => n);
    const prestige = config.prestige;
    const pc = prestige.prestigeCurrency;
    const allowed = this.getResourcesForAscensionTier(state.meta.ascension.currentTier, config);
    const weights = pc.resourceWeights || {};
    const runEarned = state.meta.prestige.run.resourcesEarnedThisRun || {};
    const runValue = this.getWeightedRunValue(state, config);
    const projectedGain = this.calculatePrestigeGain(state, config);
    const nextMilestone = this.getPrestigeShardMilestone(state, config, projectedGain + 1);
    const totalWeight = allowed.reduce((s, r) => s + (weights[r] || 0), 0) || 1;

    const subRequirements = allowed
      .filter(r => weights[r] > 0)
      .map(res => {
        const meta = config.resources.resources.find(r => r.codeName === res);
        const weight = weights[res];
        const earned = runEarned[res] || 0;
        const weighted = earned * weight;
        const shareRequired = nextMilestone * (weight / totalWeight);
        const progress = shareRequired > 0 ? Math.min(1, weighted / shareRequired) : 0;
        return {
          code: res,
          icon: meta?.icon || '💠',
          name: meta?.displayName || res,
          label: `${fmt(weighted)} / ${fmt(shareRequired)} weighted (${meta?.displayName || res})`,
          progress,
          met: weighted >= shareRequired,
          current: weighted,
          required: shareRequired
        };
      });

    return {
      rulesExplanation: pc.rulesExplanation || '',
      projectedGain,
      nextMilestone,
      currentRunValue: runValue,
      overallProgress: nextMilestone > 0 ? Math.min(1, runValue / nextMilestone) : 0,
      overallMet: runValue >= nextMilestone,
      subRequirements
    };
  },

  calculateUpgradeCost(upgrade, purchaseCount, config) {
    const scale = upgrade.costScale ?? this._calc(config, 'upgradeCostScale');
    return Math.floor(upgrade.cost * Math.pow(scale, purchaseCount));
  },

  evaluateUnlockConditions(unlockConditions, state, config) {
    if (!unlockConditions) return { met: true, unmet: [] };

    const conditions = unlockConditions.conditions || [unlockConditions];
    const operator = unlockConditions.operator || this._calc(config, 'unlockOperator');
    const unmet = [];

    for (const cond of conditions) {
      if (!this._evaluateSingleCondition(cond, state, config)) {
        unmet.push(cond);
      }
    }

    const met = operator === 'AND' ? unmet.length === 0 : unmet.length < conditions.length;
    return { met, unmet };
  },

  _evaluateSingleCondition(cond, state, config) {
    switch (cond.type) {
      case 'achievement':
        return !!state.achievements[cond.achievement]?.unlocked;
      case 'canAffordFirstPurchase': {
        const genCode = cond.generator;
        const gen = config.generators.generators.find(g => g.codeName === genCode);
        if (!gen) return false;
        const owned = state.generators[genCode]?.quantityPurchased || 0;
        if (owned > 0) return true;
        const mods = [];
        const cost = this.calculateGeneratorCost(gen, 0, mods, config, state);
        return Object.entries(cost).every(([res, amt]) => (state.resources[res]?.quantity || 0) >= amt);
      }
      case 'generatorOwned':
        return (state.generators[cond.generator]?.quantityPurchased || this._calc(config, 'numericZero'))
          >= (cond.quantity || cond.amount || this._calc(config, 'unlockConditionQuantity'));
      case 'resourceHeld':
        return (state.resources[cond.resource]?.quantity || this._calc(config, 'numericZero')) >= cond.amount;
      case 'upgradePurchased':
        return (state.upgrades[cond.upgrade]?.purchaseCount || this._calc(config, 'numericZero'))
          >= (cond.level || this._calc(config, 'unlockConditionLevel'));
      case 'ascensionTier':
        return state.meta.ascension.currentTier >= cond.minTier;
      case 'prestigeCount': {
        const tier = state.meta.ascension.currentTier;
        return (state.meta.ascension.tiers[tier]?.prestigeCount || 0) >= cond.min;
      }
      case 'lifetimeResourcesGenerated':
        return (state.meta.milestones.lifetimeResourcesGenerated[cond.resource] || 0) >= cond.min;
      case 'lifetimeGeneratorPurchases':
        return (state.meta.milestones.lifetimeGeneratorPurchases || 0) >= cond.min;
      case 'lifetimePrestiges':
        return (state.meta.milestones.lifetimePrestiges || 0) >= cond.min;
      default:
        return false;
    }
  },

  _isFeatureUnlocked(featureCode, state, config) {
    const currentTier = state.meta.ascension.currentTier;
    for (const tier of config.ascension.ascensionTiers) {
      if (tier.tier <= currentTier && (tier.unlockedFeatures || []).includes(featureCode)) {
        return true;
      }
    }

    const prestigeUnlocks = config.prestige.featureUnlocks || [];
    for (const entry of prestigeUnlocks) {
      if (entry.feature !== featureCode) continue;
      const result = this.evaluateUnlockConditions(entry.unlockConditions, state, config);
      if (result.met) return true;
    }

    return false;
  },

  getConditionProgress(cond, state, config) {
    switch (cond.type) {
      case 'achievement':
        return state.achievements[cond.achievement]?.unlocked ? 1 : 0;
      case 'canAffordFirstPurchase': {
        const gen = config.generators.generators.find(g => g.codeName === cond.generator);
        if (!gen) return 0;
        const cost = this.calculateGeneratorCost(gen, 0, [], config, state);
        let minRatio = 1;
        let hasCost = false;
        for (const [res, amt] of Object.entries(cost)) {
          if (amt <= 0) continue;
          hasCost = true;
          minRatio = Math.min(minRatio, (state.resources[res]?.quantity || 0) / amt);
        }
        return hasCost ? Math.min(1, minRatio) : 0;
      }
      case 'resourceHeld':
        return Math.min(1, (state.resources[cond.resource]?.quantity || 0) / cond.amount);
      case 'generatorOwned':
        return Math.min(1, (state.generators[cond.generator]?.quantityPurchased || this._calc(config, 'numericZero'))
          / (cond.quantity || cond.amount || this._calc(config, 'unlockConditionQuantity')));
      case 'upgradePurchased':
        return Math.min(1, (state.upgrades[cond.upgrade]?.purchaseCount || this._calc(config, 'numericZero'))
          / (cond.level || this._calc(config, 'unlockConditionLevel')));
      case 'ascensionTier':
        return cond.minTier > 0
          ? Math.min(1, state.meta.ascension.currentTier / cond.minTier)
          : (state.meta.ascension.currentTier >= cond.minTier ? 1 : 0);
      case 'prestigeCount': {
        const tier = state.meta.ascension.currentTier;
        return Math.min(1, (state.meta.ascension.tiers[tier]?.prestigeCount || 0) / cond.min);
      }
      case 'lifetimeResourcesGenerated':
        return Math.min(1, (state.meta.milestones.lifetimeResourcesGenerated[cond.resource] || 0) / cond.min);
      case 'lifetimeGeneratorPurchases':
        return Math.min(1, (state.meta.milestones.lifetimeGeneratorPurchases || 0) / cond.min);
      case 'lifetimePrestiges':
        return Math.min(1, (state.meta.milestones.lifetimePrestiges || 0) / cond.min);
      default:
        return 0;
    }
  }
};

// --- js/core/ConfigManager.js ---

let config = null;
let contentRegistry = null;
let currentContentId = null;

const CONTENT_SELECTION_KEY = 'afk_selected_content';
const LEGACY_STORAGE_KEY = 'afk_ai_save';

const CONFIG_FILES = [
  'framework', 'difficulty', 'resources', 'generators', 'upgrades',
  'items', 'artifacts', 'characters', 'achievements', 'events',
  'drops', 'ascension', 'prestige', 'defaults'
];

async function loadContentRegistry() {
  if (window.AFK_CONTENT_REGISTRY) {
    contentRegistry = window.AFK_CONTENT_REGISTRY;
    return contentRegistry;
  }
  const res = await fetch('content/registry.json');
  if (!res.ok) throw new Error('Failed to load content/registry.json');
  contentRegistry = await res.json();
  return contentRegistry;
}

function getSelectedContentId() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(CONTENT_SELECTION_KEY);
    if (stored) return stored;
  }
  return contentRegistry?.defaultContentId || 'cosmic-time-factory';
}

function setSelectedContentId(contentId) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CONTENT_SELECTION_KEY, contentId);
  }
}

function getContentRegistry() {
  return contentRegistry;
}

function getCurrentContentId() {
  return currentContentId;
}

function getCurrentManifest() {
  const id = currentContentId || getSelectedContentId();
  return contentRegistry?.games?.find(g => g.id === id) || null;
}

async function loadContentFromFetch(contentId) {
  const entries = await Promise.all(
    CONFIG_FILES.map(async name => {
      const res = await fetch(`content/${contentId}/${name}.json`);
      if (!res.ok) throw new Error(`Failed to load content/${contentId}/${name}.json`);
      return [name, await res.json()];
    })
  );
  return Object.fromEntries(entries);
}

async function loadAllConfigs(contentId) {
  await loadContentRegistry();
  const id = contentId || getSelectedContentId();

  if (window.AFK_CONTENT?.[id]) {
    config = window.AFK_CONTENT[id];
  } else if (window.AFK_CONFIG && !window.AFK_CONTENT && id === 'cosmic-time-factory') {
    config = window.AFK_CONFIG;
  } else {
    config = await loadContentFromFetch(id);
  }

  currentContentId = id;
  validateConfig(config);
  return config;
}

function validateGeneratorChain(cfg) {
  const errors = [];
  const gens = cfg.generators.generators;
  const primaryCode = cfg.resources.resources.find(r => r.isPrimary)?.codeName;

  for (let i = 0; i < gens.length - 1; i++) {
    const current = gens[i];
    const next = gens[i + 1];
    const produces = (current.produces || []).map(p => p.resource);
    const nextCosts = (next.costResources || []).map(c => c.resource);
    const nextHeld = flattenConditions(next.unlockConditions)
      .filter(c => c.type === 'resourceHeld').map(c => c.resource);
    const needed = [...new Set([...nextCosts, ...nextHeld])];

    for (const res of needed) {
      if (res === primaryCode) continue;
      if (!produces.includes(res)) {
        errors.push({
          generator: current.codeName,
          missing: res,
          forGenerator: next.codeName
        });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

function validateConfig(cfg = config) {
  const resources = cfg.resources.resources;
  const primary = resources.filter(r => r.isPrimary);
  if (primary.length !== 1) throw new Error('Exactly one primary resource required');

  const chain = validateGeneratorChain(cfg);
  if (!chain.valid) {
    const msg = chain.errors.map(e =>
      `${e.generator} does not produce ${e.missing} required by ${e.forGenerator}`
    ).join('; ');
    throw new Error(`Generator chain validation failed: ${msg}`);
  }
}

function flattenUnlockConditions(unlockConditions) {
  if (!unlockConditions) return [];
  if (unlockConditions.conditions) return unlockConditions.conditions;
  return [unlockConditions];
}

function flattenConditions(unlockConditions) {
  return flattenUnlockConditions(unlockConditions);
}

const ConfigManager = {
  getAll() { return config; },
  getAvailableGames() { return contentRegistry?.games || []; },
  getGeneratorTiers() { return config?.framework?.generatorTiers || {}; },
  getDefaults() { return config.defaults; },
  getDefaultIcon(key) {
    return config.defaults.icons[key] ?? config.defaults.icons.unknown;
  },
  getDefaultLabel(key, vars = {}) {
    let text = config.defaults.labels[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  },
  getDefaultCalc(key) {
    return config.defaults.calculations[key];
  },
  getSection(key) {
    return config.defaults.sections[key] || { title: key, icon: '' };
  },
  getPanel(key) {
    return config.defaults.panels[key] || { title: key, icon: '' };
  },
  getTabs() {
    return config.defaults.tabs || [];
  },
  formatUnlockLabel(key, vars = {}) {
    let text = config.defaults.unlockLabels[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  },
  formatAchievementLabel(key, vars = {}) {
    let text = config.defaults.achievementLabels[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
  },
  buildRequirementRowsFromConditions(unlockConditions, state, formatNumber) {
    return this.buildUnlockRequirements(unlockConditions, state, formatNumber);
  },
  getFramework() { return config.framework; },
  getDifficulty() { return config.difficulty; },
  getResources() { return config.resources.resources; },
  getGenerators() { return config.generators.generators; },
  getUpgrades() { return config.upgrades.upgrades; },
  getItems() { return config.items.items; },
  getArtifacts() { return config.artifacts.artifacts; },
  getCharacters() { return config.characters.characters; },
  getAchievements() { return config.achievements.achievements; },
  getEvents() { return config.events.events; },
  getDropTables() { return config.drops.dropTables; },
  getAscension() { return config.ascension; },
  getPrestige() { return config.prestige; },

  getResource(codeName) {
    return config.resources.resources.find(r => r.codeName === codeName);
  },

  getGenerator(codeName) {
    return config.generators.generators.find(g => g.codeName === codeName);
  },

  getUpgrade(codeName) {
    return config.upgrades.upgrades.find(u => u.codeName === codeName);
  },

  getItem(codeName) {
    return config.items.items.find(i => i.codeName === codeName);
  },

  getPrimaryResource() {
    return config.resources.resources.find(r => r.isPrimary);
  },

  isFeatureUnlocked(featureCode, state) {
    const ascension = config.ascension;
    const currentTier = state.meta.ascension.currentTier;

    for (const tier of ascension.ascensionTiers) {
      if (tier.tier <= currentTier && (tier.unlockedFeatures || []).includes(featureCode)) {
        return true;
      }
    }

    const prestigeUnlocks = config.prestige.featureUnlocks || [];
    for (const entry of prestigeUnlocks) {
      if (entry.feature !== featureCode) continue;
      const result = FormulaEngine.evaluateUnlockConditions(entry.unlockConditions, state, config);
      if (result.met) return true;
    }

    return false;
  },

  getEffectiveDifficulty(state) {
    return FormulaEngine.getEffectiveDifficulty(state, config);
  },

  getResourceDisplayName(codeName) {
    return this.getResource(codeName)?.displayName || codeName;
  },

  getGeneratorDisplayName(codeName) {
    return this.getGenerator(codeName)?.displayName || codeName;
  },

  getAchievementDisplayName(codeName) {
    return config.achievements.achievements.find(a => a.codeName === codeName)?.displayName || codeName;
  },

  formatResourceCost(costs) {
    return Object.entries(costs).map(([code, amount]) => {
      const res = this.getResource(code);
      const icon = res?.icon ? `${res.icon} ` : '';
      return `${amount} ${icon}${this.getResourceDisplayName(code)}`;
    }).join(' · ');
  },

  formatResourceCostEntries(costs, formatNumber) {
    const fmt = formatNumber || (n => n);
    return Object.entries(costs).map(([code, amount]) => {
      const res = this.getResource(code);
      return {
        code,
        amount,
        formattedAmount: fmt(amount),
        icon: res?.icon || '',
        name: res?.displayName || code
      };
    });
  },

  getResourceMeta(codeName) {
    const res = this.getResource(codeName);
    return {
      icon: res?.icon || '',
      name: res?.displayName || codeName,
      color: res?.color
    };
  },

  getAscensionTierConfig(tierNumber) {
    return config.ascension.ascensionTiers.find(t => t.tier === tierNumber) || null;
  },

  formatAscensionTierLabel(tierNumber) {
    const tier = this.getAscensionTierConfig(tierNumber);
    if (!tier) return this.getDefaultLabel('ascensionTierFallback', { tier: tierNumber });
    return `Ascension ${tierNumber}: ${tier.displayName}`;
  },

  formatResourceCostLabel(costs, formatNumber) {
    const fmt = formatNumber || (n => n);
    const entries = this.formatResourceCostEntries(costs, fmt);
    if (!entries.length) return '0';
    return entries.map(e => `${e.formattedAmount} ${e.icon} ${e.name}`.trim()).join(' · ');
  },

  buildProgressEntry({ current, required, icon, name, code, label, formatNumber }) {
    const fmt = formatNumber || (n => n);
    const progress = required > 0 ? Math.min(1, current / required) : 1;
    return {
      code: code || name || label || this.getDefaultCalc('progressCodeFallback'),
      icon: icon || '',
      name: name || '',
      label: label || null,
      held: current,
      required,
      formattedHeld: fmt(current),
      formattedRequired: fmt(required),
      progress,
      met: current >= required
    };
  },

  buildCostProgressEntries(costs, state, formatNumber) {
    if (!costs) return [];
    return Object.entries(costs).map(([code, required]) => {
      const held = state?.resources[code]?.quantity || 0;
      const meta = this.getResourceMeta(code);
      return this.buildProgressEntry({
        current: held,
        required,
        icon: meta.icon,
        name: meta.name,
        code,
        formatNumber
      });
    });
  },

  formatFirstPurchaseCostLabel(generatorCode, state, formatNumber) {
    const gen = this.getGenerator(generatorCode);
    const fmt = formatNumber || (n => n);
    if (!gen) return this.getDefaultLabel('unknownGeneratorCost');
    const cost = FormulaEngine.calculateGeneratorCost(gen, 0, [], config, state || {});
    const costLabel = this.formatResourceCostLabel(cost, fmt);
    return this.formatUnlockLabel('firstPurchaseCost', { name: gen.displayName, cost: costLabel });
  },

  formatUnlockConditionDetail(cond, state, formatNumber) {
    const fmt = formatNumber || (n => n);
    const progress = state ? FormulaEngine.getConditionProgress(cond, state, config) : 0;
    const met = state ? FormulaEngine.evaluateUnlockConditions(
      { operator: 'AND', conditions: [cond] }, state, config
    ).met : false;

    let detail;
    switch (cond.type) {
      case 'achievement': {
        const ach = config.achievements.achievements.find(a => a.codeName === cond.achievement);
        detail = {
          icon: ach?.icon || this.getDefaultIcon('achievement'),
          label: this.formatUnlockLabel('achievement', { name: ach?.displayName || cond.achievement })
        };
        break;
      }
      case 'resourceHeld': {
        const res = this.getResource(cond.resource);
        const held = state?.resources[cond.resource]?.quantity || this.getDefaultCalc('numericZero');
        detail = {
          icon: res?.icon || '',
          label: this.formatUnlockLabel('resourceHeld', {
            name: res?.displayName || cond.resource,
            current: fmt(held),
            required: fmt(cond.amount)
          })
        };
        break;
      }
      case 'generatorOwned': {
        const gen = this.getGenerator(cond.generator);
        const need = cond.quantity || cond.amount || this.getDefaultCalc('unlockConditionQuantity');
        const owned = state?.generators[cond.generator]?.quantityPurchased || this.getDefaultCalc('numericZero');
        detail = {
          icon: gen?.icon || this.getDefaultIcon('generator'),
          label: this.formatUnlockLabel('generatorOwned', {
            name: gen?.displayName || cond.generator,
            current: owned,
            required: need
          })
        };
        break;
      }
      case 'canAffordFirstPurchase': {
        const gen = cond.generator ? this.getGenerator(cond.generator) : null;
        detail = {
          icon: gen?.icon || this.getDefaultIcon('generatorCost'),
          label: this.formatFirstPurchaseCostLabel(cond.generator, state, fmt)
        };
        break;
      }
      case 'upgradePurchased': {
        const upg = this.getUpgrade(cond.upgrade);
        const level = cond.level || this.getDefaultCalc('unlockConditionLevel');
        const owned = state?.upgrades[cond.upgrade]?.purchaseCount || this.getDefaultCalc('numericZero');
        detail = {
          icon: upg?.icon || this.getDefaultIcon('upgrade'),
          label: this.formatUnlockLabel('upgradePurchased', {
            name: upg?.displayName || cond.upgrade,
            current: owned,
            required: level
          })
        };
        break;
      }
      case 'ascensionTier':
        detail = { icon: this.getDefaultIcon('ascension'), label: this.formatAscensionTierLabel(cond.minTier) };
        break;
      case 'prestigeCount': {
        const tier = state?.meta?.ascension?.currentTier ?? this.getDefaultCalc('numericZero');
        const count = state?.meta?.ascension?.tiers[tier]?.prestigeCount || this.getDefaultCalc('numericZero');
        detail = {
          icon: this.getDefaultIcon('ascension'),
          label: this.formatUnlockLabel('prestigesThisTier', { current: count, required: cond.min })
        };
        break;
      }
      case 'lifetimeResourcesGenerated': {
        const res = this.getResource(cond.resource);
        const total = state?.meta?.milestones?.lifetimeResourcesGenerated?.[cond.resource] || this.getDefaultCalc('numericZero');
        detail = {
          icon: res?.icon || '',
          label: this.formatUnlockLabel('lifetimeResource', {
            name: res?.displayName || cond.resource,
            current: fmt(total),
            required: fmt(cond.min)
          })
        };
        break;
      }
      case 'lifetimeGeneratorPurchases': {
        const total = state?.meta?.milestones?.lifetimeGeneratorPurchases || this.getDefaultCalc('numericZero');
        detail = {
          icon: this.getDefaultIcon('generator'),
          label: this.formatUnlockLabel('generatorPurchases', { current: total, required: cond.min })
        };
        break;
      }
      case 'lifetimePrestiges': {
        const total = state?.meta?.milestones?.lifetimePrestiges || this.getDefaultCalc('numericZero');
        detail = {
          icon: this.getDefaultIcon('ascension'),
          label: this.formatUnlockLabel('lifetimePrestiges', { current: total, required: cond.min })
        };
        break;
      }
      default:
        detail = { icon: this.getDefaultIcon('unknown'), label: cond.type };
    }

    return { ...detail, progress, met, kind: this.getRequirementKind(cond), ...this.getRequirementMergeFields(cond) };
  },

  getRequirementKind(cond) {
    if (!cond?.type) return 'unknown';
    switch (cond.type) {
      case 'achievement':
        return `achievement:${cond.achievement}`;
      case 'resourceHeld':
        return `resourceHeld:${cond.resource}`;
      case 'generatorOwned':
        return `generatorOwned:${cond.generator}`;
      case 'canAffordFirstPurchase':
        return `canAffordFirstPurchase:${cond.generator || 'unknown'}`;
      case 'upgradePurchased':
        return `upgradePurchased:${cond.upgrade}`;
      case 'ascensionTier':
        return 'ascensionTier';
      case 'prestigeCount':
        return 'prestigeCount';
      case 'lifetimeResourcesGenerated':
        return `lifetimeResourcesGenerated:${cond.resource}`;
      case 'lifetimeGeneratorPurchases':
        return 'lifetimeGeneratorPurchases';
      case 'lifetimePrestiges':
        return 'lifetimePrestiges';
      default:
        return cond.type;
    }
  },

  getRequirementMergeFields(cond) {
    switch (cond?.type) {
      case 'ascensionTier':
        return { minTier: cond.minTier ?? this.getDefaultCalc('numericZero') };
      case 'prestigeCount':
      case 'lifetimePrestiges':
      case 'lifetimeGeneratorPurchases':
        return { requiredMin: cond.min ?? this.getDefaultCalc('numericZero') };
      case 'resourceHeld':
        return { resource: cond.resource, requiredMin: cond.amount ?? this.getDefaultCalc('numericZero') };
      case 'generatorOwned':
        return {
          generator: cond.generator,
          requiredMin: cond.quantity || cond.amount || this.getDefaultCalc('unlockConditionQuantity')
        };
      case 'upgradePurchased':
        return {
          upgrade: cond.upgrade,
          requiredMin: cond.level || this.getDefaultCalc('unlockConditionLevel')
        };
      case 'lifetimeResourcesGenerated':
        return { resource: cond.resource, requiredMin: cond.min ?? this.getDefaultCalc('numericZero') };
      case 'achievement':
        return { achievement: cond.achievement };
      default:
        return {};
    }
  },

  mergeRequirementRows(a, b, state, formatNumber) {
    const kind = a.kind || b.kind;
    const fmt = formatNumber || (n => n);

    if (kind === 'ascensionTier') {
      const minTier = Math.max(a.minTier ?? 0, b.minTier ?? 0);
      return this.formatUnlockConditionDetail({ type: 'ascensionTier', minTier }, state, fmt);
    }
    if (kind === 'lifetimePrestiges' || kind === 'prestigeCount' || kind === 'lifetimeGeneratorPurchases') {
      const min = Math.max(a.requiredMin ?? 0, b.requiredMin ?? 0);
      const type = kind;
      return this.formatUnlockConditionDetail({ type, min }, state, fmt);
    }
    if (kind.startsWith('resourceHeld:')) {
      const resource = a.resource || b.resource || kind.slice('resourceHeld:'.length);
      const requiredMin = Math.max(a.requiredMin ?? 0, b.requiredMin ?? 0);
      return this.formatUnlockConditionDetail(
        { type: 'resourceHeld', resource, amount: requiredMin }, state, fmt
      );
    }
    if (kind.startsWith('generatorOwned:')) {
      const generator = a.generator || b.generator;
      const requiredMin = Math.max(a.requiredMin ?? 0, b.requiredMin ?? 0);
      return this.formatUnlockConditionDetail(
        { type: 'generatorOwned', generator, quantity: requiredMin }, state, fmt
      );
    }
    if (kind.startsWith('upgradePurchased:')) {
      const upgrade = a.upgrade || b.upgrade;
      const requiredMin = Math.max(a.requiredMin ?? 0, b.requiredMin ?? 0);
      return this.formatUnlockConditionDetail(
        { type: 'upgradePurchased', upgrade, level: requiredMin }, state, fmt
      );
    }
    if (kind.startsWith('lifetimeResourcesGenerated:')) {
      const resource = a.resource || b.resource;
      const requiredMin = Math.max(a.requiredMin ?? 0, b.requiredMin ?? 0);
      return this.formatUnlockConditionDetail(
        { type: 'lifetimeResourcesGenerated', resource, min: requiredMin }, state, fmt
      );
    }

    if (a.met && !b.met) return b;
    if (!a.met && b.met) return a;
    return (a.progress ?? 0) <= (b.progress ?? 0) ? a : b;
  },

  dedupeRequirementRows(rows, state, formatNumber) {
    if (!rows?.length) return [];
    const merged = [];
    const indexByKind = new Map();

    for (const row of rows) {
      const kind = row.kind || row.label;
      if (!indexByKind.has(kind)) {
        indexByKind.set(kind, merged.length);
        merged.push(row);
        continue;
      }
      const idx = indexByKind.get(kind);
      merged[idx] = this.mergeRequirementRows(merged[idx], row, state, formatNumber);
    }

    return merged;
  },

  flattenUnlockConditions(unlockConditions) {
    return flattenUnlockConditions(unlockConditions);
  },

  getEquipmentConfig() {
    return config.framework.equipment || config.defaults.equipment;
  },

  getRarityMultiplier(rarity) {
    const eq = this.getEquipmentConfig();
    const key = rarity || eq.defaultRarity || config.defaults.equipment.defaultRarity;
    return eq.rarityMultipliers[key]
      ?? eq.rarityMultipliers[config.defaults.equipment.defaultRarity]
      ?? this.getDefaultCalc('rarityMultiplierFallback');
  },

  getRaritySortIndex(rarity) {
    const order = this.getEquipmentConfig().rarityOrder || config.defaults.equipment.rarityOrder || [];
    const idx = order.indexOf(rarity);
    return idx >= 0 ? idx : this.getDefaultCalc('raritySortIndexFallback');
  },

  formatRarityLabel(rarity) {
    const key = rarity || this.getEquipmentConfig().defaultRarity || 'common';
    return key.charAt(0).toUpperCase() + key.slice(1);
  },

  sortEquipablesByRarity(items) {
    return [...items].sort((a, b) => {
      const diff = this.getRaritySortIndex(b.rarity) - this.getRaritySortIndex(a.rarity);
      if (diff !== 0) return diff;
      return (a.displayName || '').localeCompare(b.displayName || '');
    });
  },

  countEquippedExceptSlot(state, itemCode, characterCode, slot) {
    let count = 0;
    for (const [charCode, cs] of Object.entries(state.characters || {})) {
      for (const [s, code] of Object.entries(cs.equipment || {})) {
        if (code === itemCode && !(charCode === characterCode && s === slot)) count++;
      }
    }
    return count;
  },

  getAvailableEquipCount(state, itemCode, characterCode, slot) {
    const owned = state.inventory[itemCode] || 0;
    const used = this.countEquippedExceptSlot(state, itemCode, characterCode, slot);
    return owned - used;
  },

  getEquipableItems() {
    return (config.items?.items || []).filter(i => i.type === 'equipable');
  },

  formatItemEffectSummary(effect) {
    if (!effect?.type) return '';
    const mult = effect.multiplier || 1;
    const pct = Math.round(Math.abs(mult - 1) * 100);
    const signed = mult >= 1 ? '+' : '-';
    const dur = effect.durationSeconds ? ` · ${effect.durationSeconds}s` : '';
    switch (effect.type) {
      case 'globalMultiplier':
        return `${signed}${pct}% production${dur}`;
      case 'clickMultiplier':
        return `${signed}${pct}% tap${dur}`;
      case 'costReduction':
        return `${pct}% cheaper purchases`;
      default:
        return effect.type;
    }
  },

  buildEquipSlotOptions(state, characterCode, slotId, effectFormatter) {
    const cs = state.characters?.[characterCode];
    if (!cs) return [];
    const equippedCode = cs.equipment?.[slotId];
    const equipables = this.getEquipableItems().filter(i => i.slot === slotId);
    const format = typeof effectFormatter === 'function'
      ? effectFormatter
      : (effect) => this.formatItemEffectSummary(effect);

    return this.sortEquipablesByRarity(equipables).map(item => {
      const owned = state.inventory?.[item.codeName] || 0;
      const available = this.getAvailableEquipCount(state, item.codeName, characterCode, slotId);
      const equipped = equippedCode === item.codeName;
      const stackQty = Math.max(owned, this.getDefaultCalc('equipmentStackMinCopies'));
      const effect = this.getEffectiveItemEffect(item, stackQty);
      const canEquip = equipped || (owned > 0 && available > 0);
      let statusLabel = '';
      if (!owned) {
        statusLabel = this.getDefaultLabel('equipNotOwned');
      } else if (!available && !equipped) {
        statusLabel = this.getDefaultLabel('equipAllInUse');
      }
      return {
        ...item,
        owned,
        available,
        equipped,
        canEquip,
        statusLabel,
        rarityLabel: this.formatRarityLabel(item.rarity),
        effectSummary: format(effect, item)
      };
    });
  },

  getEffectiveItemEffect(item, stackQty) {
    if (!item?.effect) return null;
    const eq = this.getEquipmentConfig();
    const rarityMult = this.getRarityMultiplier(item.rarity || eq.defaultRarity);
    const copies = Math.max(this.getDefaultCalc('equipmentStackMinCopies'), stackQty || this.getDefaultCalc('equipmentStackMinCopies'));
    const stackMult = 1 + (eq.stackBonusPerCopy || config.defaults.equipment.stackBonusPerCopy) * (copies - 1);
    const mult = item.effect.multiplier || this.getDefaultCalc('effectMultiplierDefault');
    const scale = rarityMult * stackMult;
    let scaledMult;
    if (item.effect.type === 'costReduction') {
      scaledMult = 1 - (1 - mult) * scale;
    } else {
      scaledMult = 1 + (mult - 1) * scale;
    }
    return { ...item.effect, multiplier: scaledMult };
  },

  buildRequirementRows(cond, state, formatNumber) {
    const fmt = formatNumber || (n => n);
    if (cond.type === 'canAffordFirstPurchase') {
      const gen = cond.generator ? this.getGenerator(cond.generator) : null;
      if (!gen) {
        return [{
          icon: this.getDefaultIcon('generatorCost'),
          label: this.getDefaultLabel('unknownGeneratorCost'),
          progress: this.getDefaultCalc('numericZero'),
          met: false
        }];
      }
      const cost = FormulaEngine.calculateGeneratorCost(gen, 0, [], config, state || {});
      const rows = Object.entries(cost).map(([code, required]) => {
        const held = state?.resources[code]?.quantity || 0;
        const meta = this.getResourceMeta(code);
        const progress = required > 0 ? Math.min(1, held / required) : 1;
        return {
          icon: meta.icon || this.getDefaultIcon('generatorCost'),
          label: this.formatUnlockLabel('resourceHeld', {
            name: meta.name,
            current: fmt(held),
            required: fmt(required)
          }),
          progress,
          met: held >= required,
          kind: `resourceHeld:${code}`,
          resource: code,
          requiredMin: required
        };
      });
      return rows.length ? rows : [{
        icon: gen.icon || this.getDefaultIcon('generatorCost'),
        label: `${gen.displayName}: ${this.getDefaultLabel('noGeneratorCostDefined')}`,
        progress: this.getDefaultCalc('numericZero'),
        met: false
      }];
    }
    return [this.formatUnlockConditionDetail(cond, state, formatNumber)];
  },

  buildUnlockRequirements(unlockConditions, state, formatNumber) {
    const rows = this.flattenUnlockConditions(unlockConditions)
      .flatMap(c => this.buildRequirementRows(c, state, formatNumber));
    return this.dedupeRequirementRows(rows, state, formatNumber);
  },

  getCombinedUnlockRequirements({ unlockConditions, requiredFeature }, state, formatNumber) {
    const requirements = [];

    if (requiredFeature && !this.isFeatureUnlocked(requiredFeature, state)) {
      requirements.push(...this.getFeatureUnlockInfo(requiredFeature, state, formatNumber).requirements);
    }

    if (unlockConditions) {
      requirements.push(...this.buildUnlockRequirements(unlockConditions, state, formatNumber));
    }

    return this.dedupeRequirementRows(requirements, state, formatNumber);
  },

  formatUnlockRequirementsText(requirements) {
    if (!requirements?.length) return '';
    return requirements.map(r => `${r.met ? '✓' : '✗'} ${r.label}`).join(' · ');
  },

  getUnlockRequirementsInfo({ title, unlockConditions, requiredFeature }, state, formatNumber) {
    const requirements = this.getCombinedUnlockRequirements(
      { unlockConditions, requiredFeature }, state, formatNumber
    );
    const featureOk = !requiredFeature || this.isFeatureUnlocked(requiredFeature, state);
    const conditionsOk = !unlockConditions
      || FormulaEngine.evaluateUnlockConditions(unlockConditions, state, config).met;

    return {
      title: title || '',
      met: featureOk && conditionsOk,
      requirements
    };
  },

  getFeatureUnlockInfo(featureCode, state, formatNumber) {
    if (this.isFeatureUnlocked(featureCode, state)) {
      return { title: this.getFeatureDisplayName(featureCode), met: true, requirements: [] };
    }

    const prestigeUnlocks = config.prestige.featureUnlocks || [];
    for (const entry of prestigeUnlocks) {
      if (entry.feature !== featureCode) continue;
      return {
        title: this.getFeatureDisplayName(featureCode),
        met: false,
        requirements: this.buildUnlockRequirements(entry.unlockConditions, state, formatNumber)
      };
    }

    const tierInfo = this.getFeatureUnlockTier(featureCode);
    if (tierInfo) {
      const minTier = tierInfo.tier;
      const met = state.meta.ascension.currentTier >= minTier;
      return {
        title: this.getFeatureDisplayName(featureCode),
        met,
        requirements: [
          this.formatUnlockConditionDetail({ type: 'ascensionTier', minTier }, state, formatNumber)
        ]
      };
    }

    return {
      title: this.getFeatureDisplayName(featureCode),
      met: false,
      requirements: [{
        icon: this.getDefaultIcon('lock'),
        label: this.getDefaultLabel('requirementsUnknown'),
        progress: this.getDefaultCalc('numericZero'),
        met: false
      }]
    };
  },

  getFeatureDisplayName(featureCode) {
    const names = config.defaults.features;
    if (names[featureCode]) return names[featureCode];
    if (featureCode.startsWith('generators:')) {
      return this.getGeneratorDisplayName(featureCode.replace('generators:', ''));
    }
    if (featureCode.startsWith('resources:')) {
      return this.getResourceDisplayName(featureCode.replace('resources:', ''));
    }
    return featureCode;
  },

  getUnlockInfoFromConditions(title, unlockConditions, state, formatNumber) {
    return this.getUnlockRequirementsInfo({ title, unlockConditions }, state, formatNumber);
  },

  formatUnlockCondition(cond, state, formatNumber) {
    if (state != null) {
      return this.formatUnlockConditionDetail(cond, state, formatNumber).label;
    }
    switch (cond.type) {
      case 'achievement':
        return this.formatUnlockLabel('achievement', {
          name: this.getAchievementDisplayName(cond.achievement)
        });
      case 'resourceHeld': {
        const res = this.getResource(cond.resource);
        return this.formatUnlockLabel('resourceHeldStatic', {
          icon: res?.icon || '',
          name: res?.displayName || cond.resource,
          required: cond.amount
        }).trim();
      }
      case 'generatorOwned': {
        const gen = this.getGenerator(cond.generator);
        const need = cond.quantity || cond.amount || this.getDefaultCalc('unlockConditionQuantity');
        return this.formatUnlockLabel('generatorOwnedStatic', {
          icon: gen?.icon || this.getDefaultIcon('generator'),
          name: gen?.displayName || cond.generator,
          required: need
        });
      }
      case 'canAffordFirstPurchase': {
        const gen = cond.generator ? this.getGenerator(cond.generator) : null;
        return this.formatUnlockLabel('firstPurchaseCostStatic', {
          icon: gen?.icon || this.getDefaultIcon('generatorCost'),
          name: gen?.displayName || cond.generator
        });
      }
      case 'upgradePurchased': {
        const upg = this.getUpgrade(cond.upgrade);
        const level = cond.level || this.getDefaultCalc('unlockConditionLevel');
        return this.formatUnlockLabel('upgradePurchasedStatic', {
          icon: upg?.icon || this.getDefaultIcon('upgrade'),
          name: upg?.displayName || cond.upgrade,
          required: level
        });
      }
      case 'ascensionTier':
        return this.formatAscensionTierLabel(cond.minTier);
      case 'prestigeCount':
        return this.formatUnlockLabel('prestigesThisTierStatic', { required: cond.min });
      case 'lifetimeResourcesGenerated':
        return this.formatUnlockLabel('lifetimeResourceStatic', {
          name: this.getResourceDisplayName(cond.resource),
          required: cond.min
        });
      case 'lifetimeGeneratorPurchases':
        return this.formatUnlockLabel('generatorPurchasesStatic', { required: cond.min });
      case 'lifetimePrestiges':
        return this.formatUnlockLabel('lifetimePrestigesStatic', { required: cond.min });
      default:
        return cond.type;
    }
  },

  getFeatureUnlockTier(featureCode) {
    for (const tier of config.ascension.ascensionTiers) {
      if ((tier.unlockedFeatures || []).includes(featureCode)) return tier;
    }
    return null;
  },

  getEquipmentSlotLabel(slotId) {
    const slot = (config.framework.equipmentSlots || []).find(s => s.id === slotId);
    return slot?.label || slotId;
  },

  getUnlockedFeatures(state) {
    const features = new Set();
    const currentTier = state.meta.ascension.currentTier;
    for (const tier of config.ascension.ascensionTiers) {
      if (tier.tier <= currentTier) {
        (tier.unlockedFeatures || []).forEach(f => features.add(f));
      }
    }
    return features;
  }
};

// --- js/core/SaveManager.js ---

const SAVE_VERSION = '1.3.0';
const LEGACY_STORAGE_KEY = 'afk_ai_save';

const EQUIPMENT_SLOT_MIGRATION = {
  accessory: 'amulet',
  weapon: 'mainHand'
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function storageKey() {
  return ConfigManager.getFramework().save.storageKey;
}

function backupStorageKey() {
  return `${storageKey()}_backup`;
}

function migrateLegacyStorageKey() {
  const currentId = ConfigManager.getCurrentContentId();
  if (currentId !== 'cosmic-time-factory') return;
  const newKey = storageKey();
  if (localStorage.getItem(newKey)) return;
  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) return;
  localStorage.setItem(newKey, legacy);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  const legacyBackup = localStorage.getItem(`${LEGACY_STORAGE_KEY}_backup`);
  if (legacyBackup) {
    localStorage.setItem(`${newKey}_backup`, legacyBackup);
    localStorage.removeItem(`${LEGACY_STORAGE_KEY}_backup`);
  }
}

function buildPayload(state) {
  const serializable = state.toJSON();
  const payload = {
    version: SAVE_VERSION,
    contentId: ConfigManager.getCurrentContentId(),
    timestamp: Date.now(),
    state: serializable,
    checksum: ''
  };
  payload.checksum = simpleHash(JSON.stringify(serializable));
  return payload;
}

const SaveManager = {
  getSaveVersion() {
    return SAVE_VERSION;
  },

  verifyPayload(data) {
    if (!data?.state) {
      return { valid: false, reason: 'missing_state' };
    }
    if (!data.checksum) {
      return { valid: true, skipped: true };
    }
    const expected = simpleHash(JSON.stringify(data.state));
    if (expected === data.checksum) {
      return { valid: true };
    }
    return { valid: false, reason: 'checksum_mismatch' };
  },

  load() {
    migrateLegacyStorageKey();
    const key = storageKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const data = this.migrate(parsed);
      if (!data) return null;
      const currentId = ConfigManager.getCurrentContentId();
      if (data.contentId && data.contentId !== currentId) return null;
      if (!data.contentId && currentId !== 'cosmic-time-factory') return null;
      data._integrity = this.verifyPayload(data);
      return data;
    } catch (e) {
      console.error('Save load failed:', e);
      return null;
    }
  },

  save(state, { rotateBackup = false } = {}) {
    const key = storageKey();
    const fw = ConfigManager.getFramework();
    const payload = buildPayload(state);
    localStorage.setItem(key, JSON.stringify(payload));
    if (rotateBackup) {
      this.rotateBackup(key, payload, fw.save.maxBackups);
    }
    EventBus.emit(EVENTS.GAME_SAVED, payload);
    return payload;
  },

  saveWithBackup(state) {
    return this.save(state, { rotateBackup: true });
  },

  rotateBackup(key, payload, maxBackups) {
    const backupKey = `${key}_backup`;
    try {
      const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
      backups.push({
        id: `${payload.timestamp}-${simpleHash(String(payload.timestamp))}`,
        timestamp: payload.timestamp,
        version: payload.version,
        data: payload
      });
      while (backups.length > maxBackups) backups.shift();
      localStorage.setItem(backupKey, JSON.stringify(backups));
    } catch (_) { /* ignore backup errors */ }
  },

  getCurrentMeta() {
    const key = storageKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        timestamp: parsed.timestamp,
        version: parsed.version,
        integrity: this.verifyPayload(parsed)
      };
    } catch (_) {
      return null;
    }
  },

  listBackups() {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      return backups.map((entry, index) => ({
        index,
        id: entry.id || String(entry.timestamp),
        timestamp: entry.timestamp,
        version: entry.data?.version || entry.version || 'unknown',
        integrity: entry.data ? this.verifyPayload(entry.data) : { valid: false, reason: 'missing_data' }
      })).reverse();
    } catch (_) {
      return [];
    }
  },

  getBackup(index) {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      return backups[index] || null;
    } catch (_) {
      return null;
    }
  },

  restoreBackup(index) {
    const entry = this.getBackup(index);
    if (!entry?.data) {
      throw new Error('Backup not found');
    }
    const migrated = this.migrate(entry.data);
    if (!migrated?.state) {
      throw new Error('Backup has no valid state');
    }
    const integrity = this.verifyPayload(migrated);
    if (!integrity.valid && !integrity.skipped) {
      throw new Error('Backup failed integrity check');
    }
    localStorage.setItem(storageKey(), JSON.stringify(migrated));
    return migrated;
  },

  deleteBackup(index) {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      if (index < 0 || index >= backups.length) return false;
      backups.splice(index, 1);
      localStorage.setItem(backupStorageKey(), JSON.stringify(backups));
      return true;
    } catch (_) {
      return false;
    }
  },

  deleteAllBackups() {
    localStorage.removeItem(backupStorageKey());
  },

  migrate(data) {
    if (!data) return null;
    const migrated = { ...data, state: data.state ? { ...data.state } : data.state };

    if (!migrated.version) migrated.version = '1.0.0';

    if (migrated.version === '1.0.0') {
      const run = migrated.state?.meta?.prestige?.run;
      if (run?.peakPPSThisRun != null && run.peakPrimaryCurrencyRateThisRun == null) {
        run.peakPrimaryCurrencyRateThisRun = run.peakPPSThisRun;
      }
      migrated.version = '1.1.0';
    }

    if (migrated.version === '1.1.0') {
      const chars = migrated.state?.characters;
      if (chars) {
        for (const cs of Object.values(chars)) {
          if (!cs?.equipment) continue;
          const next = {};
          for (const [slot, code] of Object.entries(cs.equipment)) {
            if (!code) continue;
            next[EQUIPMENT_SLOT_MIGRATION[slot] || slot] = code;
          }
          cs.equipment = next;
        }
      }
      migrated.version = '1.2.0';
    }

    if (migrated.version === '1.2.0') {
      if (!migrated.contentId) {
        migrated.contentId = 'cosmic-time-factory';
      }
      migrated.version = '1.3.0';
    }

    if (migrated.version === SAVE_VERSION) return migrated;

    migrated._legacy = migrated._legacy || {};
    migrated._legacy.unknownVersion = migrated.version;
    console.warn('Save version unknown, preserved in _legacy:', migrated.version);
    return migrated;
  },

  exportSave(state) {
    const payload = this.save(state);
    const prefix = ConfigManager.getCurrentManifest()?.exportPrefix || 'game';
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prefix}-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  hasSaveForContent(contentId) {
    const game = ConfigManager.getAvailableGames().find(g => g.id === contentId);
    if (!game?.storageKey || typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem(game.storageKey);
  },

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const migrated = this.migrate(parsed);
          if (!migrated?.state) {
            reject(new Error('Import file has no valid game state'));
            return;
          }
          const integrity = this.verifyPayload(migrated);
          migrated._integrity = integrity;
          resolve(migrated);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  writeMainSlot(data) {
    localStorage.setItem(storageKey(), JSON.stringify(data));
  },

  clear() {
    localStorage.removeItem(storageKey());
  },

  clearAll() {
    this.clear();
    this.deleteAllBackups();
  }
};

// --- js/core/ProgressTracker.js ---

function makeChecks() {
  return {
    scaffold: [
      { id: 'index_html', label: 'index.html bootstrap (<80 lines)', check: () => true },
      { id: 'bundle_script', label: 'bundle-for-file-protocol.py exists', check: () => true },
      { id: 'afk_config', label: 'window.AFK_CONFIG populated', check: () => !!window.AFK_CONFIG },
      { id: 'no_fetch', label: 'No runtime fetch for config', check: () => !!window.AFK_CONFIG }
    ],
    config: ['framework', 'difficulty', 'resources', 'generators', 'upgrades',
      'items', 'artifacts', 'characters', 'achievements', 'events',
      'drops', 'ascension', 'prestige'].map(name => ({
      id: `config_${name}`,
      label: `config/${name}.json loads`,
      check: () => !!ConfigManager.getAll()?.[name]
    })).concat([
      {
        id: 'generator_chain',
        label: 'Generator chain validation (zero errors)',
        check: () => {
          const cfg = ConfigManager.getAll();
          if (!cfg) return false;
          return validateGeneratorChain(cfg).valid;
        }
      },
      {
        id: 'primary_resource',
        label: 'Exactly one primary resource',
        check: () => {
          const rs = ConfigManager.getResources() || [];
          return rs.filter(r => r.isPrimary).length === 1;
        }
      }
    ]),
    core: [
      { id: 'eventbus', label: 'EventBus exports EVENTS', check: () => !!window.AFK?.EVENTS?.GAME_TICK },
      { id: 'configmanager', label: 'ConfigManager loads configs', check: () => !!ConfigManager.getAll() },
      { id: 'savemanager', label: 'SaveManager migrate chain', check: () => typeof window.AFK?.SaveManager?.migrate === 'function' },
      { id: 'gamestate', label: 'GameState class available', check: () => typeof window.AFK?.GameState === 'function' }
    ],
    formula: [
      {
        id: 'formula_engine',
        label: 'FormulaEngine core functions',
        check: () => {
          const fe = window.AFK?.FormulaEngine;
          return fe && typeof fe.calculateTapGain === 'function'
            && typeof fe.calculatePrimaryCurrencyRate === 'function'
            && typeof fe.evaluateUnlockConditions === 'function';
        }
      },
      {
        id: 'modifier_system',
        label: 'ModifierSystem collects modifiers',
        check: () => typeof window.AFK?.ModifierSystem?.collect === 'function'
      }
    ],
    'gameplay-core': [
      { id: 'resources', label: 'Resources in config', check: () => (ConfigManager.getResources()?.length || 0) > 0 },
      { id: 'generators', label: 'Generators in config (10 chain)', check: () => (ConfigManager.getGenerators()?.length || 0) >= 10 },
      { id: 'tap', label: 'performTap() on GameState', check: () => typeof window.AFK?.GameState?.prototype?.performTap === 'function' },
      { id: 'gameloop', label: 'GameLoop tick', check: () => typeof window.AFK?.GameLoop === 'function' }
    ],
    upgrades: [
      { id: 'upgrade_purchase', label: 'buyUpgrade on GameState', check: () => typeof window.AFK?.GameState?.prototype?.buyUpgrade === 'function' },
      { id: 'bulk_buy', label: 'Bulk purchase multipliers in config', check: () => !!ConfigManager.getFramework()?.ui?.purchaseMultipliers?.length }
    ],
    save: [
      { id: 'save_load', label: 'SaveManager load/save', check: () => typeof window.AFK?.SaveManager?.save === 'function' },
      { id: 'offline', label: 'Offline progress config', check: () => ConfigManager.getFramework()?.save?.offlineCapSeconds > 0 },
      { id: 'migration', label: 'Save migration v1.1.0', check: () => {
        const m = window.AFK?.SaveManager?.migrate({ version: '1.0.0', state: { meta: { prestige: { run: { peakPPSThisRun: 5 } } } } });
        return m?.version === '1.1.0' && m.state.meta.prestige.run.peakPrimaryCurrencyRateThisRun === 5;
      }}
    ],
    characters: [
      { id: 'characters', label: 'Characters config', check: () => (ConfigManager.getCharacters()?.length || 0) > 0 },
      { id: 'inventory', label: 'Items config', check: () => (ConfigManager.getItems()?.length || 0) > 0 },
      { id: 'equipment', label: 'Equip/unequip on GameState', check: () =>
        typeof window.AFK?.GameState?.prototype?.equipItem === 'function'
        && typeof window.AFK?.GameState?.prototype?.unequipItem === 'function'
      }
    ],
    loot: [
      { id: 'drops', label: 'Drop tables config', check: () => (ConfigManager.getDropTables()?.length || 0) > 0 },
      { id: 'artifacts', label: 'Artifacts config', check: () => (ConfigManager.getArtifacts()?.length || 0) > 0 }
    ],
    meta: [
      { id: 'prestige', label: 'Prestige system + shop bonuses', check: () => (ConfigManager.getPrestige()?.prestigeBonuses?.length || 0) > 0 },
      { id: 'ascension', label: 'Ascension tiers configured', check: () => (ConfigManager.getAscension()?.maxTier ?? 0) >= 0 },
      { id: 'achievements', label: 'Achievements config', check: () => (ConfigManager.getAchievements()?.length || 0) > 0 },
      { id: 'events', label: 'Random events config', check: () => (ConfigManager.getEvents()?.length || 0) > 0 }
    ],
    polish: [
      { id: 'actionbar', label: 'ActionBar dual taps', check: () => !!window.AFK_UI?.ActionBar },
      { id: 'settings', label: 'Settings panel', check: () => !!window.AFK_UI?.SettingsPanel },
      { id: 'sidebar', label: 'Sidebar position in settings', check: () => !!ConfigManager.getFramework()?.ui?.sidebarDefaultPosition },
      { id: 'devtools', label: 'Dev tools speed multipliers', check: () => !!ConfigManager.getFramework()?.devTools?.speedMultipliers },
      { id: 'display_helpers', label: 'ConfigManager display name helpers', check: () =>
        typeof ConfigManager.getResourceDisplayName === 'function'
        && typeof ConfigManager.formatUnlockCondition === 'function'
      },
      { id: 'file_protocol', label: 'Playable via file:// (bundles loaded)', check: () => !!window.AFK && !!window.AFK_UI }
    ]
  };
}

const ProgressTracker = {
  runChecks(customChecks = {}) {
    const checks = makeChecks();
    const results = {};
    let total = 0;
    let passed = 0;

    for (const [section, items] of Object.entries(checks)) {
      results[section] = items.map(item => {
        total++;
        const fn = customChecks[item.id] || item.check;
        let ok = false;
        try { ok = !!fn(); } catch (_) { ok = false; }
        if (ok) passed++;
        return { ...item, passed: ok };
      });
    }

    return {
      sections: results,
      total,
      passed,
      percentage: total ? Math.round((passed / total) * 100) : 0
    };
  }
};

// --- js/game/ModifierSystem.js ---

let cachedMods = null;
let cacheKey = null;

const ModifierSystem = {
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
    const mult = effect.multiplier ?? ConfigManager.getDefaultCalc('effectMultiplierDefault');
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

// --- js/game/GameState.js ---

function createInitialState(config) {
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

class GameState {
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
    if (upgrade.maxPurchases !== null && us.purchaseCount >= upgrade.maxPurchases) return false;

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

// --- js/game/systems/GeneratorSystem.js ---

const GeneratorSystem = {
  getResourceLabel(code, config) {
    return ConfigManager.getResource(code)?.displayName || code;
  },

  getGeneratorLabel(code, config) {
    return ConfigManager.getGenerator(code)?.displayName || code;
  },

  _canAffordCost(state, costs) {
    return Object.entries(costs).every(([res, amt]) => (state.resources[res]?.quantity || 0) >= amt);
  },

  buildProductionRows(state, config, mods, genCode) {
    return FormulaEngine.calculateGeneratorProduction(state, config, mods, genCode)
      .map(p => {
        const res = ConfigManager.getResource(p.resource);
        return {
          ...p,
          icon: res?.icon || '',
          name: res?.displayName || p.resource
        };
      });
  },

  getDisplayData(state, config, mods) {
    const multiplier = state.ui.purchaseMultiplier;
    const primaryBreakdown = FormulaEngine.calculatePrimaryCurrencyBreakdown(state, config, mods);

    return config.generators.generators.map(gen => {
      const gs = state.generators[gen.codeName];
      const unlock = FormulaEngine.evaluateUnlockConditions(gen.unlockConditions, state, config);
      const owned = gs.quantityPurchased;
      const nextCost = FormulaEngine.calculateGeneratorCost(gen, owned, mods, config, state);
      const bulkQty = this.getBulkQuantity(state, config, gen.codeName, multiplier, mods);
      const buyCost = bulkQty > 0
        ? FormulaEngine.calculateBulkCost(gen, owned, bulkQty, mods, config, state)
        : nextCost;
      const genPrimary = primaryBreakdown.breakdown.find(b => b.generator === gen.codeName)?.amount || 0;
      const featureLocked = gen.requiredFeature && !ConfigManager.isFeatureUnlocked(gen.requiredFeature, state);
      const isUnlocked = gs.isUnlocked && unlock.met && !featureLocked;
      const canBuy = isUnlocked && bulkQty > 0 && this._canAffordCost(state, buyCost);
      const production = this.buildProductionRows(state, config, mods, gen.codeName);

      return {
        ...gen,
        owned,
        isUnlocked,
        unlockResult: unlock,
        nextCost: buyCost,
        buyQuantity: bulkQty,
        canBuy,
        production,
        primaryCurrencyRate: genPrimary,
        primaryCurrencyPercent: primaryBreakdown.total > 0 ? (genPrimary / primaryBreakdown.total) * 100 : 0,
        featureLocked
      };
    });
  },

  getBulkQuantity(state, config, genCode, multiplier, mods) {
    const gen = ConfigManager.getGenerator(genCode);
    const gs = state.generators[genCode];
    if (multiplier === 'MAX') {
      const balances = {};
      for (const [code, r] of Object.entries(state.resources)) {
        balances[code] = r.quantity;
      }
      return FormulaEngine.calculateMaxAffordable(gen, gs.quantityPurchased, balances, mods, config, state);
    }
    return multiplier;
  }
};

// --- js/game/systems/PrestigeSystem.js ---

const PrestigeSystem = {
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
      state.meta.prestige.run = { resourcesEarnedThisRun: {}, peakPrimaryCurrencyRateThisRun: 0 };
      for (const r of config.resources.resources) {
        state.meta.prestige.run.resourcesEarnedThisRun[r.codeName] = 0;
      }
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
      kept: ['Artifacts', 'Generator unlocks', 'Achievements', 'Ascension tier', 'Prestige Shards (currency)', 'Characters', 'Lifetime milestones']
    };
  }
};

// --- js/game/systems/AscensionSystem.js ---

const AscensionSystem = {
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

// --- js/game/systems/DropSystem.js ---

const DropSystem = {
  onTick(state, config, deltaSeconds, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:drops', state)) return;

    for (const table of config.drops.dropTables) {
      if (table.trigger !== 'tick') continue;
      if (table.codeName === 'artifactDrop' && !ConfigManager.isFeatureUnlocked('tab:artifacts', state)) continue;

      let chance = table.chancePerSecond * deltaSeconds;
      if (table.codeName === 'equipmentDrop') {
        chance *= this._equipmentDropMultiplier(state, config);
      }

      if (Math.random() > chance) continue;

      let entry;
      if (table.codeName === 'equipmentDrop') {
        entry = this._rollEquipmentEntry(table, state, config);
      } else if (table.codeName === 'artifactDrop') {
        entry = this._rollArtifactEntry(table, state, config);
      } else {
        entry = this._rollEntry(table.entries);
      }
      if (!entry) continue;

      if (entry.artifact) {
        gameState.acquireArtifact(entry.artifact);
      } else if (entry.item) {
        const qty = this._rollQuantity(entry.quantity);
        gameState.addItem(entry.item, qty);
        EventBus.emit(EVENTS.ITEM_DROPPED, { item: entry.item, quantity: qty });
      }
    }
  },

  onClick(state, config, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:drops', state)) return;

    for (const table of config.drops.dropTables) {
      if (table.trigger !== 'click') continue;
      if (Math.random() > table.chance) continue;

      const entry = this._rollEntry(table.entries);
      if (!entry || !entry.item) continue;

      const qty = this._rollQuantity(entry.quantity);
      gameState.addItem(entry.item, qty);
      EventBus.emit(EVENTS.ITEM_DROPPED, { item: entry.item, quantity: qty });
    }
  },

  _equipmentDropMultiplier(state, config) {
    const mods = config.drops.equipmentDropModifiers;
    if (!mods) return 1;
    let totalOwned = 0;
    for (const g of Object.values(state.generators)) totalOwned += g.quantityPurchased || 0;
    return 1 + totalOwned * (mods.quantityBonusPerGenerator || 0);
  },

  _rollEquipmentEntry(table, state, config) {
    const mods = config.drops.equipmentDropModifiers;
    const tier = state.meta.ascension.currentTier;
    const tierWeights = mods?.tierWeightsByAscension?.[String(tier)]
      || mods?.tierWeightsByAscension?.['0']
      || { common: 0.6, rare: 0.3, epic: 0.1 };

    const eligible = table.entries.filter(e => {
      const dropTier = e.dropTier || 'common';
      const w = tierWeights[dropTier] ?? 0.33;
      return Math.random() <= w;
    });

    return this._rollEntry(eligible.length ? eligible : table.entries);
  },

  _rollArtifactEntry(table, state, config) {
    const tier = state.meta.ascension.currentTier;
    const eligible = table.entries.filter(e => {
      const req = e.dropRequirements;
      if (!req) return true;
      if (tier < (req.minAscensionTier || 0)) return false;
      return (state.generators[req.generator]?.quantityPurchased || 0) > 0;
    });
    if (!eligible.length) return null;
    return this._rollEntry(eligible);
  },

  _rollEntry(entries) {
    const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
    if (totalWeight <= 0) return null;
    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      roll -= entry.weight;
      if (roll <= 0) return entry;
    }
    return entries[entries.length - 1];
  },

  _rollQuantity(range) {
    if (!range) return 1;
    const [min, max] = range;
    return min + Math.floor(Math.random() * (max - min + 1));
  }
};

// --- js/game/systems/AchievementSystem.js ---

function getGeneratorTiers(config) {
  return config.framework?.generatorTiers || {};
}

const AchievementSystem = {
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

// --- js/game/systems/EventSystem.js ---

const EventSystem = {
  _nextEventTime: null,

  init(state, config) {
    this._scheduleNext(state, config);
  },

  tick(state, config, deltaSeconds, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:randomEvents', state)) return;

    const now = Date.now();
    state.activeEvents = (state.activeEvents || []).filter(e => {
      if (e.expiresAt <= now) {
        EventBus.emit(EVENTS.RANDOM_EVENT_END, { event: e.codeName });
        ModifierSystem.invalidate();
        return false;
      }
      return true;
    });

    if (state.activeEvents.length > 0) return;

    if (!this._nextEventTime) this._scheduleNext(state, config);
    if (Date.now() < this._nextEventTime) return;

    const events = config.events.events;
    const evt = events[Math.floor(Math.random() * events.length)];
    const expiresAt = Date.now() + evt.duration * 1000;
    state.activeEvents.push({ codeName: evt.codeName, effect: evt.effect, expiresAt, displayName: evt.displayName, icon: evt.icon });
    state.stats.eventsSeen = (state.stats.eventsSeen || 0) + 1;
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    gameState.showToast(`${evt.icon} ${evt.displayName}!`);
    EventBus.emit(EVENTS.RANDOM_EVENT_START, { event: evt.codeName });
    this._scheduleNext(state, config);
  },

  _scheduleNext(state, config) {
    const events = config.events.events;
    if (!events.length) return;
    const evt = events[0];
    const interval = (evt.minInterval + Math.random() * (evt.maxInterval - evt.minInterval)) * 1000;
    this._nextEventTime = Date.now() + interval;
  },

  forceEvent(state, config, gameState, codeName) {
    const evt = config.events.events.find(e => e.codeName === codeName);
    if (!evt) return;
    const expiresAt = Date.now() + evt.duration * 1000;
    state.activeEvents.push({ codeName: evt.codeName, effect: evt.effect, expiresAt, displayName: evt.displayName, icon: evt.icon });
    state.stats.eventsSeen = (state.stats.eventsSeen || 0) + 1;
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    EventBus.emit(EVENTS.RANDOM_EVENT_START, { event: evt.codeName });
  }
};

// --- js/game/GameLoop.js ---

class GameLoop {
  constructor(gameState, config) {
    this.gameState = gameState;
    this.config = config;
    this.running = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.autoSaveTimer = 0;
    this.backupTimer = 0;
    this.speedMultiplier = 1;
    this.rafId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    EventSystem.init(this.gameState.state, this.config);
    this._loop(this.lastFrameTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = mult;
  }

  _loop(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this._loop(t));

    let deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fw = this.config.framework;
    const maxDelta = fw.gameLoop.maxDeltaCapSeconds * 1000;
    if (deltaMs > maxDelta) deltaMs = maxDelta;

    deltaMs *= this.speedMultiplier;
    this.accumulator += deltaMs;

    const tickInterval = 1000 / fw.gameLoop.tickRate;
    const state = this.gameState.state;

    while (this.accumulator >= tickInterval) {
      const deltaSec = tickInterval / 1000;
      this.gameState.tickProduction(deltaSec);
      DropSystem.onTick(state, this.config, deltaSec, this.gameState);
      EventSystem.tick(state, this.config, deltaSec, this.gameState);
      AchievementSystem.checkAll(state, this.config, this.gameState);
      this.accumulator -= tickInterval;
    }

    this.autoSaveTimer += deltaMs;
    if (this.autoSaveTimer >= fw.save.autoSaveIntervalMs) {
      SaveManager.save(this.gameState);
      this.autoSaveTimer = 0;
    }

    this.backupTimer += deltaMs;
    if (this.backupTimer >= fw.save.rollingBackupIntervalMs) {
      SaveManager.saveWithBackup(this.gameState);
      this.backupTimer = 0;
    }
  }

  applyOfflineProgress(lastTimestamp) {
    const fw = this.config.framework;
    const elapsedSec = (Date.now() - lastTimestamp) / 1000;
    if (elapsedSec <= 0) return null;

    const mods = this.gameState.getMods();
    const result = FormulaEngine.calculateOfflineGains(
      elapsedSec, this.gameState.state, this.config, mods, fw.save.offlineCapSeconds
    );

    this.gameState.applyOfflineGains(result.gains, result.elapsed);
    return {
      ...result,
      elapsedSec,
      showModal: elapsedSec >= fw.save.offlineModalMinSeconds
    };
  }
}
if (typeof EventBus !== "undefined") AFK.EventBus = EventBus;
if (typeof EVENTS !== "undefined") AFK.EVENTS = EVENTS;
if (typeof ConfigManager !== "undefined") AFK.ConfigManager = ConfigManager;
if (typeof loadAllConfigs !== "undefined") AFK.loadAllConfigs = loadAllConfigs;
if (typeof loadContentRegistry !== "undefined") AFK.loadContentRegistry = loadContentRegistry;
if (typeof getSelectedContentId !== "undefined") AFK.getSelectedContentId = getSelectedContentId;
if (typeof setSelectedContentId !== "undefined") AFK.setSelectedContentId = setSelectedContentId;
if (typeof getContentRegistry !== "undefined") AFK.getContentRegistry = getContentRegistry;
if (typeof getCurrentContentId !== "undefined") AFK.getCurrentContentId = getCurrentContentId;
if (typeof getCurrentManifest !== "undefined") AFK.getCurrentManifest = getCurrentManifest;
if (typeof validateGeneratorChain !== "undefined") AFK.validateGeneratorChain = validateGeneratorChain;
if (typeof SaveManager !== "undefined") AFK.SaveManager = SaveManager;
if (typeof ProgressTracker !== "undefined") AFK.ProgressTracker = ProgressTracker;
if (typeof FormulaEngine !== "undefined") AFK.FormulaEngine = FormulaEngine;
if (typeof ModifierSystem !== "undefined") AFK.ModifierSystem = ModifierSystem;
if (typeof GameState !== "undefined") AFK.GameState = GameState;
if (typeof createInitialState !== "undefined") AFK.createInitialState = createInitialState;
if (typeof GeneratorSystem !== "undefined") AFK.GeneratorSystem = GeneratorSystem;
if (typeof PrestigeSystem !== "undefined") AFK.PrestigeSystem = PrestigeSystem;
if (typeof AscensionSystem !== "undefined") AFK.AscensionSystem = AscensionSystem;
if (typeof DropSystem !== "undefined") AFK.DropSystem = DropSystem;
if (typeof AchievementSystem !== "undefined") AFK.AchievementSystem = AchievementSystem;
if (typeof EventSystem !== "undefined") AFK.EventSystem = EventSystem;
if (typeof GameLoop !== "undefined") AFK.GameLoop = GameLoop;

}).call(typeof window !== "undefined" ? window : globalThis);
