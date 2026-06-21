import ProgressBar from './components/ProgressBar.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'AscensionPanel',
  components: { ProgressBar, ResourceProgressList, PanelHeader, CardSection },
  props: {
    tierName: String, currentTier: Number, prestigeCount: Number,
    lifetimePrestiges: Number, projectedGain: Number, canPrestige: Boolean,
    canAscend: Boolean, nextTierName: String, milestones: Array,
    prestigeLost: Array, prestigeKept: Array, ascendLost: Array, ascendKept: Array,
    featurePreview: Array, prestigeCurrency: Number, formatNumber: Function,
    maxTierReached: Boolean, difficulty: Object, primaryCurrencyLabel: String,
    prestigeBonuses: Array, canBuyPrestigeShop: Boolean
  },
  emits: ['prestige', 'ascend', 'buy-bonus'],
  data() { return { showPrestigeModal: false, showAscendModal: false }; },
  methods: {
    bonusCost(bonus) {
      const level = bonus.level || 0;
      return bonus.cost * (level + 1);
    }
  },
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
          <CardSection section-key="rewards" :first="true">
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
          </div>
          <p style="font-size:0.75rem;color:var(--color-muted)">{{ bonus.description }}</p>
          <CardSection v-if="bonus.levelProgress" section-key="levelProgress" :first="true">
            <ResourceProgressList :entries="[bonus.levelProgress]" />
          </CardSection>
          <CardSection v-if="!bonus.locked && !bonus.maxed" section-key="purchaseRequirements" :first="!bonus.levelProgress">
            <ResourceProgressList :entries="bonus.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary btn-sm" :disabled="!bonus.canBuy" @click="$emit('buy-bonus', bonus.codeName)">Buy</button>
            </div>
          </CardSection>
          <CardSection v-else-if="bonus.locked" section-key="unlockRequirements" :first="!bonus.levelProgress">
            <p class="hint-text" style="margin-bottom:0">🔒 {{ bonus.lockReason }}</p>
          </CardSection>
        </div>
      </CardSection>

      <CardSection v-if="!maxTierReached" section-key="ascension" level="panel">
        <div class="card">
          <CardSection :title="'Ascend to ' + nextTierName" :first="true">
            <div v-for="(m, i) in milestones" :key="i" class="resource-progress-row">
              <div class="resource-progress-label" :class="{ met: m.met }">{{ m.label }}</div>
              <ProgressBar :progress="m.progress" :met="m.met" />
            </div>
            <CardSection v-if="featurePreview.length" section-key="unlocksPreview">
              <p class="section-text accent">{{ featurePreview.join(', ') }}</p>
            </CardSection>
          </CardSection>
          <div class="section-actions section-actions-start">
            <button class="btn btn-primary" :disabled="!canAscend" @click="showAscendModal = true">Ascend</button>
          </div>
        </div>
      </CardSection>

      <div v-if="showPrestigeModal" class="modal-overlay" @click.self="showPrestigeModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Confirm Prestige</h3>
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
  `
};
