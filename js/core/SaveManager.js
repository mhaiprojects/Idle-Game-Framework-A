import { EventBus, EVENTS } from './EventBus.js';
import { ConfigManager } from './ConfigManager.js';

const SAVE_VERSION = '1.2.0';

const EQUIPMENT_SLOT_MIGRATION = {
  accessory: 'amulet',
  weapon: 'mainHand'
};

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

function storageKey() {
  return ConfigManager.getFramework().save.storageKey;
}

function backupStorageKey() {
  return `${storageKey()}_backup`;
}

function buildPayload(state) {
  const serializable = state.toJSON();
  const payload = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    state: serializable,
    checksum: ''
  };
  payload.checksum = simpleHash(JSON.stringify(serializable));
  return payload;
}

export const SaveManager = {
  getSaveVersion() {
    return SAVE_VERSION;
  },

  verifyPayload(data) {
    if (!data?.state) {
      return { valid: false, reason: 'missing_state' };
    }
    if (!data.checksum) {
      return { valid: true, skipped: true };
    }
    const expected = simpleHash(JSON.stringify(data.state));
    if (expected === data.checksum) {
      return { valid: true };
    }
    return { valid: false, reason: 'checksum_mismatch' };
  },

  load() {
    const key = storageKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const data = this.migrate(parsed);
      if (!data) return null;
      data._integrity = this.verifyPayload(data);
      return data;
    } catch (e) {
      console.error('Save load failed:', e);
      return null;
    }
  },

  save(state, { rotateBackup = false } = {}) {
    const key = storageKey();
    const fw = ConfigManager.getFramework();
    const payload = buildPayload(state);
    localStorage.setItem(key, JSON.stringify(payload));
    if (rotateBackup) {
      this.rotateBackup(key, payload, fw.save.maxBackups);
    }
    EventBus.emit(EVENTS.GAME_SAVED, payload);
    return payload;
  },

  saveWithBackup(state) {
    return this.save(state, { rotateBackup: true });
  },

  rotateBackup(key, payload, maxBackups) {
    const backupKey = `${key}_backup`;
    try {
      const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
      backups.push({
        id: `${payload.timestamp}-${simpleHash(String(payload.timestamp))}`,
        timestamp: payload.timestamp,
        version: payload.version,
        data: payload
      });
      while (backups.length > maxBackups) backups.shift();
      localStorage.setItem(backupKey, JSON.stringify(backups));
    } catch (_) { /* ignore backup errors */ }
  },

  getCurrentMeta() {
    const key = storageKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return {
        timestamp: parsed.timestamp,
        version: parsed.version,
        integrity: this.verifyPayload(parsed)
      };
    } catch (_) {
      return null;
    }
  },

  listBackups() {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      return backups.map((entry, index) => ({
        index,
        id: entry.id || String(entry.timestamp),
        timestamp: entry.timestamp,
        version: entry.data?.version || entry.version || 'unknown',
        integrity: entry.data ? this.verifyPayload(entry.data) : { valid: false, reason: 'missing_data' }
      })).reverse();
    } catch (_) {
      return [];
    }
  },

  getBackup(index) {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      return backups[index] || null;
    } catch (_) {
      return null;
    }
  },

  restoreBackup(index) {
    const entry = this.getBackup(index);
    if (!entry?.data) {
      throw new Error('Backup not found');
    }
    const migrated = this.migrate(entry.data);
    if (!migrated?.state) {
      throw new Error('Backup has no valid state');
    }
    const integrity = this.verifyPayload(migrated);
    if (!integrity.valid && !integrity.skipped) {
      throw new Error('Backup failed integrity check');
    }
    localStorage.setItem(storageKey(), JSON.stringify(migrated));
    return migrated;
  },

  deleteBackup(index) {
    try {
      const backups = JSON.parse(localStorage.getItem(backupStorageKey()) || '[]');
      if (index < 0 || index >= backups.length) return false;
      backups.splice(index, 1);
      localStorage.setItem(backupStorageKey(), JSON.stringify(backups));
      return true;
    } catch (_) {
      return false;
    }
  },

  deleteAllBackups() {
    localStorage.removeItem(backupStorageKey());
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

    if (migrated.version === '1.1.0') {
      const chars = migrated.state?.characters;
      if (chars) {
        for (const cs of Object.values(chars)) {
          if (!cs?.equipment) continue;
          const next = {};
          for (const [slot, code] of Object.entries(cs.equipment)) {
            if (!code) continue;
            next[EQUIPMENT_SLOT_MIGRATION[slot] || slot] = code;
          }
          cs.equipment = next;
        }
      }
      migrated.version = '1.2.0';
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
          const parsed = JSON.parse(reader.result);
          const migrated = this.migrate(parsed);
          if (!migrated?.state) {
            reject(new Error('Import file has no valid game state'));
            return;
          }
          const integrity = this.verifyPayload(migrated);
          migrated._integrity = integrity;
          resolve(migrated);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  writeMainSlot(data) {
    localStorage.setItem(storageKey(), JSON.stringify(data));
  },

  clear() {
    localStorage.removeItem(storageKey());
  },

  clearAll() {
    this.clear();
    this.deleteAllBackups();
  }
};
