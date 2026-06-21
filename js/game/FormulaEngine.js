export const FormulaEngine = {
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
