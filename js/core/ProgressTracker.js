import { ConfigManager, validateGeneratorChain } from './ConfigManager.js';

function makeChecks() {
  return {
    scaffold: [
      { id: 'index_html', label: 'index.html ES module bootstrap', check: () => true },
      { id: 'content_validator', label: 'scripts/bundle.py content validation', check: () => true },
      { id: 'afk_namespace', label: 'window.AFK engine namespace', check: () => !!window.AFK?.GameLoop },
      { id: 'content_fetch', label: 'Config loaded via fetch from content/', check: () => !!ConfigManager.getAll() }
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
      { id: 'migration', label: 'Save migration v1.4.0', check: () => {
        const m = window.AFK?.SaveManager?.migrate({ version: '1.3.0', state: { meta: { prestige: { run: { peakPPSThisRun: 5, peakPrimaryCurrencyRateThisRun: 5 } } } } });
        return m?.version === '1.4.0' && m.state.meta.prestige.run.peakPPSThisRun === undefined;
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
      { id: 'actionbar', label: 'ActionBar in App shell', check: () => !!document.querySelector('.action-bar') || !!ConfigManager.getFramework()?.ui?.actionBar },
      { id: 'settings', label: 'Settings panel tab', check: () => (ConfigManager.getAll()?.defaults?.tabs || []).some(t => t.id === 'settings') },
      { id: 'sidebar', label: 'Sidebar position in settings', check: () => !!ConfigManager.getFramework()?.ui?.sidebarDefaultPosition },
      { id: 'devtools', label: 'Dev tools speed multipliers', check: () => !!ConfigManager.getFramework()?.devTools?.speedMultipliers },
      { id: 'display_helpers', label: 'ConfigManager display name helpers', check: () =>
        typeof ConfigManager.getResourceDisplayName === 'function'
        && typeof ConfigManager.formatUnlockCondition === 'function'
      },
      { id: 'http_runtime', label: 'ES module runtime (HTTP server required)', check: () => !!window.AFK && typeof window.__AFK_GAME__ !== 'undefined' }
    ]
  };
}

export const ProgressTracker = {
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
