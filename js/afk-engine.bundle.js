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
        primaryCurrencyMult *= profile.primaryCurrencyMultiplier ?? profile.ppsMultiplier ?? 1;
        offlineEff *= profile.offlineEfficiency;
      }
    }

    const prestigeCount = state.meta.ascension.tiers[tier]?.prestigeCount || 0;
    const pdc = diff.prestigeDifficultyPerCount;
    costMult *= (1 + pdc.costIncreasePerPrestige * prestigeCount);
    const primaryDecrease = pdc.primaryCurrencyDecreasePerPrestige ?? pdc.ppsDecreasePerPrestige ?? 0;
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

    multiplicative.sort((a, b) => (a.priority || 0) - (b.priority || 0));

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

  calculatePrestigeGain(state, config) {
    const prestige = config.prestige;
    const weights = prestige.prestigeCurrency.resourceWeights;
    let runValue = 0;

    for (const [res, weight] of Object.entries(weights)) {
      const earned = state.meta.prestige.run.resourcesEarnedThisRun[res] || 0;
      runValue += earned * weight;
    }

    const minimum = prestige.prestigeCurrency.minimumResourceValue;
    if (runValue < minimum) return 0;

    const logBase = prestige.prestigeCurrency.logBase;
    return Math.floor(Math.log(Math.max(runValue / minimum, 1)) / Math.log(logBase));
  },

  calculateUpgradeCost(upgrade, purchaseCount) {
    return Math.floor(upgrade.cost * Math.pow(upgrade.costScale || 1, purchaseCount));
  },

  evaluateUnlockConditions(unlockConditions, state, config) {
    if (!unlockConditions) return { met: true, unmet: [] };

    const conditions = unlockConditions.conditions || [unlockConditions];
    const operator = unlockConditions.operator || 'AND';
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
        return (state.generators[cond.generator]?.quantityPurchased || 0) >= (cond.quantity || cond.amount || 1);
      case 'resourceHeld':
        return (state.resources[cond.resource]?.quantity || 0) >= cond.amount;
      case 'upgradePurchased':
        return (state.upgrades[cond.upgrade]?.purchaseCount || 0) >= (cond.level || 1);
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
      case 'resourceHeld':
        return Math.min(1, (state.resources[cond.resource]?.quantity || 0) / cond.amount);
      case 'generatorOwned':
        return Math.min(1, (state.generators[cond.generator]?.quantityPurchased || 0) / (cond.quantity || 1));
      case 'prestigeCount': {
        const tier = state.meta.ascension.currentTier;
        return Math.min(1, (state.meta.ascension.tiers[tier]?.prestigeCount || 0) / cond.min);
      }
      case 'lifetimeResourcesGenerated':
        return Math.min(1, (state.meta.milestones.lifetimeResourcesGenerated[cond.resource] || 0) / cond.min);
      case 'lifetimeGeneratorPurchases':
        return Math.min(1, (state.meta.milestones.lifetimeGeneratorPurchases || 0) / cond.min);
      default:
        return 0;
    }
  }
};

// --- js/core/ConfigManager.js ---

let config = null;

const CONFIG_FILES = [
  'framework', 'difficulty', 'resources', 'generators', 'upgrades',
  'items', 'artifacts', 'characters', 'achievements', 'events',
  'drops', 'ascension', 'prestige'
];

async function loadAllConfigs() {
  if (window.AFK_CONFIG) {
    config = window.AFK_CONFIG;
    validateConfig();
    return config;
  }
  const entries = await Promise.all(
    CONFIG_FILES.map(async name => {
      const res = await fetch(`config/${name}.json`);
      if (!res.ok) throw new Error(`Failed to load config/${name}.json`);
      return [name, await res.json()];
    })
  );
  config = Object.fromEntries(entries);
  validateConfig();
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

function validateConfig() {
  const resources = config.resources.resources;
  const primary = resources.filter(r => r.isPrimary);
  if (primary.length !== 1) throw new Error('Exactly one primary resource required');

  const chain = validateGeneratorChain(config);
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

  formatUnlockConditionDetail(cond, state, formatNumber) {
    const fmt = formatNumber || (n => n);
    const progress = state ? FormulaEngine.getConditionProgress(cond, state, config) : null;
    const met = state ? FormulaEngine.evaluateUnlockConditions(
      { operator: 'AND', conditions: [cond] }, state, config
    ).met : false;

    let detail;
    switch (cond.type) {
      case 'achievement': {
        const ach = config.achievements.achievements.find(a => a.codeName === cond.achievement);
        detail = { icon: ach?.icon || '🏆', label: `Achievement: ${ach?.displayName || cond.achievement}` };
        break;
      }
      case 'resourceHeld': {
        const res = this.getResource(cond.resource);
        detail = { icon: res?.icon || '', label: `Hold ${fmt(cond.amount)} ${res?.displayName || cond.resource}` };
        break;
      }
      case 'generatorOwned': {
        const gen = this.getGenerator(cond.generator);
        detail = { icon: gen?.icon || '⚙️', label: `Own ${cond.quantity || cond.amount || 1} ${gen?.displayName || cond.generator}` };
        break;
      }
      case 'canAffordFirstPurchase': {
        const gen = cond.generator ? this.getGenerator(cond.generator) : null;
        detail = { icon: gen?.icon || '💰', label: `Can afford ${gen?.displayName || 'first purchase'}` };
        break;
      }
      case 'upgradePurchased': {
        const upg = this.getUpgrade(cond.upgrade);
        detail = { icon: upg?.icon || '⬆️', label: `Upgrade: ${upg?.displayName || cond.upgrade}` };
        break;
      }
      case 'ascensionTier':
        detail = { icon: '🔄', label: `Ascension tier ${cond.minTier}+` };
        break;
      case 'prestigeCount':
        detail = { icon: '🔄', label: `${cond.min} prestiges this tier` };
        break;
      case 'lifetimeResourcesGenerated': {
        const res = this.getResource(cond.resource);
        detail = { icon: res?.icon || '', label: `Lifetime ${res?.displayName || cond.resource}: ${fmt(cond.min)}` };
        break;
      }
      case 'lifetimeGeneratorPurchases':
        detail = { icon: '⚙️', label: `${cond.min} lifetime generator purchases` };
        break;
      case 'lifetimePrestiges':
        detail = { icon: '🔄', label: `Prestige ${cond.min} time${cond.min === 1 ? '' : 's'}` };
        break;
      default:
        detail = { icon: '❓', label: cond.type };
    }

    return { ...detail, progress, met };
  },

  flattenUnlockConditions(unlockConditions) {
    return flattenUnlockConditions(unlockConditions);
  },

  buildUnlockRequirements(unlockConditions, state, formatNumber) {
    return this.flattenUnlockConditions(unlockConditions)
      .map(c => this.formatUnlockConditionDetail(c, state, formatNumber));
  },

  getCombinedUnlockRequirements({ unlockConditions, requiredFeature }, state, formatNumber) {
    const requirements = [];

    if (requiredFeature && !this.isFeatureUnlocked(requiredFeature, state)) {
      requirements.push(...this.getFeatureUnlockInfo(requiredFeature, state, formatNumber).requirements);
    }

    if (unlockConditions) {
      requirements.push(...this.buildUnlockRequirements(unlockConditions, state, formatNumber));
    }

    return requirements;
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
      const met = state.meta.ascension.currentTier >= tierInfo.tier;
      return {
        title: this.getFeatureDisplayName(featureCode),
        met,
        requirements: [{
          icon: '🔄',
          label: `Ascend to ${tierInfo.displayName}`,
          progress: Math.min(1, state.meta.ascension.currentTier / tierInfo.tier),
          met
        }]
      };
    }

    return {
      title: this.getFeatureDisplayName(featureCode),
      met: false,
      requirements: [{ icon: '🔒', label: 'Requirements unknown', progress: 0, met: false }]
    };
  },

  getFeatureDisplayName(featureCode) {
    const names = {
      'tab:generators': 'Generators',
      'tab:upgrades': 'Upgrades',
      'tab:characters': 'Characters',
      'tab:inventory': 'Inventory',
      'tab:artifacts': 'Artifacts',
      'tab:achievements': 'Achievements',
      'tab:ascension': 'Ascension',
      'tab:stats': 'Stats',
      'tab:settings': 'Settings',
      'systems:drops': 'Drops',
      'systems:randomEvents': 'Random Events',
      'prestigeShop:tier2': 'Prestige Shop Tier 2'
    };
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

  formatUnlockCondition(cond) {
    switch (cond.type) {
      case 'achievement':
        return `🏆 Achievement: ${this.getAchievementDisplayName(cond.achievement)}`;
      case 'resourceHeld': {
        const res = this.getResource(cond.resource);
        return `${res?.icon || ''} Hold ${cond.amount} ${res?.displayName || cond.resource}`.trim();
      }
      case 'generatorOwned': {
        const gen = this.getGenerator(cond.generator);
        return `${gen?.icon || '⚙️'} Own ${cond.quantity || cond.amount || 1} ${gen?.displayName || cond.generator}`;
      }
      case 'canAffordFirstPurchase': {
        const gen = cond.generator ? this.getGenerator(cond.generator) : null;
        return `${gen?.icon || '💰'} Can afford ${gen?.displayName || 'first purchase'}`;
      }
      case 'upgradePurchased': {
        const upg = this.getUpgrade(cond.upgrade);
        return `${upg?.icon || '⬆️'} Upgrade: ${upg?.displayName || cond.upgrade}`;
      }
      case 'ascensionTier':
        return `Ascension tier ${cond.minTier}+`;
      case 'prestigeCount':
        return `${cond.min} prestiges this tier`;
      case 'lifetimeResourcesGenerated':
        return `Lifetime ${this.getResourceDisplayName(cond.resource)}: ${cond.min}`;
      case 'lifetimeGeneratorPurchases':
        return `${cond.min} lifetime generator purchases`;
      case 'lifetimePrestiges':
        return `🔄 Prestige ${cond.min} time${cond.min === 1 ? '' : 's'}`;
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

const SAVE_VERSION = '1.1.0';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

const SaveManager = {
  load() {
    const fw = ConfigManager.getFramework();
    const key = fw.save.storageKey;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return this.migrate(data);
    } catch (e) {
      console.error('Save load failed:', e);
      return null;
    }
  },

  save(state) {
    const fw = ConfigManager.getFramework();
    const key = fw.save.storageKey;
    const serializable = state.toJSON();
    const payload = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: serializable,
      checksum: ''
    };
    payload.checksum = simpleHash(JSON.stringify(serializable));
    localStorage.setItem(key, JSON.stringify(payload));
    this.rotateBackup(key, payload, fw.save.maxBackups);
    EventBus.emit(EVENTS.GAME_SAVED, payload);
    return payload;
  },

  rotateBackup(key, payload, maxBackups) {
    const backupKey = `${key}_backup`;
    try {
      const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
      backups.push({ timestamp: payload.timestamp, data: payload });
      while (backups.length > maxBackups) backups.shift();
      localStorage.setItem(backupKey, JSON.stringify(backups));
    } catch (_) { /* ignore backup errors */ }
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

    if (migrated.version === SAVE_VERSION) return migrated;

    migrated._legacy = migrated._legacy || {};
    migrated._legacy.unknownVersion = migrated.version;
    console.warn('Save version unknown, preserved in _legacy:', migrated.version);
    return migrated;
  },

  exportSave(state) {
    const payload = this.save(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic-time-factory-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(this.migrate(data));
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  clear() {
    const key = ConfigManager.getFramework().save.storageKey;
    localStorage.removeItem(key);
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
      { id: 'ascension', label: 'Ascension tiers (0-3)', check: () => ConfigManager.getAscension()?.maxTier === 3 },
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
    stats: { totalTaps: 0, totalClicks: 0, playTimeSeconds: 0 },
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
    return deepMerge(fresh, saved);
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

    const cost = FormulaEngine.calculateUpgradeCost(upgrade, us.purchaseCount);
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
    this.showToast(`🏆 ${configAch?.displayName || codeName}`);
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
    }, this.config.framework.ui.toastDurationMs || 1000);
  }

  equipItem(characterCode, slot, itemCode) {
    const item = this.config.items.items.find(i => i.codeName === itemCode);
    if (!item || item.type !== 'equipable') return false;
    if ((this.data.inventory[itemCode] || 0) <= 0) return false;
    const cs = this.data.characters[characterCode];
    if (!cs?.unlocked) return false;
    if (item.slot && item.slot !== slot) return false;

    for (const c of Object.values(this.data.characters)) {
      if (c.equipment?.[slot] === itemCode) c.equipment[slot] = null;
    }
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
      ?? 0;
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

  applyOfflineGains(gains) {
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
    return JSON.parse(JSON.stringify(rest));
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

      return {
        ...gen,
        owned,
        isUnlocked,
        unlockResult: unlock,
        nextCost: buyCost,
        buyQuantity: bulkQty,
        canBuy,
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
    return FormulaEngine.evaluateUnlockConditions(config.prestige.prestigeMinimum, state, config).met;
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
    return {
      lost: ['Resource balances', 'Generator quantities', 'Upgrade levels', 'Temporary buffs', 'Run stats'].filter((_, i) =>
        [p.clearCurrency, p.clearGeneratorQuantities, p.clearUpgrades, p.clearTemporaryBuffs, p.resetRunStats][i]
      ),
      kept: ['Artifacts', 'Generator unlocks', 'Achievements', 'Ascension tier', 'Prestige shop purchases', 'Characters', 'Lifetime milestones']
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

      const chance = table.chancePerSecond * deltaSeconds;
      if (Math.random() > chance) continue;

      const entry = this._rollEntry(table.entries);
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

  _rollEntry(entries) {
    const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
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

const AchievementSystem = {
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
      SaveManager.save(this.gameState);
      this.backupTimer = 0;
    }
  }

  applyOfflineProgress(lastTimestamp) {
    const fw = this.config.framework;
    const elapsedSec = (Date.now() - lastTimestamp) / 1000;
    if (elapsedSec < fw.save.offlineModalMinSeconds) return null;

    const mods = this.gameState.getMods();
    const result = FormulaEngine.calculateOfflineGains(
      elapsedSec, this.gameState.state, this.config, mods, fw.save.offlineCapSeconds
    );

    this.gameState.applyOfflineGains(result.gains);
    return result;
  }
}
if (typeof EventBus !== "undefined") AFK.EventBus = EventBus;
if (typeof EVENTS !== "undefined") AFK.EVENTS = EVENTS;
if (typeof ConfigManager !== "undefined") AFK.ConfigManager = ConfigManager;
if (typeof loadAllConfigs !== "undefined") AFK.loadAllConfigs = loadAllConfigs;
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
