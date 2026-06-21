import { FormulaEngine } from '../game/FormulaEngine.js';

let config = null;

const CONFIG_FILES = [
  'framework', 'difficulty', 'resources', 'generators', 'upgrades',
  'items', 'artifacts', 'characters', 'achievements', 'events',
  'drops', 'ascension', 'prestige', 'defaults'
];

export async function loadAllConfigs() {
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

export function validateGeneratorChain(cfg) {
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

export const ConfigManager = {
  getAll() { return config; },
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

    return { ...detail, progress, met };
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
          met: held >= required
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
    return this.flattenUnlockConditions(unlockConditions)
      .flatMap(c => this.buildRequirementRows(c, state, formatNumber));
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
          icon: this.getDefaultIcon('ascension'),
          label: this.formatAscensionTierLabel(tierInfo.tier),
          progress: tierInfo.tier > 0
            ? Math.min(1, state.meta.ascension.currentTier / tierInfo.tier)
            : (state.meta.ascension.currentTier >= tierInfo.tier ? 1 : 0),
          met
        }]
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
