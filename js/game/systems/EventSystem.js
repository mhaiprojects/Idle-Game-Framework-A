import { EventBus, EVENTS } from '../../core/EventBus.js';
import { ConfigManager } from '../../core/ConfigManager.js';
import { ModifierSystem } from '../ModifierSystem.js';

export const EventSystem = {
  _nextEventTime: null,

  init(state, config) {
    this._scheduleNext(state, config);
  },

  tick(state, config, deltaSeconds, gameState) {
    if (!ConfigManager.isFeatureUnlocked('systems:randomEvents', state)) return;

    const now = Date.now();
    state.activeEvents = (state.activeEvents || []).filter(e => {
      if (e.expiresAt <= now) {
        EventBus.emit(EVENTS.RANDOM_EVENT_END, { event: e.codeName });
        ModifierSystem.invalidate();
        return false;
      }
      return true;
    });

    if (state.activeEvents.length > 0) return;

    if (!this._nextEventTime) this._scheduleNext(state, config);
    if (Date.now() < this._nextEventTime) return;

    const events = config.events.events;
    const evt = events[Math.floor(Math.random() * events.length)];
    const expiresAt = Date.now() + evt.duration * 1000;
    state.activeEvents.push({ codeName: evt.codeName, effect: evt.effect, expiresAt, displayName: evt.displayName, icon: evt.icon });
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    gameState.showToast(`${evt.icon} ${evt.displayName}!`);
    EventBus.emit(EVENTS.RANDOM_EVENT_START, { event: evt.codeName });
    this._scheduleNext(state, config);
  },

  _scheduleNext(state, config) {
    const events = config.events.events;
    if (!events.length) return;
    const evt = events[0];
    const interval = (evt.minInterval + Math.random() * (evt.maxInterval - evt.minInterval)) * 1000;
    this._nextEventTime = Date.now() + interval;
  },

  forceEvent(state, config, gameState, codeName) {
    const evt = config.events.events.find(e => e.codeName === codeName);
    if (!evt) return;
    const expiresAt = Date.now() + evt.duration * 1000;
    state.activeEvents.push({ codeName: evt.codeName, effect: evt.effect, expiresAt, displayName: evt.displayName, icon: evt.icon });
    ModifierSystem.invalidate();
    gameState._bumpModCache();
    EventBus.emit(EVENTS.RANDOM_EVENT_START, { event: evt.codeName });
  }
};
