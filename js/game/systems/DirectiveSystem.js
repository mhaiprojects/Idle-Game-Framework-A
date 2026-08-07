import { ConfigManager } from '../../core/ConfigManager.js';
import { FormulaEngine } from '../FormulaEngine.js';
import { RunTracker } from './RunTracker.js';

function getDayKey() {
  const d = new Date();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
}

function seededShuffle(items, seedStr) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
    seed |= 0;
  }
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function formatDirectiveDescription(template, req, config, formatNumber) {
  const fmt = formatNumber || (n => String(n));
  if (!template) return '';
  const amount = req.amount ?? req.min ?? 0;
  let label = fmt(amount);
  if (req.resource) {
    label = `${fmt(amount)} ${ConfigManager.getResourceDisplayName(req.resource)}`;
  } else if (req.type === 'prestigeWithinSeconds') {
    label = String(Math.round(amount / 60));
  } else if (req.type === 'primaryRateReached') {
    label = `${fmt(amount)}/s`;
  }
  return template.replace(/\{amount\}/g, label);
}

export const DirectiveSystem = {
  isEnabled(config) {
    return config.transcendence?.directives?.pool?.length > 0;
  },

  ensureDailyDirectives(state, config) {
    if (!this.isEnabled(config)) return;
    const dayKey = getDayKey();
    const store = state.meta.transcendence.directives ||= {
      dayKey: '',
      active: [],
      bonusReady: false,
      completedToday: false
    };

    if (store.dayKey === dayKey && store.active?.length) return;

    const pool = config.transcendence.directives.pool;
    const count = Math.min(config.transcendence.directives.dailyCount || 3, pool.length);
    const picked = seededShuffle(pool, dayKey).slice(0, count);

    store.dayKey = dayKey;
    store.active = picked.map(d => ({
      codeName: d.codeName,
      completed: false,
      completedAt: null
    }));
    store.bonusReady = false;
    store.completedToday = false;
  },

  getProgress(req, state, config, mods) {
    RunTracker.ensurePrestigeRun(state, config);
    const run = state.meta.prestige.run;

    switch (req.type) {
      case 'resourceRunEarned':
        return run.resourcesEarnedThisRun?.[req.resource] || 0;
      case 'tapsThisRun':
        return run.tapsThisRun || 0;
      case 'generatorPurchasesRun':
        return run.generatorPurchasesThisRun || 0;
      case 'primaryRateReached':
        return FormulaEngine.calculatePrimaryCurrencyRate(state, config, mods);
      case 'prestigeWithinSeconds':
        return run.lastPrestigeElapsedSeconds ?? Infinity;
      default:
        return 0;
    }
  },

  isRequirementMet(req, state, config, mods) {
    const current = this.getProgress(req, state, config, mods);
    const target = req.amount ?? req.min ?? 0;
    if (req.type === 'prestigeWithinSeconds') {
      return current <= target && current !== Infinity;
    }
    return current >= target;
  },

  checkAll(state, config, gameState) {
    if (!this.isEnabled(config)) return;
    this.ensureDailyDirectives(state, config);

    const store = state.meta.transcendence.directives;
    const pool = config.transcendence.directives.pool;
    const mods = gameState.getMods();
    let changed = false;

    for (const entry of store.active) {
      if (entry.completed) continue;
      const def = pool.find(d => d.codeName === entry.codeName);
      if (!def) continue;
      if (this.isRequirementMet(def.requirement, state, config, mods)) {
        entry.completed = true;
        entry.completedAt = Date.now();
        changed = true;
        gameState.showToast(`${def.icon} Directive complete: ${def.displayName}`);
      }
    }

    const allDone = store.active.length > 0 && store.active.every(e => e.completed);
    if (allDone && !store.completedToday) {
      store.completedToday = true;
      store.bonusReady = true;
      changed = true;
      gameState.showToast('🌟 All daily directives complete! +25% Cosmic Insight on next Transcendence');
    }

    return changed;
  },

  onPrestigePerformed(state, config, gameState) {
    if (!this.isEnabled(config)) return;
    RunTracker.ensurePrestigeRun(state, config);
    state.meta.prestige.run.lastPrestigeElapsedSeconds = RunTracker.getRunElapsedSeconds(state);
    if (gameState) this.checkAll(state, config, gameState);
  },

  getDirectiveBonusMultiplier(state, config) {
    if (!this.isEnabled(config)) return 1;
    const store = state.meta.transcendence?.directives;
    if (!store?.bonusReady) return 1;
    return config.transcendence.directives.bonusMultiplier || 1;
  },

  consumeBonus(state) {
    const store = state.meta.transcendence?.directives;
    if (!store?.bonusReady) return;
    store.bonusReady = false;
  },

  getDisplay(state, config, formatNumber, mods) {
    if (!this.isEnabled(config)) {
      return { enabled: false, directives: [], bonusReady: false, allCompleted: false };
    }

    this.ensureDailyDirectives(state, config);
    const fmt = formatNumber || (n => String(n));
    const store = state.meta.transcendence.directives;
    const pool = config.transcendence.directives.pool;
    const modList = mods || [];

    const directives = store.active.map(entry => {
      const def = pool.find(d => d.codeName === entry.codeName);
      if (!def) return null;
      const req = def.requirement;
      const target = req.amount ?? req.min ?? 0;
      const current = entry.completed
        ? target
        : this.getProgress(req, state, config, modList);
      const progress = req.type === 'prestigeWithinSeconds'
        ? (entry.completed ? 1 : 0)
        : (target > 0 ? Math.min(1, current / target) : 1);

      return {
        codeName: def.codeName,
        displayName: def.displayName,
        description: formatDirectiveDescription(def.description, req, config, fmt),
        icon: def.icon,
        completed: entry.completed,
        progress,
        met: entry.completed,
        label: entry.completed
          ? 'Complete!'
          : req.type === 'prestigeWithinSeconds'
            ? `Prestige within ${Math.round(target / 60)} min (${Math.round(RunTracker.getRunElapsedSeconds(state) / 60)} min elapsed)`
            : `${fmt(current)} / ${fmt(target)}`
      };
    }).filter(Boolean);

    return {
      enabled: true,
      dayKey: store.dayKey,
      directives,
      bonusReady: store.bonusReady,
      allCompleted: store.completedToday,
      bonusPercent: Math.round(((config.transcendence.directives.bonusMultiplier || 1) - 1) * 100)
    };
  }
};
