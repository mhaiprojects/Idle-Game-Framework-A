import { EventBus, EVENTS } from './EventBus.js';
import { ConfigManager } from './ConfigManager.js';

const SAVE_VERSION = '1.1.0';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

export const SaveManager = {
  load() {
    const fw = ConfigManager.getFramework();
    const key = fw.save.storageKey;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return this.migrate(data);
    } catch (e) {
      console.error('Save load failed:', e);
      return null;
    }
  },

  save(state) {
    const fw = ConfigManager.getFramework();
    const key = fw.save.storageKey;
    const serializable = state.toJSON();
    const payload = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: serializable,
      checksum: ''
    };
    payload.checksum = simpleHash(JSON.stringify(serializable));
    localStorage.setItem(key, JSON.stringify(payload));
    this.rotateBackup(key, payload, fw.save.maxBackups);
    EventBus.emit(EVENTS.GAME_SAVED, payload);
    return payload;
  },

  rotateBackup(key, payload, maxBackups) {
    const backupKey = `${key}_backup`;
    try {
      const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
      backups.push({ timestamp: payload.timestamp, data: payload });
      while (backups.length > maxBackups) backups.shift();
      localStorage.setItem(backupKey, JSON.stringify(backups));
    } catch (_) { /* ignore backup errors */ }
  },

  migrate(data) {
    if (!data) return null;
    const migrated = { ...data, state: data.state ? { ...data.state } : data.state };

    if (!migrated.version) migrated.version = '1.0.0';

    if (migrated.version === '1.0.0') {
      const run = migrated.state?.meta?.prestige?.run;
      if (run?.peakPPSThisRun != null && run.peakPrimaryCurrencyRateThisRun == null) {
        run.peakPrimaryCurrencyRateThisRun = run.peakPPSThisRun;
      }
      migrated.version = '1.1.0';
    }

    if (migrated.version === SAVE_VERSION) return migrated;

    migrated._legacy = migrated._legacy || {};
    migrated._legacy.unknownVersion = migrated.version;
    console.warn('Save version unknown, preserved in _legacy:', migrated.version);
    return migrated;
  },

  exportSave(state) {
    const payload = this.save(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic-time-factory-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          resolve(this.migrate(data));
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  clear() {
    const key = ConfigManager.getFramework().save.storageKey;
    localStorage.removeItem(key);
  }
};
