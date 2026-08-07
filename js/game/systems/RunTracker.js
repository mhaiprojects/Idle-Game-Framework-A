export function initPrestigeRun(state, config) {
  const run = {
    resourcesEarnedThisRun: {},
    peakPrimaryCurrencyRateThisRun: 0,
    startedAt: Date.now(),
    tapsThisRun: 0,
    generatorPurchasesThisRun: 0
  };
  for (const r of config.resources.resources) {
    run.resourcesEarnedThisRun[r.codeName] = 0;
  }
  state.meta.prestige.run = run;
}

export function ensurePrestigeRun(state, config) {
  if (!state.meta.prestige.run?.startedAt) {
    initPrestigeRun(state, config);
  }
  if (state.meta.prestige.run.tapsThisRun == null) state.meta.prestige.run.tapsThisRun = 0;
  if (state.meta.prestige.run.generatorPurchasesThisRun == null) {
    state.meta.prestige.run.generatorPurchasesThisRun = 0;
  }
}

export const RunTracker = {
  initPrestigeRun,
  ensurePrestigeRun,

  onTap(state, config) {
    ensurePrestigeRun(state, config);
    state.meta.prestige.run.tapsThisRun++;
  },

  onGeneratorPurchased(state, config, qty = 1) {
    ensurePrestigeRun(state, config);
    state.meta.prestige.run.generatorPurchasesThisRun += qty;
  },

  getRunElapsedSeconds(state) {
    const startedAt = state.meta.prestige.run?.startedAt;
    if (!startedAt) return 0;
    return Math.max(0, (Date.now() - startedAt) / 1000);
  }
};
