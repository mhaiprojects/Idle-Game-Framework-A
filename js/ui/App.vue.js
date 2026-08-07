import GameSelectorPanel from './GameSelectorPanel.vue.js';
import ResourceBar from './ResourceBar.vue.js';
import GeneratorPanel from './GeneratorPanel.vue.js';
import UpgradePanel from './UpgradePanel.vue.js';
import CharacterPanel from './CharacterPanel.vue.js';
import InventoryPanel from './InventoryPanel.vue.js';
import ArtifactPanel from './ArtifactPanel.vue.js';
import AchievementPanel from './AchievementPanel.vue.js';
import AscensionPanel from './AscensionPanel.vue.js';
import TranscendencePanel from './TranscendencePanel.vue.js';
import ParagonPanel from './ParagonPanel.vue.js';
import SettingsPanel from './SettingsPanel.vue.js';
import StatsPanel from './StatsPanel.vue.js';
import ProgressPanel from './ProgressPanel.vue.js';
import ActionBar from './ActionBar.vue.js';
import Toast from './components/Toast.vue.js';
import EventBanner from './components/EventBanner.vue.js';
import UnlockModal from './components/UnlockModal.vue.js';
import InfoModal from './components/InfoModal.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';
import MilestoneCelebration from './components/MilestoneCelebration.vue.js';
import TutorialOverlay from './components/TutorialOverlay.vue.js';
import ShareCodeModal from './components/ShareCodeModal.vue.js';

export default {
  name: 'App',
  components: {
    GameSelectorPanel, ResourceBar, GeneratorPanel, UpgradePanel, CharacterPanel,
    InventoryPanel, ArtifactPanel, AchievementPanel, AscensionPanel, TranscendencePanel, ParagonPanel,
    SettingsPanel, StatsPanel, ProgressPanel, ActionBar, Toast, EventBanner,
    UnlockModal, InfoModal, CardSection, PanelHeader, MilestoneCelebration, TutorialOverlay, ShareCodeModal
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
      return this.config?.defaults?.tabs || [];
    },
    engineTabs() {
      return [{ id: 'gameSelector', icon: '🎮', label: 'Games' }];
    },
    tabs() {
      return [...this.engineTabs, ...this.allTabs.filter(t => !t.devOnly || this.state.settings.devMode)];
    },
    gameSelectorData() {
      return this.game.getGameSelectorDisplay();
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
    transcendenceData() {
      return this.game.getTranscendenceDisplay();
    },
    paragonData() {
      return this.game.getParagonDisplay();
    },
    shareModal() {
      return this.game.shareModal;
    },
    tabBadges() {
      return this.game.getTabBadges();
    },
    milestoneCelebration() {
      return this.game.milestoneCelebration;
    },
    tutorialDisplay() {
      return this.game.getTutorialDisplay();
    },
    automationSettings() {
      return this.game.getAutomationSettings();
    },
    tutorialHighlightTap() {
      const t = this.tutorialDisplay;
      return t?.step?.id === 'tap';
    },
    ascensionTierIcon() {
      return this.game.getAscensionTierIcon();
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
    },
    saveManagement() {
      return this.game.getSaveManagementDisplay();
    },
    uiTick() {
      return this.game._reactiveTick;
    }
  },
  methods: {
    isTabUnlocked(tab) {
      if (tab.id === 'gameSelector') return true;
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
    onSelectGame(contentId) { this.game.switchContent(contentId); },
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
    onTranscend() { this.game.performTranscendence(); },
    onBuyTranscendenceUpgrade(code) { this.game.buyTranscendenceUpgrade(code); },
    onBuyParagonLevel() { this.game.buyParagonLevel(); },
    dismissMilestone() { this.game.dismissMilestone(); },
    openShareExport() { this.game.openShareExport(); },
    openShareImport() { this.game.openShareImport(); },
    closeShareModal() { this.game.closeShareModal(); },
    copyShareCode() { this.game.copyShareCode(); },
    importShareCode(code) { this.game.importShareCode(code); },
    advanceTutorial() { this.game.advanceTutorial(); },
    skipTutorial() { this.game.skipTutorial(); },
    restartTutorial() { this.game.restartTutorial(); },
    onUpdateSetting(key, val) { this.game.updateSetting(key, val); },
    onExportSave() { this.game.exportSave(); },
    onImportSave(file) { this.game.importSave(file); },
    onSaveNow() { this.game.saveNow(); },
    onRestoreBackup(index) { this.game.restoreBackup(index); },
    onDeleteBackup(index) { this.game.deleteBackup(index); },
    onDeleteAllBackups() { this.game.deleteAllBackups(); },
    onDeleteCurrentSave() { this.game.deleteCurrentSave(); },
    onRevertLatestBackup() { this.game.revertToLatestBackup(); },
    onResetGame() { this.game.resetGame(); },
    resolveItem(code) {
      return this.game.getItemDisplay(code);
    },
    formatEquipEffect(effect) {
      return this.describeEffectShort(effect) || this.game.describeEffect(effect);
    },
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
        :primary-icon="primaryIcon" :ascension-icon="ascensionTierIcon" :deltas="resourceDeltas"
        :get-resource-label="game.getResourceLabel.bind(game)" :format-number="formatNumber" />
      <EventBanner :events="eventBannerItems" />
      <div class="main-layout">
        <div class="content-area">
          <GameSelectorPanel v-if="state.ui.activeTab === 'gameSelector'"
            :games="gameSelectorData.games"
            :current-game="gameSelectorData.currentGame"
            @select-game="onSelectGame" />
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
            :game-state="state"
            :ui-tick="uiTick"
            :resolve-item="resolveItem"
            :format-effect="formatEquipEffect"
            @toggle="onToggleCharacter" @equip="onEquip" @unequip="onUnequip"
            @more-info="onMoreInfo" />
          <InventoryPanel v-if="state.ui.activeTab === 'inventory'"
            :items="inventoryItems" :inventory="state.inventory"
            :characters="characters" :equipable-items="equipableItems"
            :describe-effect-short="describeEffectShort"
            @use-boost="onUseBoost" @more-info="onMoreInfo" />
          <ArtifactPanel v-if="state.ui.activeTab === 'artifacts'" :artifacts="artifacts"
            @more-info="onMoreInfo" />
          <AchievementPanel v-if="state.ui.activeTab === 'achievements'" :achievements="achievements"
            @more-info="onMoreInfo" />
          <AscensionPanel v-if="state.ui.activeTab === 'ascension'" v-bind="ascensionData"
            :format-number="formatNumber" :primary-currency-label="primaryCurrencyLabel"
            :show-end-game-banner="ascensionData.maxTierReached && transcendenceData.enabled"
            @prestige="onPrestige" @ascend="onAscend" @buy-bonus="onBuyBonus"
            @more-info="onMoreInfo" @go-transcendence="onTabClick({ id: 'transcendence', feature: 'tab:transcendence' })" />
          <TranscendencePanel v-if="state.ui.activeTab === 'transcendence'" v-bind="transcendenceData"
            :format-number="formatNumber"
            @transcend="onTranscend" @buy-upgrade="onBuyTranscendenceUpgrade"
            @more-info="onMoreInfo" />
          <ParagonPanel v-if="state.ui.activeTab === 'paragon'" :paragon="paragonData"
            :format-number="formatNumber" @buy-level="onBuyParagonLevel" />
          <StatsPanel v-if="state.ui.activeTab === 'stats'"
            :stats="statsData" :primary-breakdown="primaryBreakdown"
            :primary-currency-label="primaryCurrencyLabel"
            :get-generator-label="game.getGeneratorLabel.bind(game)"
            :format-number="formatNumber" :active-events="eventBannerItems"
            :synergies="statsData.synergies" />
          <SettingsPanel v-if="state.ui.activeTab === 'settings'"
            :settings="state.settings"
            :save-management="saveManagement"
            :automation-settings="automationSettings"
            @update-setting="onUpdateSetting"
            @restart-tutorial="restartTutorial"
            @export-share="openShareExport"
            @import-share="openShareImport"
            @export-save="onExportSave"
            @import-save="onImportSave"
            @save-now="onSaveNow"
            @restore-backup="onRestoreBackup"
            @delete-backup="onDeleteBackup"
            @delete-all-backups="onDeleteAllBackups"
            @delete-current-save="onDeleteCurrentSave"
            @revert-latest-backup="onRevertLatestBackup"
            @reset-game="onResetGame" />
          <ProgressPanel v-if="state.ui.activeTab === 'progress'" :progress="progressData" />
          <div v-if="state.settings.devMode && state.ui.activeTab !== 'progress'" class="dev-tools panel">
            <PanelHeader panel-key="devTools" />
            <CardSection section-key="speedControls" level="panel" :first="true">
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                <button v-for="s in config.framework.devTools.speedMultipliers" :key="s"
                  class="btn btn-ghost" @click="game.setSpeed(s)">{{ s }}×</button>
                <button class="btn btn-ghost" @click="game.devAddResources()">+1000 Shards</button>
                <button class="btn btn-ghost" @click="game.devForceEvent()">Force Event</button>
                <button class="btn btn-ghost" @click="game.devExportState()">Log State</button>
              </div>
            </CardSection>
            <CardSection v-if="formulaInspector" section-key="formulaInspector" level="panel">
              <div style="font-size:0.75rem;background:var(--color-bg-card);padding:0.5rem;border-radius:6px">
                <div>Tap gain: {{ formatNumber(formulaInspector.tapGain) }}</div>
                <div>{{ primaryCurrencyLabel }} rate: {{ formatNumber(formulaInspector.primaryRate) }}/s</div>
                <div>Tap %: {{ formulaInspector.tapPercent }}</div>
              </div>
            </CardSection>
          </div>
        </div>
        <nav class="tab-sidebar">
          <button v-for="tab in tabs" :key="tab.id"
            class="tab-btn" :class="{ active: state.ui.activeTab === tab.id, locked: !isTabUnlocked(tab), 'has-badge': tabBadges[tab.id] }"
            @click="onTabClick(tab)" :title="tab.label">
            {{ tab.icon }}
            <span v-if="tabBadges[tab.id]" class="tab-badge"></span>
            <span v-if="!isTabUnlocked(tab)" class="tab-lock" @click="onTabLockClick(tab, $event)">🔒</span>
          </button>
        </nav>
      </div>
      <ActionBar :tap-gain-formatted="tapGainFormatted" :primary-icon="primaryIcon"
        :skills="skills" :boosts="boosts" :highlight-tap="tutorialHighlightTap"
        @tap="onTap" @activate-skill="onActivateSkill" @use-boost="onUseBoost" />
      <Toast :toasts="state.ui.toasts" />
      <UnlockModal v-if="unlockModal" :info="unlockModal" @close="closeUnlockModal" />
      <InfoModal v-if="infoModal" :info="infoModal" :format-number="formatNumber" @close="closeInfoModal" />
      <MilestoneCelebration :milestone="milestoneCelebration" @dismiss="dismissMilestone" />
      <TutorialOverlay v-if="tutorialDisplay"
        :step="tutorialDisplay.step"
        :step-index="tutorialDisplay.index"
        :total-steps="tutorialDisplay.total"
        @next="advanceTutorial" @skip="skipTutorial" />
      <ShareCodeModal v-if="shareModal" :mode="shareModal.mode"
        :share-code="shareModal.shareCode" :qr-url="shareModal.qrUrl"
        @close="closeShareModal" @copy="copyShareCode" @import-code="importShareCode" />
      <div v-if="offlineModal" class="modal-overlay" @click.self="dismissOffline">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Welcome Back!</h3>
          <CardSection section-key="timeAway" :first="true">
            <p class="section-text">You were away for {{ Math.floor(offlineModal.elapsed) }}s</p>
          </CardSection>
          <CardSection section-key="offlineGains">
            <div v-for="(amt, res) in offlineModal.gains" :key="res" class="section-text">
              {{ game.getResourceMeta(res).icon }} {{ game.getResourceLabel(res) }}: +{{ formatNumber(amt) }}
            </div>
          </CardSection>
          <button class="btn btn-primary" style="margin-top:1rem" @click="dismissOffline">Collect</button>
        </div>
      </div>
    </div>
  `
};
