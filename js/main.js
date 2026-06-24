(function () {
  'use strict';

  const { createApp, reactive } = Vue;
  const AFK = window.AFK;
  const App = window.AFK_UI.App;

  class GameFacade {
    constructor(config, gameState, gameLoop, contentId) {
      this.config = config;
      this.gameState = gameState;
      this.gameLoop = gameLoop;
      this.contentId = contentId;
      this.offlineModal = null;
      this._reactiveTick = 0;
      this.getEquipSlotOptions = this.getEquipSlotOptions.bind(this);
      this.getItemDisplay = this.getItemDisplay.bind(this);
    }

    get state() { return this.gameState.state; }

    formatNumber(v) {
      return AFK.FormulaEngine.formatNumber(v, this.config);
    }

    isFeatureUnlocked(feature) {
      return AFK.ConfigManager.isFeatureUnlocked(feature, this.state);
    }

    bumpUI() {
      this._reactiveTick++;
    }

    getResourceBarItems() {
      void this._reactiveTick;
      const fw = this.config.framework;
      const resources = AFK.ConfigManager.getResources();

      const items = resources.map(r => ({
        ...r,
        quantity: this.state.resources[r.codeName]?.quantity || 0
      }));

      items.sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return b.quantity - a.quantity;
      });

      const top = items.slice(0, fw.ui.resourceBarTopCount);
      return top.map(r => ({
        ...r,
        formatted: this.formatNumber(r.quantity)
      }));
    }

    getPrimaryCurrencyLabel() {
      return AFK.ConfigManager.getPrimaryResource()?.displayName
        || AFK.ConfigManager.getDefaultLabel('primaryCurrency');
    }

    getPrimaryCurrencyRateFormatted() {
      void this._reactiveTick;
      const rate = AFK.FormulaEngine.calculatePrimaryCurrencyRate(
        this.state, this.config, this.gameState.getMods()
      );
      if (rate <= 0) return '';
      return this.formatNumber(rate);
    }

    getPrimaryCurrencyBreakdown() {
      void this._reactiveTick;
      return AFK.FormulaEngine.calculatePrimaryCurrencyBreakdown(
        this.state, this.config, this.gameState.getMods()
      );
    }

    getTapGain() {
      void this._reactiveTick;
      return AFK.FormulaEngine.calculateTapGain(this.state, this.config, this.gameState.getMods());
    }

    getPrimaryIcon() {
      return AFK.ConfigManager.getPrimaryResource()?.icon
        || AFK.ConfigManager.getDefaultIcon('primaryCurrency');
    }

    getGeneratorDisplay() {
      void this._reactiveTick;
      const fmt = (v) => this.formatNumber(v);
      return AFK.GeneratorSystem.getDisplayData(this.state, this.config, this.gameState.getMods())
        .map(gen => ({
          ...gen,
          unlockRequirements: AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: gen.unlockConditions, requiredFeature: gen.requiredFeature },
            this.state,
            fmt
          ),
          costProgress: AFK.ConfigManager.buildCostProgressEntries(gen.nextCost, this.state, fmt)
        }));
    }

    getResourceLabel(code) {
      return AFK.ConfigManager.getResourceDisplayName(code);
    }

    getResourceMeta(code) {
      return AFK.ConfigManager.getResourceMeta(code);
    }

    getGeneratorLabel(code) {
      return AFK.ConfigManager.getGeneratorDisplayName(code);
    }

    formatUnlockCondition(cond) {
      return AFK.ConfigManager.formatUnlockCondition(cond);
    }

    formatUnlockConditionDetail(cond) {
      return AFK.ConfigManager.formatUnlockConditionDetail(cond, this.state, (v) => this.formatNumber(v));
    }

    formatCostEntries(cost) {
      return AFK.ConfigManager.formatResourceCostEntries(cost, (v) => this.formatNumber(v));
    }

    getUnlockRequirementsInfo(source) {
      return AFK.ConfigManager.getUnlockRequirementsInfo(source, this.state, (v) => this.formatNumber(v));
    }

    getFeatureUnlockInfo(featureCode) {
      return AFK.ConfigManager.getFeatureUnlockInfo(featureCode, this.state, (v) => this.formatNumber(v));
    }

    getUpgradeDisplay() {
      void this._reactiveTick;
      const mods = this.gameState.getMods();
      const primaryRate = AFK.FormulaEngine.calculatePrimaryCurrencyRate(this.state, this.config, mods);
      let bestCode = null;
      let bestEff = 0;

      const upgrades = this.config.upgrades.upgrades.map(u => {
        const us = this.state.upgrades[u.codeName];
        const unlock = AFK.FormulaEngine.evaluateUnlockConditions(u.unlockConditions, this.state, this.config);
        const cost = AFK.FormulaEngine.calculateUpgradeCost(u, us.purchaseCount, this.config);
        const fmt = (v) => this.formatNumber(v);
        const canAfford = (this.state.resources[u.costResource]?.quantity || 0) >= cost;
        const maxed = u.maxPurchases !== null && us.purchaseCount >= u.maxPurchases;
        let efficiency = 0;
        if (u.effect?.type === 'globalMultiplier' && cost > 0) {
          efficiency = (primaryRate * (u.effect.multiplier - 1)) / cost;
        } else if (u.effect?.type === 'clickMultiplier' && cost > 0) {
          const tapGain = AFK.FormulaEngine.calculateTapGain(this.state, this.config, mods);
          efficiency = (tapGain * (u.effect.multiplier - 1)) / cost;
        }
        if (unlock.met && canAfford && !maxed && efficiency > bestEff) {
          bestEff = efficiency;
          bestCode = u.codeName;
        }
        return {
          ...u,
          purchaseCount: us.purchaseCount,
          cost,
          unlocked: unlock.met,
          maxed,
          canBuy: unlock.met && canAfford && !maxed,
          efficiency,
          unlockRequirements: AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: u.unlockConditions }, this.state, (v) => this.formatNumber(v)
          ),
          costProgress: AFK.ConfigManager.buildCostProgressEntries({ [u.costResource]: cost }, this.state, fmt),
          levelProgress: u.maxPurchases != null
            ? AFK.ConfigManager.buildProgressEntry({
              current: us.purchaseCount,
              required: u.maxPurchases,
              icon: u.icon,
              name: u.displayName,
              code: `${u.codeName}-level`,
              label: `Level ${us.purchaseCount} / ${u.maxPurchases}`,
              formatNumber: (n) => String(n)
            })
            : null
        };
      });

      this.state.ui.bestUpgradeCode = bestCode;
      return upgrades;
    }

    getCharacterDisplay() {
      void this._reactiveTick;
      return this.config.characters.characters.map(c => {
        const cs = this.state.characters[c.codeName];
        const unlock = AFK.FormulaEngine.evaluateUnlockConditions(c.unlockConditions, this.state, this.config);
        if (unlock.met) cs.unlocked = true;
        return {
          ...c,
          ...cs,
          unlocked: cs.unlocked || unlock.met,
          unlockResult: unlock,
          unlockRequirements: AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: c.unlockConditions }, this.state, (v) => this.formatNumber(v)
          ),
          effectSummary: AFK.ModifierSystem.summarizeCharacterEffects(
            c.codeName, this.state, this.config, (eff) => this.describeEffectShort(eff) || this.describeEffect(eff)
          )
        };
      });
    }

    getAchievementDisplay() {
      void this._reactiveTick;
      const fmt = (v) => this.formatNumber(v);
      return this.config.achievements.achievements.map(a => {
        const unlocked = !!this.state.achievements[a.codeName]?.unlocked;
        const requirementRows = unlocked ? [] : [
          AFK.AchievementSystem.getRequirementRow(a.requirement, this.state, this.config, fmt)
        ];
        return {
          ...a,
          unlocked,
          requirementRows
        };
      });
    }

    getInventoryDisplay() {
      void this._reactiveTick;
      return this.config.items.items.filter(i => i.type === 'consumable' || i.type === 'equipable');
    }

    getArtifactDisplay() {
      void this._reactiveTick;
      return this.config.artifacts.artifacts.map(a => ({
        ...a,
        acquired: !!this.state.artifacts.acquired[a.codeName]
      }));
    }

    getEquipableItems() {
      void this._reactiveTick;
      return this.config.items.items.filter(i => i.type === 'equipable');
    }

    getItemDisplay(codeName) {
      const item = this.config.items.items.find(i => i.codeName === codeName);
      if (!item) {
        return {
          codeName,
          displayName: codeName,
          icon: AFK.ConfigManager.getDefaultIcon('unknown'),
          rarityLabel: ''
        };
      }
      return {
        codeName,
        displayName: item.displayName,
        icon: item.icon,
        rarityLabel: AFK.ConfigManager.formatRarityLabel(item.rarity)
      };
    }

    getEquipmentSlots() {
      return (this.config.framework.equipmentSlots || []).map(s => s.id);
    }

    getEquipmentSlotLayout() {
      return this.config.framework.equipmentSlots || [];
    }

    getEquipSlotOptions(characterCode, slotId) {
      void this._reactiveTick;
      return AFK.ConfigManager.buildEquipSlotOptions(
        this.state,
        characterCode,
        slotId,
        (effect) => this.describeEffectShort(effect) || this.describeEffect(effect)
      );
    }

    describeEffectShort(effect) {
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
          return this.describeEffect(effect).replace(/\.$/, '');
      }
    }

    describeEffect(effect) {
      if (!effect?.type) return 'No gameplay effect.';
      const mult = effect.multiplier || 1;
      const pct = Math.round(Math.abs(mult - 1) * 100);
      const signed = mult >= 1 ? '+' : '-';
      const dur = effect.durationSeconds
        ? ` for ${effect.durationSeconds} seconds when activated`
        : ' while equipped or active';
      switch (effect.type) {
        case 'globalMultiplier':
          return `${signed}${pct}% to all resource production${dur}.`;
        case 'clickMultiplier':
          return `${signed}${pct}% to tap / click gain${dur}.`;
        case 'generatorMultiplier':
          return `${signed}${pct}% to a specific generator${dur}.`;
        case 'categoryMultiplier':
          return `${signed}${pct}% to ${effect.category || 'category'} generators${dur}.`;
        case 'costReduction':
          return `${pct}% reduction on purchase costs${dur}.`;
        case 'resourceMultiplier':
          return `${signed}${pct}% to ${AFK.ConfigManager.getResourceDisplayName(effect.resource)} production${dur}.`;
        default:
          return `${effect.type} modifier (${mult}×)${dur}.`;
      }
    }

    getEntityInfo(type, codeName) {
      void this._reactiveTick;
      const fmt = (v) => this.formatNumber(v);
      const L = (key, vars) => AFK.ConfigManager.getDefaultLabel(key, vars);
      const section = (sectionKey, body, title) => ({ sectionKey, body, ...(title ? { title } : {}) });
      switch (type) {
        case 'item': {
          const item = this.config.items.items.find(i => i.codeName === codeName);
          if (!item) return null;
          const qty = this.state.inventory[item.codeName] || 0;
          const sections = [
            section('description', item.description || L('noDescription'))
          ];
          if (item.effect) {
            sections.push(section('provides', this.describeEffect(item.effect)));
          }
          sections.push(section('owned', `${qty}`));
          if (item.type === 'consumable') {
            sections.push(section('usage', item.actionBarEligible
              ? 'Use from inventory or the action bar when owned.'
              : 'Use from inventory when owned.'));
          } else if (item.type === 'equipable') {
            const slotLabel = AFK.ConfigManager.getEquipmentSlotLabel(item.slot);
            const eqCfg = AFK.ConfigManager.getEquipmentConfig();
            const stackPct = Math.round((eqCfg.stackBonusPerCopy ?? this.config.defaults.equipment.stackBonusPerCopy) * 100);
            sections.push(section('rarity',
              `${AFK.ConfigManager.formatRarityLabel(item.rarity)} (×${AFK.ConfigManager.getRarityMultiplier(item.rarity)} base power)`));
            if (qty > 0) {
              const effective = AFK.ConfigManager.getEffectiveItemEffect(item, qty);
              sections.push(section('effectivePower',
                `${this.describeEffect(effective)} · ${qty} stacked (+${stackPct}% per extra copy)`));
            }
            const wearers = Object.entries(this.state.characters)
              .filter(([, cs]) => Object.values(cs.equipment || {}).includes(item.codeName))
              .map(([code]) => this.config.characters.characters.find(c => c.codeName === code))
              .filter(Boolean);
            sections.push(section('equipmentSlot',
              `${slotLabel || item.slot}${wearers.length ? ` · equipped on ${wearers.map(c => c.icon + ' ' + c.displayName).join(', ')}` : ''}`));
          }
          return { title: item.displayName, icon: item.icon, sections };
        }
        case 'character': {
          const char = this.config.characters.characters.find(c => c.codeName === codeName);
          if (!char) return null;
          const cs = this.state.characters[codeName];
          const sections = [section('description', char.description || L('noDescription'))];
          const benefits = [];
          if (char.baseStats?.globalMultiplier) {
            benefits.push(`+${Math.round((char.baseStats.globalMultiplier - 1) * 100)}% global production when active.`);
          }
          if (char.baseStats?.clickMultiplier) {
            benefits.push(`+${Math.round((char.baseStats.clickMultiplier - 1) * 100)}% tap power when active.`);
          }
          if (char.baseStats?.categoryMultiplier) {
            const cm = char.baseStats.categoryMultiplier;
            benefits.push(`+${Math.round((cm.multiplier - 1) * 100)}% ${cm.category} generator output when active.`);
          }
          sections.push(section('benefitsWhenActive', benefits.length ? benefits.join(' ') : L('noPassiveBonuses')));
          if (char.activeSkill) {
            const skillTitle = `${AFK.ConfigManager.getSection('activeSkill').title} — ${char.activeSkill.displayName}`;
            sections.push(section('activeSkill',
              `${this.describeEffect(char.activeSkill.effect)} Cooldown: ${char.activeSkill.cooldownSeconds}s.`,
              skillTitle));
          }
          if (cs?.equipment && Object.keys(cs.equipment).length) {
            const equipped = Object.entries(cs.equipment).filter(([, v]) => v).map(([slot, code]) => {
              const item = this.config.items.items.find(i => i.codeName === code);
              const slotLabel = AFK.ConfigManager.getEquipmentSlotLabel(slot);
              return `${slotLabel}: ${item?.icon || ''} ${item?.displayName || code}`;
            });
            sections.push(section('currentlyEquipped', equipped.join(' · ') || L('nothingEquipped')));
          }
          const effectRows = AFK.ModifierSystem.summarizeCharacterEffects(
            codeName, this.state, this.config, (eff) => this.describeEffectShort(eff) || this.describeEffect(eff)
          );
          if (effectRows.length) {
            sections.push(section('combinedEffects',
              effectRows.map(r => `${r.label} (${r.sources})`).join(' · ')));
          }
          const requirements = AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: char.unlockConditions }, this.state, fmt
          );
          return {
            title: char.displayName,
            icon: char.icon,
            sections,
            requirements: requirements.length ? requirements : undefined
          };
        }
        case 'generator': {
          const gen = this.config.generators.generators.find(g => g.codeName === codeName);
          if (!gen) return null;
          const gs = this.state.generators[codeName];
          const productionRows = AFK.GeneratorSystem.buildProductionRows(
            this.state, this.config, this.gameState.getMods(), codeName
          );
          const sections = [
            section('owned', L('unitsOwned', { count: gs?.quantityPurchased || 0 }))
          ];
          const requirements = AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: gen.unlockConditions, requiredFeature: gen.requiredFeature },
            this.state,
            fmt
          );
          return {
            title: gen.displayName,
            icon: gen.icon,
            description: gen.description || L('noDescription'),
            productionRows,
            sections,
            requirements: requirements.length ? requirements : undefined
          };
        }
        case 'upgrade': {
          const upg = this.config.upgrades.upgrades.find(u => u.codeName === codeName);
          if (!upg) return null;
          const us = this.state.upgrades[codeName];
          const res = AFK.ConfigManager.getResource(upg.costResource);
          const requirements = AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: upg.unlockConditions }, this.state, fmt
          );
          return {
            title: upg.displayName,
            icon: upg.icon,
            sections: [
              section('description', upg.description || L('noDescription')),
              section('effect', this.describeEffect(upg.effect)),
              section('purchaseRequirements',
                `${fmt(upg.cost)} ${res?.icon || ''} ${res?.displayName || upg.costResource} per level`),
              section('levelProgress',
                `Level ${us?.purchaseCount || 0}${upg.maxPurchases != null ? ' / ' + upg.maxPurchases : ''}`)
            ],
            requirements: requirements.length ? requirements : undefined
          };
        }
        case 'artifact': {
          const art = this.config.artifacts.artifacts.find(a => a.codeName === codeName);
          if (!art) return null;
          return {
            title: art.displayName,
            icon: art.icon,
            sections: [
              section('description', art.description || L('noDescription')),
              section('rarity', art.rarity || L('unknownEntity')),
              section('permanentBonus',
                this.describeEffect(art.effect).replace(/ while equipped or active\.?$/, ' permanently once collected.'))
            ]
          };
        }
        case 'achievement': {
          const ach = this.config.achievements.achievements.find(a => a.codeName === codeName);
          if (!ach) return null;
          const unlocked = !!this.state.achievements[codeName]?.unlocked;
          const sections = [
            section('description', ach.description || L('noDescription'))
          ];
          if (!unlocked) {
            sections.push(section('achievementRequirements',
              AFK.AchievementSystem.getRequirementRow(ach.requirement, this.state, this.config, fmt).label));
          }
          if (ach.reward) {
            const rewardBody = ach.reward.type === 'resourceBonus'
              ? `+${fmt(ach.reward.amount)} ${AFK.ConfigManager.getResourceDisplayName(ach.reward.resource)}`
              : ach.reward.effect
                ? this.describeEffect(ach.reward.effect)
                : ach.reward.type;
            sections.push(section('reward', rewardBody));
          }
          const requirementRows = unlocked ? [] : [
            AFK.AchievementSystem.getRequirementRow(ach.requirement, this.state, this.config, fmt)
          ];
          return {
            title: ach.displayName,
            icon: ach.icon,
            sections,
            requirements: requirementRows.length ? requirementRows : undefined
          };
        }
        case 'prestige': {
          const fmtLocal = fmt;
          const prestigeMinimum = AFK.FormulaEngine.getScaledPrestigeMinimum(this.state, this.config);
          const prestigeRequirements = AFK.ConfigManager.buildRequirementRowsFromConditions(
            prestigeMinimum, this.state, fmtLocal
          );
          const shardProgress = AFK.FormulaEngine.getPrestigeShardProgress(this.state, this.config, fmtLocal);
          const lostKept = AFK.PrestigeSystem.getLostKept(this.config);
          const gain = AFK.PrestigeSystem.getProjectedGain(this.state, this.config);
          const diff = AFK.FormulaEngine.getEffectiveDifficulty(this.state, this.config);
          const pc = this.config.prestige.prestigeCurrency;
          return {
            title: AFK.ConfigManager.getSection('prestigeSoftReset').title,
            icon: AFK.ConfigManager.getSection('prestigeSoftReset').icon,
            sections: [
              section('shardRules', shardProgress.rulesExplanation || pc.rulesExplanation || ''),
              section('rewards',
                `Gain +${gain} Prestige Shards. Next shard milestone: ${fmtLocal(shardProgress.nextMilestone)} weighted run value. Cost mult: ${diff.costMultiplier.toFixed(2)}× · ${this.getPrimaryCurrencyLabel()}: ${diff.primaryCurrencyMultiplier.toFixed(2)}×`),
              section('lost', lostKept.lost.join(' · ')),
              section('kept', lostKept.kept.join(' · '))
            ],
            requirements: prestigeRequirements.length ? prestigeRequirements : undefined
          };
        }
        case 'ascension': {
          const next = AFK.AscensionSystem.getNextTier(this.state, this.config);
          if (!next) return null;
          const ascensionRequirements = this._buildAscensionRequirementRows(
            next.ascensionRequirements?.conditions || [],
            fmt
          );
          const lostKept = AFK.AscensionSystem.getLostKept(next);
          const preview = AFK.AscensionSystem.getUnlockedFeaturesPreview(this.state, this.config);
          const sections = [
            section('description', `Ascend to ${AFK.ConfigManager.formatAscensionTierLabel(next.tier)}.`)
          ];
          if (preview.length) {
            sections.push(section('unlocksPreview', preview.join(', ')));
          }
          sections.push(
            section('lost', lostKept.lost.join(' · ')),
            section('kept', lostKept.kept.join(' · '))
          );
          return {
            title: AFK.ConfigManager.formatAscensionTierLabel(next.tier),
            icon: AFK.ConfigManager.getDefaultIcon('ascension'),
            sections,
            requirements: ascensionRequirements.length ? ascensionRequirements : undefined
          };
        }
        case 'prestigeBonus': {
          const bonus = this.config.prestige.prestigeBonuses.find(b => b.codeName === codeName);
          if (!bonus) return null;
          const level = this.state.meta.prestige.purchasedBonuses[codeName] || 0;
          const cost = bonus.cost * (level + 1);
          const locked = bonus.requiredFeature && !this.isFeatureUnlocked(bonus.requiredFeature);
          const sections = [
            section('description', bonus.description || L('noDescription')),
            section('effect', this.describeEffect({
              ...bonus.effect,
              multiplier: 1 + (bonus.effect.multiplierPerLevel || 0) * Math.max(level, 1)
            })),
            section('levelProgress', `Level ${level} / ${bonus.maxLevel}`),
            section('purchaseRequirements', `${fmt(cost)} Prestige Shards per purchase`)
          ];
          const requirements = locked
            ? AFK.ConfigManager.getFeatureUnlockInfo(bonus.requiredFeature, this.state, fmt).requirements
            : undefined;
          return {
            title: bonus.displayName,
            icon: bonus.icon,
            sections,
            requirements: requirements?.length ? requirements : undefined
          };
        }
        default:
          return null;
      }
    }

    getEventBannerItems() {
      void this._reactiveTick;
      const now = Date.now();
      return (this.state.activeEvents || []).map(e => ({
        ...e,
        remainingSeconds: Math.max(0, (e.expiresAt - now) / 1000)
      }));
    }

    getPrestigeBonusesDisplay() {
      void this._reactiveTick;
      const fmt = (v) => this.formatNumber(v);
      return (this.config.prestige.prestigeBonuses || []).map(bonus => {
        const level = this.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        const locked = bonus.requiredFeature && !this.isFeatureUnlocked(bonus.requiredFeature);
        const cost = bonus.cost * (level + 1);
        const maxed = level >= bonus.maxLevel;
        const canBuy = !locked && !maxed && this.state.meta.prestige.currency >= cost;
        const unlockRequirements = locked
          ? AFK.ConfigManager.getFeatureUnlockInfo(bonus.requiredFeature, this.state, fmt).requirements
          : [];
        return {
          ...bonus,
          level,
          maxed,
          canBuy,
          locked,
          unlockRequirements,
          costProgress: [AFK.ConfigManager.buildProgressEntry({
            current: this.state.meta.prestige.currency,
            required: cost,
            icon: '✨',
            name: 'Prestige Shards',
            code: 'prestigeCurrency',
            formatNumber: fmt
          })],
          levelProgress: AFK.ConfigManager.buildProgressEntry({
            current: level,
            required: bonus.maxLevel,
            icon: bonus.icon,
            name: bonus.displayName,
            code: `${bonus.codeName}-level`,
            label: `Level ${level} / ${bonus.maxLevel}`,
            formatNumber: (n) => String(n)
          })
        };
      });
    }

    _buildAscensionRequirementRows(conditions, fmt) {
      return (conditions || []).map(cond => {
        const detail = AFK.ConfigManager.formatUnlockConditionDetail(cond, this.state, fmt);
        return {
          icon: detail.icon,
          label: detail.label,
          progress: detail.progress,
          met: detail.met
        };
      });
    }

    getAscensionDisplay() {
      void this._reactiveTick;
      const fmt = (v) => this.formatNumber(v);
      const tier = this.state.meta.ascension.currentTier;
      const next = AFK.AscensionSystem.getNextTier(this.state, this.config);
      const ascendCheck = AFK.AscensionSystem.canAscend(this.state, this.config);
      const prestigeMinimum = AFK.FormulaEngine.getScaledPrestigeMinimum(this.state, this.config);
      const prestigeRequirements = AFK.ConfigManager.buildRequirementRowsFromConditions(
        prestigeMinimum, this.state, fmt
      );
      const shardProgress = AFK.FormulaEngine.getPrestigeShardProgress(this.state, this.config, fmt);
      const ascensionRequirements = next?.ascensionRequirements
        ? this._buildAscensionRequirementRows(
          next.ascensionRequirements.conditions || [next.ascensionRequirements],
          fmt
        )
        : [];
      const lostKeptPrestige = AFK.PrestigeSystem.getLostKept(this.config);
      const lostKeptAscend = next ? AFK.AscensionSystem.getLostKept(next) : { lost: [], kept: [] };

      return {
        tierName: AFK.ConfigManager.formatAscensionTierLabel(tier),
        currentTier: tier,
        prestigeCount: this.state.meta.ascension.tiers[tier]?.prestigeCount || 0,
        lifetimePrestiges: this.state.meta.milestones.lifetimePrestiges,
        projectedGain: AFK.PrestigeSystem.getProjectedGain(this.state, this.config),
        canPrestige: AFK.PrestigeSystem.canPrestige(this.state, this.config),
        canAscend: ascendCheck.met,
        nextTierName: next ? AFK.ConfigManager.formatAscensionTierLabel(next.tier) : '',
        prestigeRequirements,
        shardProgress,
        ascensionRequirements,
        prestigeLost: lostKeptPrestige.lost,
        prestigeKept: lostKeptPrestige.kept,
        ascendLost: lostKeptAscend.lost,
        ascendKept: lostKeptAscend.kept,
        featurePreview: AFK.AscensionSystem.getUnlockedFeaturesPreview(this.state, this.config),
        prestigeCurrency: this.state.meta.prestige.currency,
        maxTierReached: tier >= this.config.ascension.maxTier,
        difficulty: AFK.FormulaEngine.getEffectiveDifficulty(this.state, this.config),
        prestigeBonuses: this.getPrestigeBonusesDisplay()
      };
    }

    getStatsDisplay() {
      void this._reactiveTick;
      const run = this.state.meta.prestige.run;
      return {
        totalTaps: this.state.stats.totalTaps,
        playTimeSeconds: this.state.stats.playTimeSeconds,
        peakPrimaryCurrencyRate: run.peakPrimaryCurrencyRateThisRun ?? run.peakPPSThisRun ?? 0
      };
    }

    getProgress() {
      return AFK.ProgressTracker.runChecks({
        gameloop: () => this.gameLoop.running,
        tap: () => typeof this.gameState.performTap === 'function'
      });
    }

    _updateFormulaInspector() {
      const fw = this.config.framework;
      const mods = this.gameState.getMods();
      this.state.ui.formulaInspector = {
        tapGain: AFK.FormulaEngine.calculateTapGain(this.state, this.config, mods),
        primaryRate: AFK.FormulaEngine.calculatePrimaryCurrencyRate(this.state, this.config, mods),
        tapPercent: fw.ui.tapAction.percentOfPrimaryCurrencyRate ?? fw.ui.tapAction.percentOfPrimaryCurrencyProduction
      };
    }

    _checkStagnationHint() {
      if (!this.state.settings.notificationsEnabled) return;
      const fw = this.config.framework;
      if (this.state.ui.stagnationTimer < fw.ui.stagnationHintSeconds) return;

      const hasAffordable = this.getUpgradeDisplay().some(u => u.canBuy)
        || AFK.GeneratorSystem.getDisplayData(this.state, this.config, this.gameState.getMods()).some(g => g.canBuy);
      if (!hasAffordable) return;

      this.state.ui.stagnationTimer = 0;
      this.gameState.showToast('💡 Production stalled — try buying an upgrade or generator!');
    }

    getSkillSlots() {
      void this._reactiveTick;
      if (!this.isFeatureUnlocked('tab:characters')) return [];
      const max = this.config.framework.ui.actionBar.maxSkillSlots;
      const skills = [];
      for (const char of this.config.characters.characters) {
        if (!char.activeSkill) continue;
        const cs = this.state.characters[char.codeName];
        if (!cs?.activated) continue;
        skills.push({
          ...char.activeSkill,
          characterIcon: char.icon,
          characterName: char.displayName,
          cooldownRemaining: cs.skillCooldownRemaining
        });
        if (skills.length >= max) break;
      }
      return skills;
    }

    getBoostSlots() {
      void this._reactiveTick;
      if (!this.isFeatureUnlocked('tab:inventory')) return [];
      const max = this.config.framework.ui.actionBar.maxBoostSlots;
      const boosts = [];
      for (const item of this.config.items.items) {
        if (!item.actionBarEligible) continue;
        const qty = this.state.inventory[item.codeName] || 0;
        if (qty <= 0) continue;
        boosts.push({ codeName: item.codeName, displayName: item.displayName, icon: item.icon, quantity: qty });
        if (boosts.length >= max) break;
      }
      return boosts;
    }

    getActiveCharacterCount() {
      return Object.values(this.state.characters).filter(c => c.activated).length;
    }

    setTab(id) { this.state.ui.activeTab = id; }

    onTap() {
      const gain = this.gameState.performTap();
      AFK.DropSystem.onClick(this.state, this.config, this.gameState);
      const primary = AFK.ConfigManager.getPrimaryResource();
      this.gameState.showResourceDelta(primary.codeName, gain);
      if (this.state.settings.devMode) this._updateFormulaInspector();
      this.bumpUI();
    }

    onBuyGenerator(code) {
      const mult = this.state.ui.purchaseMultiplier;
      const mods = this.gameState.getMods();
      const qty = AFK.GeneratorSystem.getBulkQuantity(this.state, this.config, code, mult, mods);
      if (qty <= 0) return;
      if (this.gameState.buyGenerator(code, qty)) {
        const label = AFK.ConfigManager.getGeneratorDisplayName(code);
        this.gameState.showToast(`Purchased ${qty}× ${label}`);
        this.bumpUI();
      }
    }

    onBuyUpgrade(code) {
      if (this.gameState.buyUpgrade(code)) {
        this.gameState.showToast('Upgrade purchased!');
        this.bumpUI();
      }
    }

    setPurchaseMultiplier(val) { this.gameState.setPurchaseMultiplier(val); }

    toggleCharacter(code) {
      if (this.gameState.toggleCharacter(code)) this.bumpUI();
    }

    activateSkill(code) {
      if (this.gameState.activateSkill(code)) this.bumpUI();
    }

    useBoost(code) {
      if (this.gameState.useBoost(code)) this.bumpUI();
    }

    equipItem(char, slot, item) {
      if (this.gameState.equipItem(char, slot, item)) {
        const itemDef = this.config.items.items.find(i => i.codeName === item);
        this.gameState.showToast(`Equipped ${itemDef?.displayName || item}`);
        this.bumpUI();
      }
    }

    unequipItem(char, slot) {
      if (this.gameState.unequipItem(char, slot)) this.bumpUI();
    }

    buyPrestigeBonus(code) {
      if (AFK.PrestigeSystem.buyBonus(this.state, this.config, code, this.gameState)) {
        const bonus = this.config.prestige.prestigeBonuses.find(b => b.codeName === code);
        this.gameState.showToast(`Purchased ${bonus?.displayName || code}!`);
        this.bumpUI();
      }
    }

    performPrestige() {
      if (AFK.PrestigeSystem.perform(this.state, this.config, this.gameState)) {
        AFK.SaveManager.save(this.gameState);
        this.gameState.showToast('Prestige complete!');
        this.bumpUI();
      }
    }

    performAscend() {
      if (AFK.AscensionSystem.perform(this.state, this.config, this.gameState)) {
        AFK.SaveManager.save(this.gameState);
        this.gameState.showToast('Ascension complete!');
        this.bumpUI();
      }
    }

    updateSetting(key, val) {
      this.gameState.setSetting(key, val);
      this.bumpUI();
    }

    exportSave() { AFK.SaveManager.exportSave(this.gameState); }

    saveNow() {
      AFK.SaveManager.save(this.gameState);
      this.bumpUI();
      this.gameState.showToast('Game saved!');
    }

    getSaveManagementDisplay() {
      void this._reactiveTick;
      const fmtTime = (ts) => (ts ? new Date(ts).toLocaleString() : '—');
      const meta = AFK.SaveManager.getCurrentMeta();
      const backups = AFK.SaveManager.listBackups();
      return {
        current: meta ? {
          timestamp: meta.timestamp,
          formattedTime: fmtTime(meta.timestamp),
          version: meta.version,
          integrityValid: meta.integrity?.valid !== false,
          integrityWarning: meta.integrity?.valid === false
        } : null,
        backups: backups.map(b => ({
          storageIndex: b.storageIndex,
          timestamp: b.timestamp,
          formattedTime: fmtTime(b.timestamp),
          version: b.version,
          integrityValid: b.integrity?.valid !== false
        })),
        saveVersion: AFK.SaveManager.getSaveVersion(),
        labels: {
          lastSaved: AFK.ConfigManager.getDefaultLabel('saveLastSaved'),
          version: AFK.ConfigManager.getDefaultLabel('saveVersion'),
          noData: AFK.ConfigManager.getDefaultLabel('saveNoData'),
          integrityWarning: AFK.ConfigManager.getDefaultLabel('saveIntegrityWarning'),
          saveNow: AFK.ConfigManager.getDefaultLabel('saveNow'),
          backupHint: AFK.ConfigManager.getDefaultLabel('saveBackupHint'),
          backupsEmpty: AFK.ConfigManager.getDefaultLabel('saveBackupsEmpty'),
          restore: AFK.ConfigManager.getDefaultLabel('saveRestore'),
          revertLatest: AFK.ConfigManager.getDefaultLabel('saveRevertLatest'),
          deleteBackup: AFK.ConfigManager.getDefaultLabel('saveDeleteBackup'),
          deleteAllBackups: AFK.ConfigManager.getDefaultLabel('saveDeleteAllBackups'),
          deleteCurrent: AFK.ConfigManager.getDefaultLabel('saveDeleteCurrent'),
          export: AFK.ConfigManager.getDefaultLabel('saveExport'),
          import: AFK.ConfigManager.getDefaultLabel('saveImport'),
          reset: AFK.ConfigManager.getDefaultLabel('saveReset')
        }
      };
    }

    _applyImportedSave(data) {
      this.gameState.data = this.gameState._mergeSave(data.state);
      this.gameState._bumpModCache();
      AFK.SaveManager.save(this.gameState);
      this.bumpUI();
      this.gameState.showToast('Save imported!');
    }

    async importSave(file) {
      try {
        const data = await AFK.SaveManager.importSave(file);
        if (!data?.state) throw new Error('No valid state');
        if (data.contentId && data.contentId !== this.contentId) {
          const target = AFK.ConfigManager.getAvailableGames().find(g => g.id === data.contentId);
          const name = target?.displayName || data.contentId;
          if (!confirm(`This save belongs to "${name}". Switch to that game and import?`)) return;
          await this.switchContent(data.contentId);
        }
        const integrityNote = data._integrity?.valid === false
          ? '\n\nWarning: imported save failed checksum verification.'
          : '';
        if (!confirm(`Import this save? It will overwrite your current progress.${integrityNote}`)) return;
        this._applyImportedSave(data);
      } catch (e) {
        console.error('Import failed:', e);
        this.gameState.showToast('Import failed!');
      }
    }

    restoreBackup(storageIndex) {
      const display = this.getSaveManagementDisplay();
      const entry = display.backups.find(b => b.storageIndex === storageIndex);
      if (!entry) return;
      if (!confirm(`Restore backup from ${entry.formattedTime}? Current progress will be replaced.`)) return;
      try {
        AFK.SaveManager.restoreBackup(storageIndex);
        location.reload();
      } catch (e) {
        console.error('Restore failed:', e);
        this.gameState.showToast('Restore failed!');
      }
    }

    revertToLatestBackup() {
      const display = this.getSaveManagementDisplay();
      if (!display.backups.length) {
        this.gameState.showToast('No backups available');
        return;
      }
      this.restoreBackup(display.backups[0].storageIndex);
    }

    deleteBackup(storageIndex) {
      const display = this.getSaveManagementDisplay();
      const entry = display.backups.find(b => b.storageIndex === storageIndex);
      if (!entry) return;
      if (!confirm(`Delete backup from ${entry.formattedTime}?`)) return;
      if (AFK.SaveManager.deleteBackup(storageIndex)) {
        this.bumpUI();
        this.gameState.showToast('Backup deleted');
      }
    }

    deleteAllBackups() {
      if (!confirm('Delete all rolling backups? Your current save will not be affected.')) return;
      AFK.SaveManager.deleteAllBackups();
      this.bumpUI();
      this.gameState.showToast('All backups deleted');
    }

    deleteCurrentSave() {
      if (!confirm('Delete the current save? The game will restart from scratch. Rolling backups are kept.')) return;
      AFK.SaveManager.clear();
      location.reload();
    }

    resetGame() {
      if (!confirm('Reset all progress? This deletes your save and cannot be undone.')) return;
      AFK.EventBus.emit(AFK.EVENTS.GAME_RESET, {});
      AFK.SaveManager.clearAll();
      location.reload();
    }

    dismissOfflineModal() { this.offlineModal = null; }

    setSpeed(mult) { this.gameLoop.setSpeedMultiplier(mult); }

    devAddResources() {
      const primary = AFK.ConfigManager.getPrimaryResource();
      const amount = this.config.framework.devTools.resourceGrantAmount;
      this.gameState.addResource(primary.codeName, amount, 'dev');
      this.bumpUI();
    }

    devForceEvent() {
      AFK.EventSystem.forceEvent(this.state, this.config, this.gameState, 'solarFlare');
      this.bumpUI();
    }

    devExportState() {
      console.log('Game state snapshot:', JSON.parse(JSON.stringify(this.gameState.toJSON())));
      this.gameState.showToast('State logged to console');
    }

    getGameSelectorDisplay() {
      void this._reactiveTick;
      const games = AFK.ConfigManager.getAvailableGames().map(g => ({
        ...g,
        active: g.id === this.contentId,
        hasSave: AFK.SaveManager.hasSaveForContent(g.id)
      }));
      return {
        games,
        currentGame: AFK.ConfigManager.getCurrentManifest()
      };
    }

    async switchContent(contentId) {
      if (!contentId || contentId === this.contentId) {
        this.setTab('gameSelector');
        return;
      }
      const target = AFK.ConfigManager.getAvailableGames().find(g => g.id === contentId);
      if (!target) return;

      AFK.SaveManager.save(this.gameState);
      this.gameLoop.stop();

      AFK.setSelectedContentId(contentId);
      const config = await AFK.loadAllConfigs(contentId);
      const saved = AFK.SaveManager.load();

      this.config = config;
      this.contentId = contentId;
      this.gameState = new AFK.GameState(config, saved?.state);
      this.gameLoop = new AFK.GameLoop(this.gameState, config);

      const manifest = AFK.ConfigManager.getCurrentManifest();
      if (typeof document !== 'undefined' && manifest?.displayName) {
        document.title = manifest.displayName;
      }

      this.offlineModal = null;
      this.gameState.state.ui.activeTab = 'generators';
      this.gameLoop.start();
      this.bumpUI();
      this.gameState.showToast(`Now playing: ${manifest?.displayName || contentId}`);
    }
  }

  async function bootstrap() {
    if (!window.AFK || !window.AFK_UI) {
      throw new Error('Game bundles not loaded. Ensure config-bundle.js, afk-engine.bundle.js, and afk-ui.bundle.js are included before main.js.');
    }

    const contentId = AFK.getSelectedContentId();
    const config = await AFK.loadAllConfigs(contentId);
    const saved = AFK.SaveManager.load();
    const gameState = new AFK.GameState(config, saved?.state);
    const gameLoop = new AFK.GameLoop(gameState, config);
    const game = reactive(new GameFacade(config, gameState, gameLoop, contentId));

    const manifest = AFK.ConfigManager.getCurrentManifest();
    if (manifest?.displayName) document.title = manifest.displayName;

    if (saved?._integrity?.valid === false) {
      gameState.showToast('Save integrity warning — data may be corrupted');
    }

    if (saved?.timestamp) {
      const offline = gameLoop.applyOfflineProgress(saved.timestamp);
      if (offline?.showModal) game.offlineModal = offline;
    }

    const flushSave = () => { AFK.SaveManager.save(gameState); };
    window.addEventListener('beforeunload', flushSave);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flushSave();
    });

    AFK.EventBus.on(AFK.EVENTS.GAME_TICK, () => {
      game.bumpUI();
      game._checkStagnationHint();
    });
    AFK.EventBus.on(AFK.EVENTS.RESOURCE_GAINED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.GENERATOR_PURCHASED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.ACHIEVEMENT_UNLOCKED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.ITEM_ACQUIRED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.ITEM_DROPPED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.ITEM_EQUIPPED, () => game.bumpUI());

    if (gameState.state.settings.devMode) game._updateFormulaInspector();

    gameLoop.start();
    AFK.EventBus.emit(AFK.EVENTS.GAME_LOADED, {});

    window.__AFK_GAME__ = game;
    window.__AFK_TEST__ = {
      ready: true,
      game,
      getContentId: () => game.contentId,
      getState: () => JSON.parse(JSON.stringify(gameState.toJSON())),
      getPrimary: () => {
        const p = AFK.ConfigManager.getPrimaryResource();
        return game.state.resources[p.codeName]?.quantity || 0;
      },
      getPrimaryCode: () => AFK.ConfigManager.getPrimaryResource()?.codeName,
      tap: () => { game.onTap(); return game.getTapGain(); },
      addPrimary: (amount = 1000) => {
        const code = AFK.ConfigManager.getPrimaryResource().codeName;
        gameState.addResource(code, amount, 'test');
        game.bumpUI();
        return game.state.resources[code].quantity;
      },
      buyGenerator: (codeName) => {
        game.onBuyGenerator(codeName);
        return game.state.generators[codeName]?.quantityPurchased || 0;
      },
      firstGeneratorCode: () => config.generators.generators[0]?.codeName,
      setTab: (tabId) => game.setTab(tabId),
      switchContent: (contentId) => game.switchContent(contentId),
      listGames: () => AFK.ConfigManager.getAvailableGames().map(g => g.id),
      clearAllSaves: () => AFK.SaveManager.clearAll(),
      activeTab: () => game.state.ui.activeTab,
      runSelfTest: async () => {
        const results = [];
        const assert = (name, fn) => {
          try {
            fn();
            results.push({ name, ok: true });
          } catch (e) {
            results.push({ name, ok: false, error: String(e.message || e) });
          }
        };
        assert('AFK engine loaded', () => { if (!window.AFK?.GameLoop) throw new Error('missing AFK'); });
        assert('content registry', () => {
          const games = AFK.ConfigManager.getAvailableGames();
          if (games.length < 2) throw new Error('expected 2+ games');
        });
        assert('tap increases primary', () => {
          const before = window.__AFK_TEST__.getPrimary();
          window.__AFK_TEST__.tap();
          if (window.__AFK_TEST__.getPrimary() <= before) throw new Error('tap did not increase primary');
        });
        assert('buy first generator', () => {
          window.__AFK_TEST__.addPrimary(50000);
          const code = window.__AFK_TEST__.firstGeneratorCode();
          const before = game.state.generators[code]?.quantityPurchased || 0;
          window.__AFK_TEST__.buyGenerator(code);
          if ((game.state.generators[code]?.quantityPurchased || 0) <= before) {
            throw new Error(`failed to buy ${code}`);
          }
        });
        window.__AFK_SELFTEST_RESULTS__ = results;
        return results;
      }
    };

    createApp(App, { game }).mount('#app');

    if (new URLSearchParams(window.location.search).get('selftest') === '1') {
      window.__AFK_TEST__.runSelfTest().then(results => {
        const failed = results.filter(r => !r.ok);
        if (failed.length) console.error('Self-test failures:', failed);
        else console.log('Self-test passed:', results.length, 'checks');
      });
    }
  }

  bootstrap().catch(err => {
    document.getElementById('app').innerHTML = `<div style="color:red;padding:2rem">Failed to load: ${err.message}</div>`;
    console.error(err);
  });
}).call(typeof window !== 'undefined' ? window : globalThis);
