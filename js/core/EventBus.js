const listeners = new Map();

export const EventBus = {
  on(event, callback) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(callback);
    return () => listeners.get(event)?.delete(callback);
  },

  emit(event, payload) {
    listeners.get(event)?.forEach(cb => {
      try { cb(payload); } catch (e) { console.error(`EventBus error on ${event}:`, e); }
    });
  },

  off(event, callback) {
    listeners.get(event)?.delete(callback);
  },

  clear() {
    listeners.clear();
  }
};

export const EVENTS = {
  GAME_TICK: 'GAME_TICK',
  GAME_LOADED: 'GAME_LOADED',
  GAME_SAVED: 'GAME_SAVED',
  GAME_RESET: 'GAME_RESET',
  RESOURCE_CHANGED: 'RESOURCE_CHANGED',
  RESOURCE_GAINED: 'RESOURCE_GAINED',
  RESOURCE_SPENT: 'RESOURCE_SPENT',
  CLICK_PERFORMED: 'CLICK_PERFORMED',
  TAP_PERFORMED: 'TAP_PERFORMED',
  SKILL_ACTIVATED: 'SKILL_ACTIVATED',
  BOOST_USED: 'BOOST_USED',
  GENERATOR_PURCHASED: 'GENERATOR_PURCHASED',
  UPGRADE_PURCHASED: 'UPGRADE_PURCHASED',
  CHARACTER_ACTIVATED: 'CHARACTER_ACTIVATED',
  ITEM_ACQUIRED: 'ITEM_ACQUIRED',
  ITEM_EQUIPPED: 'ITEM_EQUIPPED',
  ITEM_DROPPED: 'ITEM_DROPPED',
  ARTIFACT_ACQUIRED: 'ARTIFACT_ACQUIRED',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
  RANDOM_EVENT_START: 'RANDOM_EVENT_START',
  RANDOM_EVENT_END: 'RANDOM_EVENT_END',
  PRESTIGE_PERFORMED: 'PRESTIGE_PERFORMED',
  ASCENSION_PERFORMED: 'ASCENSION_PERFORMED',
  MILESTONE_PROGRESS: 'MILESTONE_PROGRESS',
  FEATURE_UNLOCKED: 'FEATURE_UNLOCKED',
  OFFLINE_PROGRESS: 'OFFLINE_PROGRESS',
  NOTIFICATION_SHOWN: 'NOTIFICATION_SHOWN'
};
