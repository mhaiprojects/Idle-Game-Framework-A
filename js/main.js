(function () {
  'use strict';

  const { createApp, reactive } = Vue;
  const AFK = window.AFK;
  const App = window.AFK_UI.App;

  class GameFacade {
    constructor(config, gameState, gameLoop) {
      this.config = config;
      this.gameState = gameState;
      this.gameLoop = gameLoop;
      this.offlineModal = null;
      this._reactiveTick = 0;
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
      return AFK.ConfigManager.getPrimaryResource()?.displayName || 'Primary currency';
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
      return AFK.ConfigManager.getPrimaryResource()?.icon || '⏱️';
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
          )
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
        const cost = AFK.FormulaEngine.calculateUpgradeCost(u, us.purchaseCount);
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
          )
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
          )
        };
      });
    }

    getAchievementDisplay() {
      void this._reactiveTick;
      return this.config.achievements.achievements.map(a => ({
        ...a,
        unlocked: this.state.achievements[a.codeName]?.unlocked
      }));
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

    getEquipmentSlots() {
      return (this.config.framework.equipmentSlots || []).map(s => s.id);
    }

    getEquipmentSlotLayout() {
      return this.config.framework.equipmentSlots || [];
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
      switch (type) {
        case 'item': {
          const item = this.config.items.items.find(i => i.codeName === codeName);
          if (!item) return null;
          const qty = this.state.inventory[item.codeName] || 0;
          const sections = [
            { heading: 'Description', body: item.description || 'No description.' }
          ];
          if (item.effect) {
            sections.push({ heading: 'Provides', body: this.describeEffect(item.effect) });
          }
          sections.push({ heading: 'Owned', body: `${qty}` });
          if (item.type === 'consumable') {
            sections.push({
              heading: 'Usage',
              body: item.actionBarEligible
                ? 'Use from inventory or the action bar when owned.'
                : 'Use from inventory when owned.'
            });
          } else if (item.type === 'equipable') {
            const slotLabel = AFK.ConfigManager.getEquipmentSlotLabel(item.slot);
            const wearer = Object.entries(this.state.characters).find(([, cs]) =>
              Object.values(cs.equipment || {}).includes(item.codeName)
            );
            const charDef = wearer
              ? this.config.characters.characters.find(c => c.codeName === wearer[0])
              : null;
            sections.push({
              heading: 'Equipment slot',
              body: `${slotLabel || item.slot} · one character at a time${charDef ? ` · worn by ${charDef.icon} ${charDef.displayName}` : ''}`
            });
          }
          return { title: item.displayName, icon: item.icon, sections };
        }
        case 'character': {
          const char = this.config.characters.characters.find(c => c.codeName === codeName);
          if (!char) return null;
          const cs = this.state.characters[codeName];
          const sections = [{ heading: 'Description', body: char.description || 'No description.' }];
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
          sections.push({ heading: 'Benefits (when active)', body: benefits.length ? benefits.join(' ') : 'No passive bonuses.' });
          if (char.activeSkill) {
            sections.push({
              heading: 'Active skill — ' + char.activeSkill.displayName,
              body: `${this.describeEffect(char.activeSkill.effect)} Cooldown: ${char.activeSkill.cooldownSeconds}s.`
            });
          }
          if (cs?.equipment && Object.keys(cs.equipment).length) {
            const equipped = Object.entries(cs.equipment).filter(([, v]) => v).map(([slot, code]) => {
              const item = this.config.items.items.find(i => i.codeName === code);
              const slotLabel = AFK.ConfigManager.getEquipmentSlotLabel(slot);
              return `${slotLabel}: ${item?.icon || ''} ${item?.displayName || code}`;
            });
            sections.push({ heading: 'Currently equipped', body: equipped.join(' · ') || 'Nothing equipped.' });
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
          const produces = (gen.produces || []).map(p => {
            const res = AFK.ConfigManager.getResource(p.resource);
            return `${res?.icon || ''} ${res?.displayName || p.resource}: ${p.amount}/s per owned (${p.role})`;
          }).join(' · ');
          const sections = [
            { heading: 'Description', body: gen.description || 'No description.' },
            { heading: 'Production', body: produces || 'No production defined.' },
            { heading: 'Owned', body: `${gs?.quantityPurchased || 0} units` }
          ];
          const requirements = AFK.ConfigManager.getCombinedUnlockRequirements(
            { unlockConditions: gen.unlockConditions, requiredFeature: gen.requiredFeature },
            this.state,
            fmt
          );
          return {
            title: gen.displayName,
            icon: gen.icon,
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
              { heading: 'Description', body: upg.description || 'No description.' },
              { heading: 'Effect', body: this.describeEffect(upg.effect) },
              { heading: 'Cost', body: `${fmt(upg.cost)} ${res?.icon || ''} ${res?.displayName || upg.costResource} per level` },
              { heading: 'Progress', body: `Level ${us?.purchaseCount || 0}${upg.maxPurchases != null ? ' / ' + upg.maxPurchases : ''}` }
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
              { heading: 'Description', body: art.description || 'No description.' },
              { heading: 'Rarity', body: art.rarity || 'Unknown' },
              { heading: 'Permanent bonus', body: this.describeEffect(art.effect).replace(/ while equipped or active\.?$/, ' permanently once collected.') }
            ]
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
      return (this.config.prestige.prestigeBonuses || []).map(bonus => {
        const level = this.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        const locked = bonus.requiredFeature && !this.isFeatureUnlocked(bonus.requiredFeature);
        const cost = bonus.cost * (level + 1);
        const maxed = level >= bonus.maxLevel;
        const canBuy = !locked && !maxed && this.state.meta.prestige.currency >= cost;
        return {
          ...bonus,
          level,
          canBuy,
          locked,
          lockReason: locked ? AFK.ConfigManager.getFeatureDisplayName(bonus.requiredFeature) : ''
        };
      });
    }

    getAscensionDisplay() {
      void this._reactiveTick;
      const tier = this.state.meta.ascension.currentTier;
      const next = AFK.AscensionSystem.getNextTier(this.state, this.config);
      const ascendCheck = AFK.AscensionSystem.canAscend(this.state, this.config);
      const milestones = AFK.AscensionSystem.getMilestoneProgress(this.state, this.config).map(m => ({
        label: this._milestoneLabel(m.condition),
        progress: m.progress,
        met: m.met
      }));
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
        milestones,
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

    _milestoneLabel(cond) {
      return AFK.ConfigManager.formatUnlockConditionDetail(
        cond, this.state, (v) => this.formatNumber(v)
      ).label;
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
        this.gameState.showToast('Prestige complete!');
        this.bumpUI();
      }
    }

    performAscend() {
      if (AFK.AscensionSystem.perform(this.state, this.config, this.gameState)) {
        this.gameState.showToast('Ascension complete!');
        this.bumpUI();
      }
    }

    updateSetting(key, val) {
      this.gameState.setSetting(key, val);
      this.bumpUI();
    }

    exportSave() { AFK.SaveManager.exportSave(this.gameState); }

    async importSave(file) {
      try {
        const data = await AFK.SaveManager.importSave(file);
        if (data?.state) {
          this.gameState.data = this.gameState._mergeSave(data.state);
          this.gameState._bumpModCache();
          AFK.SaveManager.save(this.gameState);
          this.bumpUI();
          this.gameState.showToast('Save imported!');
        }
      } catch (e) {
        this.gameState.showToast('Import failed!');
      }
    }

    resetGame() {
      if (confirm('Reset all progress? This cannot be undone.')) {
        AFK.SaveManager.clear();
        location.reload();
      }
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
  }

  async function bootstrap() {
    if (!window.AFK || !window.AFK_UI) {
      throw new Error('Game bundles not loaded. Ensure config-bundle.js, afk-engine.bundle.js, and afk-ui.bundle.js are included before main.js.');
    }

    const config = await AFK.loadAllConfigs();
    const saved = AFK.SaveManager.load();
    const gameState = new AFK.GameState(config, saved?.state);
    if (new URLSearchParams(window.location.search).get('debug') === '1') {
      gameState.state.settings.devMode = true;
    }
    const gameLoop = new AFK.GameLoop(gameState, config);
    const game = reactive(new GameFacade(config, gameState, gameLoop));

    if (saved?.timestamp) {
      const offline = gameLoop.applyOfflineProgress(saved.timestamp);
      if (offline) game.offlineModal = offline;
    }

    AFK.EventBus.on(AFK.EVENTS.GAME_TICK, () => {
      game.bumpUI();
      game._checkStagnationHint();
    });
    AFK.EventBus.on(AFK.EVENTS.RESOURCE_GAINED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.GENERATOR_PURCHASED, () => game.bumpUI());
    AFK.EventBus.on(AFK.EVENTS.ACHIEVEMENT_UNLOCKED, () => game.bumpUI());

    if (gameState.state.settings.devMode) game._updateFormulaInspector();

    gameLoop.start();
    AFK.EventBus.emit(AFK.EVENTS.GAME_LOADED, {});

    createApp(App, { game }).mount('#app');
  }

  bootstrap().catch(err => {
    document.getElementById('app').innerHTML = `<div style="color:red;padding:2rem">Failed to load: ${err.message}</div>`;
    console.error(err);
  });
}).call(typeof window !== 'undefined' ? window : globalThis);
