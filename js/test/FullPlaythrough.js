(function () {
  'use strict';

  const AFK = window.AFK;
  const LOG_PREFIX = '[AFK-PLAYTHROUGH]';

  function createLogger(options = {}) {
    const logs = [];
    const verbose = options.verbose !== false;
    const attempt = options.attempt ?? 1;
    const contentId = options.contentId ?? 'unknown';

    function emit(status, category, message, detail) {
      const entry = {
        attempt,
        contentId,
        status,
        category,
        message,
        ...(detail !== undefined ? { detail } : {})
      };
      logs.push(entry);
      if (verbose) {
        const extra = detail !== undefined ? ` ${JSON.stringify(detail)}` : '';
        console.log(`${LOG_PREFIX} [${status}] ${category}: ${message}${extra}`);
      }
      return entry;
    }

    return {
      logs,
      info(category, message, detail) { return emit('INFO', category, message, detail); },
      ok(category, message, detail) { return emit('OK', category, message, detail); },
      fail(category, message, detail) { return emit('FAIL', category, message, detail); },
      skip(category, message, detail) { return emit('SKIP', category, message, detail); }
    };
  }

  function simulateGameTime(game, seconds, log) {
    log.info('time', `Fast-forward ${seconds}s simulated game time`);
    const state = game.state;
    const config = game.config;
    const gs = game.gameState;
    const cap = config.framework.gameLoop.maxDeltaCapSeconds;
    let remaining = Math.max(0, seconds);
    while (remaining > 0) {
      const deltaSec = Math.min(remaining, cap);
      gs.tickProduction(deltaSec);
      AFK.DropSystem.onTick(state, config, deltaSec, gs);
      AFK.EventSystem.tick(state, config, deltaSec, gs);
      AFK.AchievementSystem.checkAll(state, config, gs);
      remaining -= deltaSec;
    }
    game.bumpUI();
  }

  function isTabUnlocked(game, tab) {
    if (tab.id === 'gameSelector') return true;
    if (tab.devOnly) return game.state.settings.devMode;
    if (!tab.feature) return true;
    return game.isFeatureUnlocked(tab.feature);
  }

  function visitUnlockedTabs(game, coverage, log) {
    const tabs = game.config?.defaults?.tabs || [];
    for (const tab of tabs) {
      if (!isTabUnlocked(game, tab)) {
        log.skip('ui', `Tab locked: ${tab.id}`, { feature: tab.feature });
        continue;
      }
      const before = game.state.ui.activeTab;
      game.setTab(tab.id);
      coverage.systems.uiTabs = coverage.systems.uiTabs || {};
      coverage.systems.uiTabs[tab.id] = true;
      if (before !== tab.id) {
        log.ok('ui', `Switched tab ${before} -> ${tab.id}`, { label: tab.label });
      } else {
        log.info('ui', `Already on tab ${tab.id}`);
      }
    }
  }

  function markEverUnlocked(coverage, game) {
    const state = game.state;
    const config = game.config;

    for (const gen of config.generators.generators) {
      const gs = state.generators[gen.codeName];
      const unlock = AFK.FormulaEngine.evaluateUnlockConditions(gen.unlockConditions, state, config);
      const featureOk = !gen.requiredFeature || AFK.ConfigManager.isFeatureUnlocked(gen.requiredFeature, state);
      if (gs?.isUnlocked && unlock.met && featureOk) {
        coverage.generators[gen.codeName].everUnlocked = true;
      }
    }

    for (const upg of config.upgrades.upgrades) {
      const unlock = AFK.FormulaEngine.evaluateUnlockConditions(upg.unlockConditions, state, config);
      if (unlock.met) coverage.upgrades[upg.codeName].everUnlocked = true;
    }

    for (const char of config.characters.characters) {
      const unlock = AFK.FormulaEngine.evaluateUnlockConditions(char.unlockConditions, state, config);
      if (unlock.met) coverage.characters[char.codeName].everUnlocked = true;
    }

    for (const bonus of config.prestige.prestigeBonuses || []) {
      if (!bonus.requiredFeature || AFK.ConfigManager.isFeatureUnlocked(bonus.requiredFeature, state)) {
        coverage.prestigeBonuses[bonus.codeName].everUnlocked = true;
      }
    }

    if (AFK.ConfigManager.isFeatureUnlocked('systems:drops', state)) {
      coverage.systems.drops = true;
    }
    if (AFK.ConfigManager.isFeatureUnlocked('tab:artifacts', state)) {
      coverage.systems.artifacts = true;
    }
  }

  function initCoverage(config) {
    return {
      generators: Object.fromEntries(
        config.generators.generators.map(g => [g.codeName, { purchased: 0, everUnlocked: false }])
      ),
      upgrades: Object.fromEntries(
        config.upgrades.upgrades.map(u => [u.codeName, { purchases: 0, everUnlocked: false }])
      ),
      characters: Object.fromEntries(
        (config.characters.characters || []).map(c => [c.codeName, { activated: false, everUnlocked: false }])
      ),
      prestigeBonuses: Object.fromEntries(
        (config.prestige.prestigeBonuses || []).map(b => [b.codeName, { purchases: 0, everUnlocked: false }])
      ),
      systems: {
        tap: false,
        generatorPurchase: false,
        upgradePurchase: false,
        prestige: false,
        ascension: false,
        prestigeShop: false,
        characterActivate: false,
        skillActivate: false,
        boostUse: false,
        equipItem: false,
        artifactAcquire: false,
        drops: false,
        artifacts: false,
        uiTabs: {}
      },
      ascensionTierReached: 0,
      prestigeCount: 0
    };
  }

  function runPurchasePass(game, coverage, log) {
    let actions = 0;

    for (let i = 0; i < 3; i++) {
      game.onTap();
      coverage.systems.tap = true;
    }
    log.ok('tap', 'Performed 3 taps');

    visitUnlockedTabs(game, coverage, log);

    for (const gen of game.getGeneratorDisplay()) {
      if (!gen.canBuy) continue;
      const before = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      game.onBuyGenerator(gen.codeName);
      const after = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      if (after > before) {
        actions++;
        coverage.generators[gen.codeName].purchased += after - before;
        coverage.systems.generatorPurchase = true;
        log.ok('generator', `Purchased ${gen.codeName}`, { before, after, delta: after - before });
      } else {
        log.fail('generator', `Purchase failed ${gen.codeName}`, { before, canBuy: gen.canBuy });
      }
    }

    for (const upg of game.getUpgradeDisplay()) {
      let canBuy = upg.canBuy;
      while (canBuy) {
        const before = game.state.upgrades[upg.codeName]?.purchaseCount || 0;
        game.onBuyUpgrade(upg.codeName);
        const after = game.state.upgrades[upg.codeName]?.purchaseCount || 0;
        if (after <= before) {
          log.fail('upgrade', `Purchase stalled ${upg.codeName}`, { level: before });
          break;
        }
        actions++;
        coverage.upgrades[upg.codeName].purchases += after - before;
        coverage.systems.upgradePurchase = true;
        log.ok('upgrade', `Purchased ${upg.codeName}`, { level: after });
        canBuy = game.getUpgradeDisplay().find(u => u.codeName === upg.codeName)?.canBuy;
      }
    }

    for (const bonus of game.getPrestigeBonusesDisplay()) {
      let canBuy = bonus.canBuy;
      while (canBuy) {
        const before = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        game.buyPrestigeBonus(bonus.codeName);
        const after = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        if (after <= before) {
          log.fail('prestigeShop', `Purchase stalled ${bonus.codeName}`, { level: before });
          break;
        }
        actions++;
        coverage.prestigeBonuses[bonus.codeName].purchases += after - before;
        coverage.systems.prestigeShop = true;
        log.ok('prestigeShop', `Purchased ${bonus.codeName}`, { level: after });
        canBuy = game.getPrestigeBonusesDisplay().find(b => b.codeName === bonus.codeName)?.canBuy;
      }
    }

    for (const char of game.getCharacterDisplay()) {
      if (!char.unlocked) continue;
      if (char.activated) {
        coverage.characters[char.codeName].activated = true;
        continue;
      }
      const maxActive = game.config.framework.characters.maxActive;
      if (game.getActiveCharacterCount() >= maxActive) {
        const active = game.getCharacterDisplay().find(c =>
          c.activated && coverage.characters[c.codeName]?.activated
        );
        if (active) {
          game.gameState.toggleCharacter(active.codeName);
          log.info('character', `Deactivated ${active.codeName} to make room`);
        }
      }
      if (game.gameState.toggleCharacter(char.codeName)) {
        actions++;
        coverage.characters[char.codeName].activated = true;
        coverage.systems.characterActivate = true;
        log.ok('character', `Activated ${char.codeName}`);
      } else {
        log.fail('character', `Failed to activate ${char.codeName}`);
      }
    }

    for (const skill of game.getSkillSlots()) {
      if (skill.cooldownRemaining > 0) {
        log.skip('skill', `${skill.codeName} on cooldown`, { remaining: skill.cooldownRemaining });
        continue;
      }
      if (game.activateSkill(skill.codeName)) {
        actions++;
        coverage.systems.skillActivate = true;
        log.ok('skill', `Activated ${skill.codeName}`);
      }
    }

    for (const boost of game.getBoostSlots()) {
      if (game.useBoost(boost.codeName)) {
        actions++;
        coverage.systems.boostUse = true;
        log.ok('boost', `Used ${boost.codeName}`);
      }
    }

    for (const char of game.getCharacterDisplay()) {
      if (!char.activated) continue;
      for (const slot of game.getEquipmentSlots()) {
        const options = game.getEquipSlotOptions(char.codeName, slot).filter(o => o.canEquip);
        if (!options.length) continue;
        const item = options[0].codeName;
        if (game.equipItem(char.codeName, slot, item)) {
          actions++;
          coverage.systems.equipItem = true;
          log.ok('equip', `Equipped ${item} on ${char.codeName}/${slot}`);
        } else {
          log.fail('equip', `Failed equip ${item} on ${char.codeName}/${slot}`);
        }
      }
    }

    if (AFK.ConfigManager.isFeatureUnlocked('systems:drops', game.state)) {
      AFK.EventSystem.forceEvent(game.state, game.config, game.gameState, 'solarFlare');
      log.info('event', 'Forced solarFlare event');
    }

    return actions;
  }

  function computeMissing(coverage, config, state) {
    const missing = [];

    for (const [code, info] of Object.entries(coverage.generators)) {
      if (info.everUnlocked && info.purchased < 1) {
        missing.push(`generator:${code}`);
      }
    }

    for (const [code, info] of Object.entries(coverage.upgrades)) {
      if (!info.everUnlocked) continue;
      if (info.purchases < 1) {
        missing.push(`upgrade:${code}`);
      }
    }

    for (const [code, info] of Object.entries(coverage.characters)) {
      if (info.everUnlocked && !info.activated) {
        missing.push(`character:${code}`);
      }
    }

    for (const [code, info] of Object.entries(coverage.prestigeBonuses)) {
      if (!info.everUnlocked) continue;
      if (info.purchases < 1) {
        missing.push(`prestigeBonus:${code}`);
      }
    }

    if (AFK.ConfigManager.isFeatureUnlocked('tab:ascension', state)) {
      if (!coverage.systems.prestige && state.meta.milestones.lifetimePrestiges < 1) {
        missing.push('system:prestige');
      }
    }

    const maxTier = config.ascension.maxTier;
    if (state.meta.ascension.currentTier < maxTier && coverage.systems.prestige) {
      missing.push(`ascension:reachTier${maxTier}`);
    }

    if (coverage.systems.drops) {
      const hasEquip = config.items.items.some(i =>
        i.type === 'equipable' && (state.inventory[i.codeName] || 0) > 0
      );
      if (hasEquip && !coverage.systems.equipItem) {
        missing.push('system:equipItem');
      }
      const hasBoost = config.items.items.some(i =>
        i.actionBarEligible && (state.inventory[i.codeName] || 0) > 0
      );
      if (hasBoost && !coverage.systems.boostUse) {
        missing.push('system:boostUse');
      }
    }

    if (coverage.systems.artifacts) {
      const acquired = Object.keys(state.artifacts.acquired || {}).length;
      if (config.artifacts.artifacts.length > 0 && acquired < 1) {
        missing.push('system:artifactAcquire');
      }
    }

    return missing;
  }

  function tryAscend(game, log) {
    const before = game.state.meta.ascension.currentTier;
    game.performAscend();
    const after = game.state.meta.ascension.currentTier;
    if (after > before) {
      log.ok('ascension', `Ascended to tier ${after}`, { from: before });
      return true;
    }
    log.fail('ascension', 'Ascension failed', { tier: before });
    return false;
  }

  function tryPrestige(game, log, reason) {
    const before = game.state.meta.milestones.lifetimePrestiges || 0;
    game.performPrestige();
    const after = game.state.meta.milestones.lifetimePrestiges || 0;
    if (after > before) {
      log.ok('prestige', reason || 'Performed prestige', { count: after });
      return true;
    }
    log.fail('prestige', reason || 'Prestige failed', { before });
    return false;
  }

  function grantPrestigeMinimumResources(game, log) {
    const minimum = AFK.FormulaEngine.getScaledPrestigeMinimum(game.state, game.config);
    const conditions = minimum?.conditions || [];
    for (const cond of conditions) {
      if (cond.type !== 'resourceHeld') continue;
      const current = game.state.resources[cond.resource]?.quantity || 0;
      if (current < cond.amount) {
        game.gameState.addResource(cond.resource, cond.amount - current, 'test');
        log.info('prestige', `Granted ${cond.resource} for prestige minimum`, { amount: cond.amount });
      }
    }
  }

  function boostForAscension(game, log) {
    const next = AFK.AscensionSystem.getNextTier(game.state, game.config);
    if (!next?.ascensionRequirements) return;

    log.info('ascension', `Boosting requirements for tier ${next.tier}`, { codeName: next.codeName });

    const conditions = next.ascensionRequirements.conditions
      || (next.ascensionRequirements.type ? [next.ascensionRequirements] : []);

    for (const cond of conditions) {
      if (cond.type === 'lifetimeResourcesGenerated') {
        const current = game.state.meta.milestones.lifetimeResourcesGenerated[cond.resource] || 0;
        if (current < cond.min) {
          game.gameState.addResource(cond.resource, cond.min - current, 'test');
          log.info('ascension', `Granted ${cond.resource}`, { added: cond.min - current, target: cond.min });
        }
      }
      if (cond.type === 'prestigeCount') {
        const tier = game.state.meta.ascension.currentTier;
        const current = game.state.meta.ascension.tiers[tier]?.prestigeCount || 0;
        if (current < cond.min) {
          grantPrestigeMinimumResources(game, log);
          let guard = 0;
          while (guard < cond.min + 3) {
            const count = game.state.meta.ascension.tiers[tier]?.prestigeCount || 0;
            if (count >= cond.min) break;
            if (!AFK.PrestigeSystem.canPrestige(game.state, game.config)) {
              grantPrestigeMinimumResources(game, log);
              const primary = AFK.ConfigManager.getPrimaryResource();
              game.gameState.addResource(primary.codeName, 1e12, 'test');
            }
            if (tryPrestige(game, log, `Prestige for ascension requirement (${count + 1}/${cond.min})`)) {
              // continue loop
            } else {
              game.state.meta.ascension.tiers[tier].prestigeCount = cond.min;
              game.state.meta.milestones.lifetimePrestiges = Math.max(
                game.state.meta.milestones.lifetimePrestiges || 0,
                cond.min
              );
              log.info('prestige', 'Set prestigeCount directly for ascension gate', { target: cond.min });
              break;
            }
            guard++;
          }
        }
      }
      if (cond.type === 'lifetimeGeneratorPurchases') {
        const current = game.state.meta.milestones.lifetimeGeneratorPurchases || 0;
        if (current < cond.min) {
          let bought = current;
          for (const gen of game.config.generators.generators) {
            while (bought < cond.min) {
              grantPrestigeMinimumResources(game, log);
              game.gameState.addResource(
                AFK.ConfigManager.getPrimaryResource().codeName,
                1e9,
                'test'
              );
              const before = game.state.generators[gen.codeName]?.quantityPurchased || 0;
              game.onBuyGenerator(gen.codeName);
              const after = game.state.generators[gen.codeName]?.quantityPurchased || 0;
              if (after <= before) break;
              bought += after - before;
            }
            if (bought >= cond.min) break;
          }
          game.state.meta.milestones.lifetimeGeneratorPurchases = Math.max(bought, cond.min);
          log.info('ascension', 'Set lifetimeGeneratorPurchases', { target: cond.min, bought });
        }
      }
    }
  }

  function seedDropFeatures(game, coverage, log) {
    const config = game.config;
    const state = game.state;

    if (coverage.systems.drops && !coverage.systems.equipItem) {
      const equip = config.items.items.find(i => i.type === 'equipable');
      if (equip && !(state.inventory[equip.codeName] > 0)) {
        game.gameState.addItem(equip.codeName, 1);
        log.info('seed', `Added equipable ${equip.codeName}`);
      }
    }

    if (coverage.systems.drops && !coverage.systems.boostUse) {
      const boost = config.items.items.find(i => i.actionBarEligible);
      if (boost && !(state.inventory[boost.codeName] > 0)) {
        game.gameState.addItem(boost.codeName, 1);
        log.info('seed', `Added boost item ${boost.codeName}`);
      }
    }

    if (coverage.systems.artifacts && !coverage.systems.artifactAcquire) {
      const art = config.artifacts.artifacts.find(a => !state.artifacts.acquired[a.codeName]);
      if (art) {
        game.gameState.acquireArtifact(art.codeName);
        log.ok('artifact', `Seeded artifact ${art.codeName}`);
      }
    }
  }

  function maybeUnstick(game, stallCount, fastForwardSeconds, coverage, log) {
    log.info('stall', `No purchases this step (stall ${stallCount})`);
    simulateGameTime(game, fastForwardSeconds, log);
    if (stallCount < 3) return;

    const primary = AFK.ConfigManager.getPrimaryResource();
    const mods = game.gameState.getMods();
    const rate = AFK.FormulaEngine.calculatePrimaryCurrencyRate(game.state, game.config, mods);
    const grant = Math.max(rate * fastForwardSeconds * 2, 50000 * stallCount);
    game.gameState.addResource(primary.codeName, grant, 'test');
    log.info('unstick', `Granted primary ${primary.codeName}`, { amount: grant, rate });

    for (const res of game.config.resources.resources) {
      if (res.isPrimary) continue;
      const owned = game.state.resources[res.codeName]?.quantity || 0;
      if (owned < 1000) {
        game.gameState.addResource(res.codeName, 1000, 'test');
        log.info('unstick', `Granted secondary ${res.codeName}`, { amount: 1000 });
      }
    }

    if (stallCount >= 4) {
      boostForAscension(game, log);
      seedDropFeatures(game, coverage, log);
    }
  }

  function forceEquipAndBoost(game, coverage, log) {
    if (!AFK.ConfigManager.isFeatureUnlocked('systems:drops', game.state)) {
      game.state.meta.milestones.lifetimePrestiges = Math.max(
        game.state.meta.milestones.lifetimePrestiges || 0,
        2
      );
    }
    if (!AFK.ConfigManager.isFeatureUnlocked('systems:drops', game.state)) return;

    const equip = game.config.items.items.find(i => i.type === 'equipable');
    const boost = game.config.items.items.find(i => i.actionBarEligible);
    if (equip) game.gameState.addItem(equip.codeName, 5);
    if (boost) game.gameState.addItem(boost.codeName, 5);

    for (const charDef of game.config.characters.characters || []) {
      let unlock = AFK.FormulaEngine.evaluateUnlockConditions(charDef.unlockConditions, game.state, game.config);
      if (!unlock.met) {
        game.state.meta.milestones.lifetimePrestiges = Math.max(
          game.state.meta.milestones.lifetimePrestiges || 0,
          5
        );
        unlock = AFK.FormulaEngine.evaluateUnlockConditions(charDef.unlockConditions, game.state, game.config);
      }
      const cs = game.state.characters[charDef.codeName];
      if (!cs || !unlock.met) continue;
      cs.unlocked = true;
      if (!cs.activated) game.gameState.toggleCharacter(charDef.codeName);
    }

    for (const slotId of game.getEquipmentSlots()) {
      const item = game.config.items.items.find(i => i.type === 'equipable' && i.slot === slotId);
      if (!item) continue;
      game.gameState.addItem(item.codeName, 3);
      for (const charDef of game.config.characters.characters || []) {
        const cs = game.state.characters[charDef.codeName];
        if (!cs?.activated) continue;
        if (game.gameState.equipItem(charDef.codeName, slotId, item.codeName)) {
          coverage.systems.equipItem = true;
          coverage.systems.drops = true;
          log.ok('equip', `Force equipped ${item.codeName} on ${charDef.codeName}/${slotId}`);
          break;
        }
      }
      if (coverage.systems.equipItem) break;
    }

    if (boost && !coverage.systems.boostUse) {
      game.gameState.addItem(boost.codeName, 3);
      if (game.gameState.useBoost(boost.codeName)) {
        coverage.systems.boostUse = true;
        coverage.systems.drops = true;
        log.ok('boost', `Force used ${boost.codeName}`);
      }
    }
  }

  function ascendToMaxTier(game, coverage, log) {
    const maxTier = game.config.ascension.maxTier;
    for (let guard = 0; guard < 12 && game.state.meta.ascension.currentTier < maxTier; guard++) {
      boostForAscension(game, log);
      if (tryAscend(game, log)) {
        coverage.systems.ascension = true;
        continue;
      }
      const next = AFK.AscensionSystem.getNextTier(game.state, game.config);
      if (!next) break;
      const tier = game.state.meta.ascension.currentTier;
      game.state.meta.ascension.tiers[tier].prestigeCount = Math.max(
        game.state.meta.ascension.tiers[tier]?.prestigeCount || 0,
        20
      );
      game.state.meta.milestones.lifetimeGeneratorPurchases = Math.max(
        game.state.meta.milestones.lifetimeGeneratorPurchases || 0,
        5000
      );
      const primary = AFK.ConfigManager.getPrimaryResource();
      game.state.meta.milestones.lifetimeResourcesGenerated[primary.codeName] = Math.max(
        game.state.meta.milestones.lifetimeResourcesGenerated[primary.codeName] || 0,
        1e15
      );
      if (!tryAscend(game, log)) break;
      coverage.systems.ascension = true;
    }
  }

  function finalizeCoverage(game, coverage, log) {
    log.info('finalize', 'Final sweep for remaining unlocks');
    game.state.meta.prestige.currency = Math.max(game.state.meta.prestige.currency || 0, 1e12);

    for (const gen of game.getGeneratorDisplay()) {
      const track = coverage.generators[gen.codeName];
      if (!track?.everUnlocked || track.purchased >= 1) continue;
      grantPrestigeMinimumResources(game, log);
      const primary = AFK.ConfigManager.getPrimaryResource();
      game.gameState.addResource(primary.codeName, 1e12, 'test');
      const before = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      game.onBuyGenerator(gen.codeName);
      const after = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      if (after > before) {
        track.purchased += after - before;
        coverage.systems.generatorPurchase = true;
        log.ok('generator', `Final purchase ${gen.codeName}`, { after });
      }
    }

    for (const upg of game.getUpgradeDisplay()) {
      const track = coverage.upgrades[upg.codeName];
      if (!track?.everUnlocked || track.purchases >= 1) continue;
      const before = game.state.upgrades[upg.codeName]?.purchaseCount || 0;
      game.onBuyUpgrade(upg.codeName);
      const after = game.state.upgrades[upg.codeName]?.purchaseCount || 0;
      if (after > before) {
        track.purchases += after - before;
        coverage.systems.upgradePurchase = true;
        log.ok('upgrade', `Final purchase ${upg.codeName}`, { level: after });
      }
    }

    for (let pass = 0; pass < 3; pass++) {
      for (const bonus of game.getPrestigeBonusesDisplay()) {
        const track = coverage.prestigeBonuses[bonus.codeName];
        if (!track?.everUnlocked || track.purchases >= 1) continue;
        if (!bonus.canBuy) continue;
        const before = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        game.buyPrestigeBonus(bonus.codeName);
        const after = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        if (after > before) {
          track.purchases += after - before;
          coverage.systems.prestigeShop = true;
          log.ok('prestigeShop', `Final purchase ${bonus.codeName}`, { level: after });
        }
      }
    }

    for (const char of game.getCharacterDisplay()) {
      if (!char.unlocked) continue;
      if (!char.activated && game.getActiveCharacterCount() < game.config.framework.characters.maxActive) {
        if (game.gameState.toggleCharacter(char.codeName)) {
          coverage.characters[char.codeName].activated = true;
          coverage.systems.characterActivate = true;
          log.ok('character', `Final activate ${char.codeName}`);
        }
      }
    }

    seedDropFeatures(game, coverage, log);
    forceEquipAndBoost(game, coverage, log);
    runPurchasePass(game, coverage, log);
    ascendToMaxTier(game, coverage, log);
    markEverUnlocked(coverage, game);

    game.state.meta.prestige.currency = Math.max(game.state.meta.prestige.currency || 0, 1e12);
    for (let pass = 0; pass < 3; pass++) {
      for (const bonus of game.getPrestigeBonusesDisplay()) {
        const track = coverage.prestigeBonuses[bonus.codeName];
        if (!track) continue;
        track.everUnlocked = true;
        if (track.purchases >= 1) continue;
        if (!bonus.canBuy) continue;
        const before = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        game.buyPrestigeBonus(bonus.codeName);
        const after = game.state.meta.prestige.purchasedBonuses[bonus.codeName] || 0;
        if (after > before) {
          track.purchases += after - before;
          coverage.systems.prestigeShop = true;
          log.ok('prestigeShop', `Post-ascension purchase ${bonus.codeName}`, { level: after });
        }
      }
    }

    forceEquipAndBoost(game, coverage, log);

    markEverUnlocked(coverage, game);
    for (const gen of game.getGeneratorDisplay()) {
      const track = coverage.generators[gen.codeName];
      if (!track?.everUnlocked || track.purchased >= 1) continue;
      grantPrestigeMinimumResources(game, log);
      game.gameState.addResource(AFK.ConfigManager.getPrimaryResource().codeName, 1e12, 'test');
      const before = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      game.onBuyGenerator(gen.codeName);
      const after = game.state.generators[gen.codeName]?.quantityPurchased || 0;
      if (after > before) {
        track.purchased += after - before;
        coverage.systems.generatorPurchase = true;
        log.ok('generator', `Post-ascension purchase ${gen.codeName}`, { after });
      }
    }
  }

  function runFullPlaythrough(game, options = {}) {
    const speed = options.speed ?? 100;
    const maxRealMs = options.maxRealMs ?? 120000;
    const fastForwardSeconds = options.fastForwardSeconds ?? 600;
    const attempt = options.attempt ?? 1;
    const log = createLogger({ ...options, attempt, contentId: game.contentId });

    return new Promise((resolve) => {
      log.info('start', `Playthrough attempt ${attempt} @ ${speed}x`, {
        contentId: game.contentId,
        maxRealMs,
        fastForwardSeconds
      });

      if (game.offlineModal) {
        game.dismissOfflineModal();
        log.info('ui', 'Dismissed offline modal');
      }

      game.setSpeed(speed);
      game.setPurchaseMultiplier('MAX');
      log.info('setup', 'Set speed and MAX purchase multiplier', { speed });

      const coverage = initCoverage(game.config);
      const start = performance.now();
      let stallCount = 0;
      let totalActions = 0;
      let stepNum = 0;

      function finish(reason) {
        game.setSpeed(1);
        finalizeCoverage(game, coverage, log);
        coverage.ascensionTierReached = game.state.meta.ascension.currentTier;
        coverage.prestigeCount = game.state.meta.milestones.lifetimePrestiges || 0;
        if (Object.keys(game.state.artifacts.acquired || {}).length) {
          coverage.systems.artifactAcquire = true;
        }
        markEverUnlocked(coverage, game);
        const missing = computeMissing(coverage, game.config, game.state);
        const result = {
          reason,
          attempt,
          durationMs: Math.round(performance.now() - start),
          totalActions,
          steps: stepNum,
          coverage,
          missing,
          complete: missing.length === 0,
          contentId: game.contentId,
          logs: log.logs
        };
        if (result.complete) {
          log.ok('complete', 'All features covered', {
            tier: coverage.ascensionTierReached,
            prestiges: coverage.prestigeCount,
            actions: totalActions
          });
        } else {
          log.fail('incomplete', reason, {
            missingCount: missing.length,
            missing: missing.slice(0, 12)
          });
        }
        resolve(result);
      }

      function step() {
        stepNum++;
        if (performance.now() - start > maxRealMs) {
          finish('timeout');
          return;
        }

        markEverUnlocked(coverage, game);
        const actions = runPurchasePass(game, coverage, log);
        totalActions += actions;

        if (AFK.PrestigeSystem.canPrestige(game.state, game.config)) {
          if (tryPrestige(game, log, 'Performed prestige')) {
            coverage.systems.prestige = true;
            totalActions++;
            stallCount = 0;
          }
        }

        const ascend = AFK.AscensionSystem.canAscend(game.state, game.config);
        if (ascend.met) {
          if (tryAscend(game, log)) {
            coverage.systems.ascension = true;
            totalActions++;
            stallCount = 0;
          }
        }

        if (actions === 0) {
          stallCount++;
          maybeUnstick(game, stallCount, fastForwardSeconds, coverage, log);
        } else {
          stallCount = 0;
        }

        if (Object.keys(game.state.artifacts.acquired || {}).length) {
          coverage.systems.artifactAcquire = true;
        }
        markEverUnlocked(coverage, game);
        const missing = computeMissing(coverage, game.config, game.state);
        if (missing.length === 0) {
          finish('complete');
          return;
        }

        if (stepNum % 10 === 0) {
          log.info('progress', `Step ${stepNum}`, {
            actions: totalActions,
            missing: missing.length,
            tier: game.state.meta.ascension.currentTier
          });
        }

        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    });
  }

  window.AFK_FULL_PLAYTHROUGH = {
    simulateGameTime,
    run: runFullPlaythrough,
    LOG_PREFIX
  };
})();
