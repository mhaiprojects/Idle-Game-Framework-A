import { FormulaEngine } from '../game/FormulaEngine.js';

let config = null;

const CONFIG_FILES = [
  'framework', 'difficulty', 'resources', 'generators', 'upgrades',
  'items', 'artifacts', 'characters', 'achievements', 'events',
  'drops', 'ascension', 'prestige'
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
