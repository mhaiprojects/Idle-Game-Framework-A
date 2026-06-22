import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'SettingsPanel',
  components: { PanelHeader, CardSection },
  props: {
    settings: Object,
    saveManagement: Object
  },
  emits: [
    'update-setting', 'export-save', 'import-save', 'reset-game',
    'save-now', 'restore-backup', 'delete-backup', 'delete-all-backups',
    'delete-current-save', 'revert-latest-backup'
  ],
  methods: {
    onImport(e) {
      const file = e.target.files[0];
      if (file) this.$emit('import-save', file);
      e.target.value = '';
    },
    formatLabel(template, vars) {
      if (!template) return '';
      return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="settings" />
      <CardSection section-key="display" level="panel" :first="true">
        <div class="settings-row">
          <span>Sidebar Position</span>
          <div class="toggle-group">
            <button class="btn btn-ghost" :class="{ 'btn-primary': settings.sidebarPosition === 'left' }" @click="$emit('update-setting', 'sidebarPosition', 'left')">Left</button>
            <button class="btn btn-ghost" :class="{ 'btn-primary': settings.sidebarPosition === 'right' }" @click="$emit('update-setting', 'sidebarPosition', 'right')">Right</button>
          </div>
        </div>
        <div class="settings-row">
          <span>Sound</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'soundEnabled', !settings.soundEnabled)">{{ settings.soundEnabled ? 'On' : 'Off' }}</button>
        </div>
        <div class="settings-row">
          <span>Notifications</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'notificationsEnabled', !settings.notificationsEnabled)">{{ settings.notificationsEnabled ? 'On' : 'Off' }}</button>
        </div>
        <div class="settings-row">
          <span>Tutorial</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'showTutorial', !settings.showTutorial)">{{ settings.showTutorial ? 'On' : 'Off' }}</button>
        </div>
      </CardSection>
      <CardSection section-key="saveData" level="panel">
        <div v-if="saveManagement?.current" class="save-meta">
          <div class="save-meta-row">{{ formatLabel(saveManagement.labels.lastSaved, { time: saveManagement.current.formattedTime }) }}</div>
          <div class="save-meta-row">{{ formatLabel(saveManagement.labels.version, { version: saveManagement.current.version }) }}</div>
          <div v-if="saveManagement.current.integrityWarning" class="save-warning">{{ saveManagement.labels.integrityWarning }}</div>
        </div>
        <div v-else class="hint-text">{{ saveManagement?.labels?.noData }}</div>
        <div class="section-actions section-actions-start save-actions">
          <button class="btn btn-primary" @click="$emit('save-now')">{{ saveManagement?.labels?.saveNow }}</button>
          <button class="btn btn-ghost" @click="$emit('export-save')">{{ saveManagement?.labels?.export }}</button>
          <label class="btn btn-ghost save-import-label">
            {{ saveManagement?.labels?.import }}
            <input type="file" accept=".json" class="save-file-input" @change="onImport" />
          </label>
        </div>
      </CardSection>
      <CardSection section-key="saveBackups" level="panel">
        <p class="hint-text save-backup-hint">{{ saveManagement?.labels?.backupHint }}</p>
        <div v-if="saveManagement?.backups?.length" class="save-backup-list">
          <div v-for="backup in saveManagement.backups" :key="backup.storageIndex" class="save-backup-row">
            <div class="save-backup-info">
              <div class="save-backup-time">{{ backup.formattedTime }}</div>
              <div class="save-backup-meta">
                v{{ backup.version }}
                <span v-if="!backup.integrityValid" class="save-warning-inline">⚠</span>
              </div>
            </div>
            <div class="save-backup-actions">
              <button class="btn btn-ghost btn-sm" @click="$emit('restore-backup', backup.storageIndex)">{{ saveManagement.labels.restore }}</button>
              <button class="btn btn-ghost btn-sm btn-danger-ghost" @click="$emit('delete-backup', backup.storageIndex)">{{ saveManagement.labels.deleteBackup }}</button>
            </div>
          </div>
        </div>
        <div v-else class="hint-text">{{ saveManagement?.labels?.backupsEmpty }}</div>
        <div class="section-actions section-actions-start save-actions">
          <button
            class="btn btn-accent"
            :disabled="!saveManagement?.backups?.length"
            @click="$emit('revert-latest-backup')"
          >{{ saveManagement?.labels?.revertLatest }}</button>
          <button
            class="btn btn-ghost"
            :disabled="!saveManagement?.backups?.length"
            @click="$emit('delete-all-backups')"
          >{{ saveManagement?.labels?.deleteAllBackups }}</button>
        </div>
      </CardSection>
      <CardSection section-key="warning" level="panel">
        <div class="section-actions section-actions-start save-actions">
          <button class="btn btn-ghost btn-danger-ghost" @click="$emit('delete-current-save')">{{ saveManagement?.labels?.deleteCurrent }}</button>
          <button class="btn btn-danger" @click="$emit('reset-game')">{{ saveManagement?.labels?.reset }}</button>
        </div>
      </CardSection>
    </div>
  `
};
