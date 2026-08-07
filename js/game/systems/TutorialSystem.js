export const TutorialSystem = {
  getSteps(config) {
    return config.defaults?.tutorial?.steps || [];
  },

  shouldShow(state) {
    return state.settings.showTutorial && !state.meta.tutorial?.completed;
  },

  getActiveStep(state, config) {
    if (!this.shouldShow(state)) return null;
    const steps = this.getSteps(config);
    const index = state.meta.tutorial?.stepIndex ?? 0;
    if (index >= steps.length) return null;
    return { step: steps[index], index, total: steps.length };
  },

  ensureState(state) {
    if (!state.meta.tutorial) {
      state.meta.tutorial = { stepIndex: 0, completed: false };
    }
  },

  initStepTab(state, config, gameFacade) {
    const active = this.getActiveStep(state, config);
    if (active?.step?.targetTab && gameFacade?.setTab) {
      gameFacade.setTab(active.step.targetTab);
    }
  },

  advance(state, config, gameFacade) {
    this.ensureState(state);
    const steps = this.getSteps(config);
    const nextIndex = (state.meta.tutorial.stepIndex ?? 0) + 1;

    if (nextIndex >= steps.length) {
      state.meta.tutorial.completed = true;
      state.meta.tutorial.stepIndex = steps.length;
      return null;
    }

    state.meta.tutorial.stepIndex = nextIndex;
    const next = steps[nextIndex];
    if (next?.targetTab && gameFacade?.setTab) {
      gameFacade.setTab(next.targetTab);
    }
    return next;
  },

  skip(state) {
    this.ensureState(state);
    state.meta.tutorial.completed = true;
  },

  restart(state, config, gameFacade) {
    state.meta.tutorial = { stepIndex: 0, completed: false };
    this.initStepTab(state, config, gameFacade);
  },

  onGameEvent(state, config, eventType, gameFacade) {
    if (!this.shouldShow(state)) return;
    const active = this.getActiveStep(state, config);
    if (!active?.step?.waitEvent || active.step.waitEvent !== eventType) return;
    this.advance(state, config, gameFacade);
  }
};
