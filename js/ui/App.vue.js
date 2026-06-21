import ResourceBar from './ResourceBar.vue.js';
import GeneratorPanel from './GeneratorPanel.vue.js';
import UpgradePanel from './UpgradePanel.vue.js';
import CharacterPanel from './CharacterPanel.vue.js';
import InventoryPanel from './InventoryPanel.vue.js';
import ArtifactPanel from './ArtifactPanel.vue.js';
import AchievementPanel from './AchievementPanel.vue.js';
import AscensionPanel from './AscensionPanel.vue.js';
import SettingsPanel from './SettingsPanel.vue.js';
import StatsPanel from './StatsPanel.vue.js';
import ProgressPanel from './ProgressPanel.vue.js';
import ActionBar from './ActionBar.vue.js';
import Toast from './components/Toast.vue.js';
import EventBanner from './components/EventBanner.vue.js';
import UnlockModal from './components/UnlockModal.vue.js';
import InfoModal from './components/InfoModal.vue.js';

export default {
  name: 'App',
  components: {
    ResourceBar, GeneratorPanel, UpgradePanel, CharacterPanel,
    InventoryPanel, ArtifactPanel, AchievementPanel, AscensionPanel,
    SettingsPanel, StatsPanel, ProgressPanel, ActionBar, Toast, EventBanner,
    UnlockModal, InfoModal
  },
  props: {
    game: Object
  },
  data() {
    return { unlockModal: null, infoModal: null };
  },
  computed: {
    state() { return this.game.state; },
    config() { return this.game.config; },
    formatNumber() {
      return (v) => this.game.formatNumber(v);
    },
    sidebarClass() {
      return this.state.settings.sidebarPosition === 'left' ? 'sidebar-left' : 'sidebar-right';
    },
    allTabs() {
      return [
        { id: 'generators', icon: '⚙️', label: 'Generators', feature: 'tab:generators' },
        { id: 'upgrades', icon: '⬆️', label: 'Upgrades', feature: 'tab:upgrades' },
        { id: 'characters', icon: '👤', label: 'Characters', feature: 'tab:characters' },
        { id: 'inventory', icon: '🎒', label: 'Inventory', feature: 'tab:inventory' },
        { id: 'artifacts', icon: '🔮', label: 'Artifacts', feature: 'tab:artifacts' },
        { id: 'achievements', icon: '🏆', label: 'Achievements', feature: 'tab:achievements' },
        { id: 'ascension', icon: '🔄', label: 'Ascension', feature: 'tab:ascension' },
        { id: 'stats', icon: '📊', label: 'Stats', feature: 'tab:stats' },
        { id: 'settings', icon: '🛠️', label: 'Settings', feature: 'tab:settings' },
        { id: 'progress', icon: '🔧', label: 'Progress', devOnly: true }
      ];
    },
    tabs() {
      return this.allTabs.filter(t => !t.devOnly || this.state.settings.devMode);
    },
    resourceBarItems() {
      return this.game.getResourceBarItems();
    },
    resourceDeltas() {
      void this.game._reactiveTick;
      return this.state.ui.resourceDeltas || [];
    },
    primaryCurrencyLabel() {
      return this.game.getPrimaryCurrencyLabel();
    },
    primaryCurrencyRate() {
      return this.game.getPrimaryCurrencyRateFormatted();
    },
    primaryBreakdown() {
      return this.game.getPrimaryCurrencyBreakdown();
    },
    generators() {
      return this.game.getGeneratorDisplay();
    },
    upgrades() {
      return this.game.getUpgradeDisplay();
    },
    bestUpgradeCode() {
      return this.state.ui.bestUpgradeCode;
    },
    characters() {
      return this.game.getCharacterDisplay();
    },
    achievements() {
      return this.game.getAchievementDisplay();
    },
    inventoryItems() {
      return this.game.getInventoryDisplay();
    },
    equipableItems() {
      return this.game.getEquipableItems();
    },
    equipmentSlots() {
      return this.game.getEquipmentSlots();
    },
    equipmentSlotLayout() {
      return this.game.getEquipmentSlotLayout();
    },
    artifacts() {
      return this.game.getArtifactDisplay();
    },
    ascensionData() {
      return this.game.getAscensionDisplay();
    },
    statsData() {
      return this.game.getStatsDisplay();
    },
    progressData() {
      return this.game.getProgress();
    },
    skills() {
      return this.game.getSkillSlots();
    },
    boosts() {
      return this.game.getBoostSlots();
    },
    tapGainFormatted() {
      return this.formatNumber(this.game.getTapGain());
    },
    primaryIcon() {
      return this.game.getPrimaryIcon();
    },
    eventBannerItems() {
      return this.game.getEventBannerItems();
    },
    formulaInspector() {
      return this.state.ui.formulaInspector;
    },
    offlineModal() {
      return this.game.offlineModal;
    }
  },
  methods: {
    isTabUnlocked(tab) {
      if (tab.devOnly) return this.state.settings.devMode;
      if (!tab.feature) return true;
      return this.game.isFeatureUnlocked(tab.feature);
    },
    showUnlockModal(tab) {
      this.unlockModal = this.game.getFeatureUnlockInfo(tab.feature);
      this.unlockModal.title = this.unlockModal.title || tab.label;
    },
    closeUnlockModal() {
      this.unlockModal = null;
    },
    showInfoModal(type, codeName) {
      const info = this.game.getEntityInfo(type, codeName);
      if (info) this.infoModal = info;
    },
    closeInfoModal() {
      this.infoModal = null;
    },
    onTabClick(tab) {
      if (this.isTabUnlocked(tab)) {
        this.game.setTab(tab.id);
      } else {
        this.showUnlockModal(tab);
      }
    },
    onTabLockClick(tab, event) {
      event.stopPropagation();
      this.showUnlockModal(tab);
    },
    onMoreInfo(type, codeName) {
      this.showInfoModal(type, codeName);
    },
    onTap() { this.game.onTap(); },
    onBuyGenerator(code) { this.game.onBuyGenerator(code); },
    onBuyUpgrade(code) { this.game.onBuyUpgrade(code); },
    onMultiplierChange(val) { this.game.setPurchaseMultiplier(val); },
    onToggleCharacter(code) { this.game.toggleCharacter(code); },
    onActivateSkill(code) { this.game.activateSkill(code); },
    onUseBoost(code) { this.game.useBoost(code); },
    onEquip(char, slot, item) { this.game.equipItem(char, slot, item); },
    onUnequip(char, slot) { this.game.unequipItem(char, slot); },
    onPrestige() { this.game.performPrestige(); },
    onAscend() { this.game.performAscend(); },
    onBuyBonus(code) { this.game.buyPrestigeBonus(code); },
    onUpdateSetting(key, val) { this.game.updateSetting(key, val); },
    onExportSave() { this.game.exportSave(); },
    onImportSave(file) { this.game.importSave(file); },
    onResetGame() { this.game.resetGame(); },
    dismissOffline() { this.game.dismissOfflineModal(); },
    formatCostEntries(cost) {
      return this.game.formatCostEntries(cost);
    },
    getResourceMeta(code) {
      return this.game.getResourceMeta(code);
    },
    describeEffectShort(effect) {
      return this.game.describeEffectShort(effect);
    }
  },
  template: `
    <div class="app-container" :class="sidebarClass">
      <ResourceBar :resources="resourceBarItems" :primary-currency-rate="primaryCurrencyRate"
        :primary-icon="primaryIcon" :deltas="resourceDeltas"
        :get-resource-label="game.getResourceLabel.bind(game)" :format-number="formatNumber" />
      <EventBanner :events="eventBannerItems" />
      <div class="main-layout">
        <div class="content-area">
          <GeneratorPanel v-if="state.ui.activeTab === 'generators'"
            :generators="generators" :multiplier="state.ui.purchaseMultiplier"
            :multiplier-options="config.framework.ui.purchaseMultipliers"
            :format-number="formatNumber"
            :primary-currency-label="primaryCurrencyLabel"
            @buy="onBuyGenerator" @multiplier-change="onMultiplierChange"
            @more-info="onMoreInfo" />
          <UpgradePanel v-if="state.ui.activeTab === 'upgrades'"
            :upgrades="upgrades" :format-number="formatNumber"
            :get-resource-meta="getResourceMeta"
            :best-upgrade-code="bestUpgradeCode"
            :primary-currency-label="primaryCurrencyLabel"
            @buy="onBuyUpgrade" @more-info="onMoreInfo" />
          <CharacterPanel v-if="state.ui.activeTab === 'characters'"
            :characters="characters" :max-active="config.framework.characters.maxActive"
            :active-count="game.getActiveCharacterCount()"
            :equipment-slot-layout="equipmentSlotLayout"
            :get-equip-slot-items="game.getEquipSlotOptions.bind(game)"
            @toggle="onToggleCharacter" @equip="onEquip" @unequip="onUnequip"
            @more-info="onMoreInfo" />
          <InventoryPanel v-if="state.ui.activeTab === 'inventory'"
            :items="inventoryItems" :inventory="state.inventory"
            :characters="characters" :equipable-items="equipableItems"
            :describe-effect-short="describeEffectShort"
            @use-boost="onUseBoost" @more-info="onMoreInfo" />
          <ArtifactPanel v-if="state.ui.activeTab === 'artifacts'" :artifacts="artifacts"
            @more-info="onMoreInfo" />
          <AchievementPanel v-if="state.ui.activeTab === 'achievements'" :achievements="achievements" />
          <AscensionPanel v-if="state.ui.activeTab === 'ascension'" v-bind="ascensionData"
            :format-number="formatNumber" :primary-currency-label="primaryCurrencyLabel"
            @prestige="onPrestige" @ascend="onAscend" @buy-bonus="onBuyBonus" />
          <StatsPanel v-if="state.ui.activeTab === 'stats'"
            :stats="statsData" :primary-breakdown="primaryBreakdown"
            :primary-currency-label="primaryCurrencyLabel"
            :get-generator-label="game.getGeneratorLabel.bind(game)"
            :format-number="formatNumber" :active-events="eventBannerItems" />
          <SettingsPanel v-if="state.ui.activeTab === 'settings'"
            :settings="state.settings" @update-setting="onUpdateSetting"
            @export-save="onExportSave" @import-save="onImportSave" @reset-game="onResetGame" />
          <ProgressPanel v-if="state.ui.activeTab === 'progress'" :progress="progressData" />
          <div v-if="state.settings.devMode && state.ui.activeTab !== 'progress'" class="dev-tools panel">
            <h3 class="panel-title">Dev Tools</h3>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem">
              <button v-for="s in config.framework.devTools.speedMultipliers" :key="s"
                class="btn btn-ghost" @click="game.setSpeed(s)">{{ s }}×</button>
              <button class="btn btn-ghost" @click="game.devAddResources()">+1000 Shards</button>
              <button class="btn btn-ghost" @click="game.devForceEvent()">Force Event</button>
              <button class="btn btn-ghost" @click="game.devExportState()">Log State</button>
            </div>
            <div v-if="formulaInspector" style="font-size:0.75rem;background:var(--color-bg-card);padding:0.5rem;border-radius:6px">
              <strong>Formula Inspector</strong>
              <div>Tap gain: {{ formatNumber(formulaInspector.tapGain) }}</div>
              <div>{{ primaryCurrencyLabel }} rate: {{ formatNumber(formulaInspector.primaryRate) }}/s</div>
              <div>Tap %: {{ formulaInspector.tapPercent }}</div>
            </div>
          </div>
        </div>
        <nav class="tab-sidebar">
          <button v-for="tab in tabs" :key="tab.id"
            class="tab-btn" :class="{ active: state.ui.activeTab === tab.id, locked: !isTabUnlocked(tab) }"
            @click="onTabClick(tab)" :title="tab.label">
            {{ tab.icon }}
            <span v-if="!isTabUnlocked(tab)" class="tab-lock" @click="onTabLockClick(tab, $event)">🔒</span>
          </button>
        </nav>
      </div>
      <ActionBar :tap-gain-formatted="tapGainFormatted" :primary-icon="primaryIcon"
        :skills="skills" :boosts="boosts"
        @tap="onTap" @activate-skill="onActivateSkill" @use-boost="onUseBoost" />
      <Toast :toasts="state.ui.toasts" />
      <UnlockModal v-if="unlockModal" :info="unlockModal" @close="closeUnlockModal" />
      <InfoModal v-if="infoModal" :info="infoModal" @close="closeInfoModal" />
      <div v-if="offlineModal" class="modal-overlay" @click.self="dismissOffline">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Welcome Back!</h3>
          <p style="font-size:0.85rem;margin-bottom:0.5rem">You were away for {{ Math.floor(offlineModal.elapsed) }}s</p>
          <div v-for="(amt, res) in offlineModal.gains" :key="res" style="font-size:0.8rem">
            {{ game.getResourceMeta(res).icon }} {{ game.getResourceLabel(res) }}: +{{ formatNumber(amt) }}
          </div>
          <button class="btn btn-primary" style="margin-top:1rem" @click="dismissOffline">Collect</button>
        </div>
      </div>
    </div>
  `
};
