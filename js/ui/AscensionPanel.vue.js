import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'AscensionPanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, PanelHeader, CardSection },
  props: {
    tierName: String, currentTier: Number, prestigeCount: Number,
    lifetimePrestiges: Number, projectedGain: Number, canPrestige: Boolean,
    canAscend: Boolean, nextTierName: String, prestigeRequirements: Array,
    ascensionRequirements: Array, prestigeLost: Array, prestigeKept: Array,
    ascendLost: Array, ascendKept: Array, featurePreview: Array,
    prestigeCurrency: Number, formatNumber: Function, maxTierReached: Boolean,
    difficulty: Object, primaryCurrencyLabel: String, prestigeBonuses: Array
  },
  emits: ['prestige', 'ascend', 'buy-bonus', 'more-info'],
  data() { return { showPrestigeModal: false, showAscendModal: false }; },
  template: `
    <div class="panel">
      <PanelHeader panel-key="ascension" />

      <CardSection section-key="overview" level="panel" :first="true">
        <div class="stats-grid">
          <div class="stat-box">{{ tierName }}</div>
          <div class="stat-box">Prestiges: {{ prestigeCount }}</div>
          <div class="stat-box">Lifetime: {{ lifetimePrestiges }}</div>
          <div class="stat-box">Shards: {{ formatNumber(prestigeCurrency) }}</div>
        </div>
      </CardSection>

      <CardSection section-key="prestigeSoftReset" level="panel">
        <div class="card">
          <div class="card-header">
            <span class="card-name">{{ prestigeSectionTitle }}</span>
            <MoreInfoButton @click="$emit('more-info', 'prestige', 'softReset')" />
          </div>
          <UnlockRequirementsList
            :requirements="prestigeRequirements"
            section-key="prestigeRequirements"
            :first="true" />
          <CardSection section-key="rewards">
            <p class="section-text">Gain: +{{ projectedGain }} Prestige Shards</p>
            <p class="section-text muted">Cost mult: {{ difficulty?.costMultiplier?.toFixed(2) }}× | {{ primaryCurrencyLabel }}: {{ difficulty?.primaryCurrencyMultiplier?.toFixed(2) }}×</p>
          </CardSection>
          <div class="section-actions section-actions-start">
            <button class="btn btn-accent" :disabled="!canPrestige" @click="showPrestigeModal = true">Prestige</button>
          </div>
        </div>
      </CardSection>

      <CardSection section-key="prestigeShop" level="panel">
        <div v-for="bonus in prestigeBonuses" :key="bonus.codeName" class="card nested-card">
          <div class="card-header">
            <span class="card-icon">{{ bonus.icon }}</span>
            <span class="card-name">{{ bonus.displayName }}</span>
            <span class="card-owned">Lv {{ bonus.level }}/{{ bonus.maxLevel }}</span>
            <MoreInfoButton @click="$emit('more-info', 'prestigeBonus', bonus.codeName)" />
          </div>
          <p class="card-description">{{ bonus.description }}</p>
          <UnlockRequirementsList v-if="bonus.locked && bonus.unlockRequirements?.length"
            :requirements="bonus.unlockRequirements"
            section-key="unlockRequirements"
            :first="true" />
          <CardSection v-else-if="bonus.levelProgress" section-key="levelProgress" :first="true">
            <ResourceProgressList :entries="[bonus.levelProgress]" />
          </CardSection>
          <CardSection v-if="!bonus.locked && !bonus.maxed" section-key="purchaseRequirements"
            :first="bonus.locked || !bonus.levelProgress">
            <ResourceProgressList :entries="bonus.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary btn-sm" :disabled="!bonus.canBuy" @click="$emit('buy-bonus', bonus.codeName)">Buy</button>
            </div>
          </CardSection>
          <CardSection v-else-if="bonus.maxed" section-key="status" :first="!bonus.levelProgress">
            <p class="hint-text" style="margin-bottom:0">{{ maxLevelLabel }}</p>
          </CardSection>
        </div>
      </CardSection>

      <CardSection v-if="!maxTierReached" section-key="ascension" level="panel">
        <div class="card">
          <div class="card-header">
            <span class="card-name">{{ ascendTitle }}</span>
            <MoreInfoButton @click="$emit('more-info', 'ascension', 'next')" />
          </div>
          <UnlockRequirementsList
            :requirements="ascensionRequirements"
            section-key="ascensionRequirements"
            :first="true" />
          <CardSection v-if="featurePreview.length" section-key="unlocksPreview">
            <p class="section-text accent">{{ featurePreview.join(', ') }}</p>
          </CardSection>
          <div class="section-actions section-actions-start">
            <button class="btn btn-primary" :disabled="!canAscend" @click="showAscendModal = true">Ascend</button>
          </div>
        </div>
      </CardSection>

      <div v-if="showPrestigeModal" class="modal-overlay" @click.self="showPrestigeModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Confirm Prestige</h3>
          <UnlockRequirementsList :requirements="prestigeRequirements" section-key="prestigeRequirements" :first="true" />
          <div class="modal-columns">
            <CardSection section-key="lost" :first="true" class="lost">
              <div v-for="l in prestigeLost" :key="l" class="section-text">• {{ l }}</div>
            </CardSection>
            <CardSection section-key="kept" :first="true" class="kept">
              <div v-for="k in prestigeKept" :key="k" class="section-text">• {{ k }}</div>
            </CardSection>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showPrestigeModal = false">Cancel</button>
            <button class="btn btn-accent" @click="$emit('prestige'); showPrestigeModal = false">Prestige (+{{ projectedGain }})</button>
          </div>
        </div>
      </div>

      <div v-if="showAscendModal" class="modal-overlay" @click.self="showAscendModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Ascend to {{ nextTierName }}</h3>
          <CardSection section-key="warning" :first="true">
            <p class="section-text danger">This cannot be undone.</p>
          </CardSection>
          <UnlockRequirementsList :requirements="ascensionRequirements" section-key="ascensionRequirements" />
          <div class="modal-columns">
            <CardSection section-key="lost" class="lost">
              <div v-for="l in ascendLost" :key="l" class="section-text">• {{ l }}</div>
            </CardSection>
            <CardSection section-key="kept" class="kept">
              <div v-for="k in ascendKept" :key="k" class="section-text">• {{ k }}</div>
            </CardSection>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showAscendModal = false">Cancel</button>
            <button class="btn btn-danger" @click="$emit('ascend'); showAscendModal = false">Ascend</button>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    prestigeSectionTitle() {
      return AFK?.ConfigManager?.getSection?.('prestigeSoftReset')?.title || 'Prestige';
    },
    ascendTitle() {
      return `Ascend to ${this.nextTierName}`;
    },
    maxLevelLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('maxLevelReached') || '';
    }
  }
};
