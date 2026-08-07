export const FormulaEngine = {
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
    const pdc = diff.prestigeDifficultyPerCount || {};
    const costIncrease = pdc.costIncreasePerPrestige ?? 0;
    costMult *= (1 + costIncrease * prestigeCount);
    const primaryDecrease = pdc.primaryCurrencyDecreasePerPrestige ?? pdc.ppsDecreasePerPrestige
      ?? this._calc(config, 'primaryCurrencyDecreaseFallback');
    primaryCurrencyMult *= (1 - primaryDecrease * prestigeCount);

    return { costMultiplier: costMult, primaryCurrencyMultiplier: primaryCurrencyMult, offlineEfficiency: offlineEff };
  },

  applyModifierStack(base, modifiers) {
    let flat = 0;
    let increasedSum = 0;
    let moreProduct = 1;
    const breakdown = [];

    for (const mod of modifiers) {
      if (mod.type === 'additive' || mod.stackKind === 'flat') {
        flat += mod.value;
        breakdown.push({ codeName: mod.codeName, kind: 'flat', value: mod.value });
      } else if (mod.stackKind === 'increased') {
        increasedSum += (mod.value - 1);
        breakdown.push({ codeName: mod.codeName, kind: 'increased', value: mod.value });
      } else {
        moreProduct *= mod.value;
        breakdown.push({ codeName: mod.codeName, kind: 'more', value: mod.value });
      }
    }

    const afterFlat = base + flat;
    const afterIncreased = afterFlat * (1 + increasedSum);
    const value = Math.max(0, afterIncreased * moreProduct);

    return {
      value,
      breakdown,
      flat,
      increasedSum,
      moreProduct,
      afterFlat,
      afterIncreased
    };
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

  isProduceActive(prod, state, config) {
    if (!prod.requiresUnlock) return true;
    return this._evaluateProduceUnlock(prod.requiresUnlock, state, config);
  },

  _evaluateProduceUnlock(cond, state, config) {
    switch (cond.type) {
      case 'characterUnlocked':
        return !!state.characters[cond.character]?.unlocked;
      case 'generatorUnlocked':
        return !!state.generators[cond.generator]?.isUnlocked;
      case 'generatorOwned':
        return (state.generators[cond.generator]?.quantityPurchased || 0)
          >= (cond.min ?? cond.quantity ?? 1);
      default:
        return false;
    }
  },

  getGeneratorConsumeScale(gen, quantityPurchased, state, deltaSeconds = 1) {
    if (!gen.consumes?.length || quantityPurchased <= 0) return 1;
    let scale = 1;
    for (const c of gen.consumes) {
      const needed = c.amount * quantityPurchased * deltaSeconds;
      if (needed <= 0) continue;
      const available = state.resources[c.resource]?.quantity || 0;
      scale = Math.min(scale, available / needed);
    }
    return Math.max(0, Math.min(1, scale));
  },

  calculateGeneratorProductRate(gen, prod, quantityPurchased, mods, config, state, consumeScale = 1) {
    if (!this.isProduceActive(prod, state, config)) return 0;
    let base = prod.amount * quantityPurchased * consumeScale;
    const genMods = mods.filter(m =>
      m.target === 'global' ||
      (m.target === 'generator' && m.targetId === gen.codeName) ||
      (m.target === 'category' && m.targetId === gen.category) ||
      (m.target === 'resource' && m.targetId === prod.resource)
    );
    const result = this.applyModifierStack(base, genMods);
    let rate = result.value;
    const primary = config.resources.resources.find(r => r.isPrimary);
    if (prod.resource === primary?.codeName) {
      rate *= this.getEffectiveDifficulty(state, config).primaryCurrencyMultiplier;
    }
    return rate;
  },

  calculateResourceRate(state, config, mods, resourceCode) {
    return this.calculateResourceRateBreakdown(state, config, mods, resourceCode).total;
  },

  calculateResourceRateBreakdown(state, config, mods, resourceCode) {
    const breakdown = [];
    let total = 0;

    for (const gen of config.generators.generators) {
      const gs = state.generators[gen.codeName];
      if (!gs || gs.quantityPurchased <= 0) continue;
      if (gen.requiredFeature && !this._isFeatureUnlocked(gen.requiredFeature, state, config)) continue;

      const consumeScale = this.getGeneratorConsumeScale(gen, gs.quantityPurchased, state);

      for (const prod of gen.produces || []) {
        if (prod.resource !== resourceCode) continue;
        const rate = this.calculateGeneratorProductRate(
          gen, prod, gs.quantityPurchased, mods, config, state, consumeScale
        );
        if (rate <= 0) continue;
        total += rate;
        breakdown.push({
          generator: gen.codeName,
          amount: rate,
          percent: 0,
          role: prod.role || 'primary'
        });
      }
    }

    for (const item of breakdown) {
      item.percent = total > 0 ? (item.amount / total) * 100 : 0;
    }

    return { total, breakdown };
  },

  calculateAllResourceRates(state, config, mods) {
    const rates = {};
    for (const res of config.resources.resources) {
      rates[res.codeName] = this.calculateResourceRateBreakdown(state, config, mods, res.codeName);
    }
    return rates;
  },

  calculatePrimaryCurrencyRate(state, config, mods) {
    const primary = config.resources.resources.find(r => r.isPrimary);
    return this.calculateResourceRate(state, config, mods, primary.codeName);
  },

  calculatePrimaryCurrencyBreakdown(state, config, mods) {
    const primary = config.resources.resources.find(r => r.isPrimary);
    const breakdown = [];
    let total = 0;

    for (const gen of config.generators.generators) {
      const gs = state.generators[gen.codeName];
      if (!gs || gs.quantityPurchased <= 0) continue;
      if (gen.requiredFeature && !this._isFeatureUnlocked(gen.requiredFeature, state, config)) continue;

      const consumeScale = this.getGeneratorConsumeScale(gen, gs.quantityPurchased, state);

      for (const prod of gen.produces || []) {
        if (prod.resource !== primary.codeName) continue;
        const rate = this.calculateGeneratorProductRate(
          gen, prod, gs.quantityPurchased, mods, config, state, consumeScale
        );
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

    const consumeScale = owned > 0 ? this.getGeneratorConsumeScale(gen, owned, state) : 1;

    return (gen.produces || []).map(prod => {
      const calcRateForProd = (units) => {
        if (units <= 0) return 0;
        return this.calculateGeneratorProductRate(
          gen, prod, units, mods, config, state, consumeScale
        );
      };

      const active = this.isProduceActive(prod, state, config);
      const unitRate = active ? calcRateForProd(1) : 0;
      const totalRate = owned > 0 && active ? calcRateForProd(owned) : 0;
      const totalForResource = this.calculateResourceRate(state, config, mods, prod.resource);
      const percent = totalForResource > 0 && totalRate > 0 ? (totalRate / totalForResource) * 100 : 0;

      return {
        resource: prod.resource,
        unitRate,
        totalRate,
        percent,
        role: prod.role,
        locked: prod.requiresUnlock && !active
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
    return config.resources.resources.map(r => r.codeName);
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

  calculateTranscendenceGain(state, config) {
    const tc = config.transcendence?.transcendenceCurrency;
    if (!tc) return 0;
    const earned = state.meta.transcendence?.run?.intelligenceEarnedThisRun || 0;
    const minimum = tc.minimumResourceValue;
    if (earned < minimum) return 0;
    const logBase = tc.logBase || 10;
    let gain = Math.floor(Math.log(Math.max(earned / minimum, 1)) / Math.log(logBase));
    const bonus = config.transcendence?.directives?.bonusMultiplier || 1;
    if (state.meta.transcendence?.directives?.bonusReady && bonus > 1) {
      gain = Math.floor(gain * bonus);
    }
    return gain;
  },

  getTranscendenceProgress(state, config, formatNumber) {
    const fmt = formatNumber || (n => n);
    const tc = config.transcendence?.transcendenceCurrency;
    if (!tc) return null;
    const earned = state.meta.transcendence?.run?.intelligenceEarnedThisRun || 0;
    const minimum = tc.minimumResourceValue;
    const projectedGain = this.calculateTranscendenceGain(state, config);
    const nextThreshold = minimum * Math.pow(tc.logBase || 10, projectedGain + 1);
    const resMeta = config.resources.resources.find(r => r.codeName === tc.resource);

    return {
      rulesExplanation: tc.rulesExplanation || '',
      projectedGain,
      currentRunValue: earned,
      nextMilestone: nextThreshold,
      overallProgress: nextThreshold > 0 ? Math.min(1, earned / nextThreshold) : 0,
      overallMet: earned >= nextThreshold,
      resourceIcon: resMeta?.icon || '✨',
      resourceName: resMeta?.displayName || tc.resource,
      formattedCurrent: fmt(earned),
      formattedRequired: fmt(minimum)
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
