import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'SettingsPanel',
  components: { PanelHeader, CardSection },
  props: { settings: Object },
  emits: ['update-setting', 'export-save', 'import-save', 'reset-game'],
  methods: {
    onImport(e) {
      const file = e.target.files[0];
      if (file) this.$emit('import-save', file);
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
        <div class="section-actions section-actions-start" style="flex-direction:column;align-items:stretch">
          <button class="btn btn-ghost" @click="$emit('export-save')">Export Save</button>
          <label class="btn btn-ghost" style="text-align:center;cursor:pointer">
            Import Save
            <input type="file" accept=".json" style="display:none" @change="onImport" />
          </label>
          <button class="btn btn-danger" @click="$emit('reset-game')">Reset Game</button>
        </div>
      </CardSection>
    </div>
  `
};
