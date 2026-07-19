import { FormulaEngine } from '../game/FormulaEngine.js';

let config = null;
let contentRegistry = null;
let currentContentId = null;

const CONTENT_SELECTION_KEY = 'afk_selected_content';

const CONFIG_FILES = [
  'framework', 'difficulty', 'resources', 'generators', 'upgrades',
  'items', 'artifacts', 'characters', 'achievements', 'events',
  'drops', 'ascension', 'prestige', 'defaults'
];

export async function loadContentRegistry() {
  if (window.AFK_CONTENT_REGISTRY) {
    contentRegistry = window.AFK_CONTENT_REGISTRY;
    return contentRegistry;
  }
  const res = await fetch('content/registry.json');
  if (!res.ok) throw new Error('Failed to load content/registry.json');
  contentRegistry = await res.json();
  return contentRegistry;
}

export function getSelectedContentId() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(CONTENT_SELECTION_KEY);
    if (stored) return stored;
  }
  return contentRegistry?.defaultContentId || 'cosmic-time-factory';
}

export function setSelectedContentId(contentId) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(CONTENT_SELECTION_KEY, contentId);
  }
}

export function getContentRegistry() {
  return contentRegistry;
}

export function getCurrentContentId() {
  return currentContentId;
}

export function getCurrentManifest() {
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

export async function loadAllConfigs(contentId) {
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

export function validateGeneratorChain(cfg) {
  const errors = [];
  const gens = cfg.generators.generators;
  const primaryCode = cfg.resources.resources.find(r => r.isPrimary)?.codeName;
  const producedSoFar = new Set(primaryCode ? [primaryCode] : []);

  for (const gen of gens) {
    const nextCosts = (gen.costResources || []).map(c => c.resource);
    const nextHeld = flattenConditions(gen.unlockConditions)
      .filter(c => c.type === 'resourceHeld').map(c => c.resource);
    const needed = [...new Set([...nextCosts, ...nextHeld])];

    for (const res of needed) {
      if (res === primaryCode) continue;
      if (!producedSoFar.has(res)) {
        errors.push({
          generator: gens[gens.indexOf(gen) - 1]?.codeName || '(start)',
          missing: res,
          forGenerator: gen.codeName
        });
      }
    }

    for (const prod of gen.produces || []) {
      producedSoFar.add(prod.resource);
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

export const ConfigManager = {
  getAll() { return config; },
  getAvailableGames() { return contentRegistry?.games || []; },
  getGeneratorTiers() { return config?.framework?.generatorTiers || {}; },
  getCurrentContentId() { return getCurrentContentId(); },
  getCurrentManifest() { return getCurrentManifest(); },
  getContentRegistry() { return getContentRegistry(); },
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

  /** Standard upgrade cap field: maxLevel (legacy content may use maxPurchases). null = unlimited. */
  getUpgradeMaxLevel(upgrade) {
    if (!upgrade) return null;
    if (upgrade.maxLevel != null) return upgrade.maxLevel;
    if (upgrade.maxPurchases != null) return upgrade.maxPurchases;
    return null;
  },

  isUpgradeMaxed(upgrade, purchaseCount = 0) {
    const max = this.getUpgradeMaxLevel(upgrade);
    return max != null && purchaseCount >= max;
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
