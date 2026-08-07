import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'TranscendencePanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, PanelHeader, CardSection },
  props: {
    unlocked: Boolean,
    canTranscend: Boolean,
    projectedGain: Number,
    transcendenceCurrency: Number,
    totalTranscendences: Number,
    insightProgress: Object,
    unlockRequirements: Array,
    transcendLost: Array,
    transcendKept: Array,
    upgrades: Array,
    directives: Object,
    formatNumber: Function
  },
  emits: ['transcend', 'buy-upgrade', 'more-info'],
  data() { return { showTranscendModal: false }; },
  template: `
    <div class="panel transcendence-panel">
      <PanelHeader panel-key="transcendence" />

      <div v-if="!unlocked" class="card locked-card animate__animated animate__fadeIn">
        <CardSection section-key="unlockRequirements" level="panel" :first="true">
          <p class="section-text muted">Transcendence unlocks after reaching the AI Age and proving your legacy through prestiges.</p>
          <UnlockRequirementsList :requirements="unlockRequirements" section-key="unlockRequirements" />
        </CardSection>
      </div>

      <template v-else>
        <CardSection section-key="overview" level="panel" :first="true">
          <div class="stats-grid transcendence-stats">
            <div class="stat-box glow-stat">
              <span class="stat-icon">🌌</span>
              <span class="stat-value">{{ formatNumber(transcendenceCurrency) }}</span>
              <span class="stat-label">Cosmic Insight</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">♾️</span>
              <span class="stat-value">{{ totalTranscendences }}</span>
              <span class="stat-label">Transcendences</span>
            </div>
          </div>
        </CardSection>

        <CardSection v-if="directives?.enabled" section-key="directives" level="panel">
          <p v-if="directives.bonusReady" class="section-text accent-glow">🌟 Directive bonus active: +{{ directives.bonusPercent }}% Cosmic Insight on next Transcendence!</p>
          <p v-else-if="directives.allCompleted" class="section-text muted">All directives complete for today.</p>
          <p v-else class="section-text muted">Complete all 3 daily directives for +{{ directives.bonusPercent }}% Cosmic Insight bonus.</p>
          <div v-for="d in directives.directives" :key="d.codeName"
            class="card nested-card directive-card" :class="{ 'directive-complete': d.completed }">
            <div class="card-header">
              <span class="card-icon">{{ d.icon }}</span>
              <span class="card-name">{{ d.displayName }}</span>
              <span v-if="d.completed" class="card-owned">✓</span>
            </div>
            <p class="card-description">{{ d.description }}</p>
            <ResourceProgressList :entries="[{
              code: d.codeName,
              label: d.label,
              progress: d.progress,
              met: d.met
            }]" />
          </div>
        </CardSection>

        <CardSection section-key="transcendenceReset" level="panel">
          <div class="card transcend-card">
            <div class="card-header">
              <span class="card-name">{{ transcendTitle }}</span>
              <MoreInfoButton @click="$emit('more-info', 'transcendence', 'reset')" />
            </div>
            <CardSection v-if="insightProgress" section-key="transcendenceProgress" :first="true">
              <p class="section-text muted">{{ insightProgress.rulesExplanation }}</p>
              <p class="section-text">
                {{ insightProgress.resourceIcon }} {{ insightProgress.resourceName }} this run:
                {{ insightProgress.formattedCurrent }} (min {{ insightProgress.formattedRequired }})
              </p>
              <ResourceProgressList :entries="[{
                code: 'insight-overall',
                label: 'Progress toward next Cosmic Insight',
                progress: insightProgress.overallProgress,
                met: insightProgress.overallMet
              }]" />
            </CardSection>
            <CardSection section-key="rewards">
              <p class="section-text accent-glow">Gain: +{{ projectedGain }} Cosmic Insight</p>
            </CardSection>
            <div class="section-actions section-actions-start">
              <button class="btn btn-transcend" :disabled="!canTranscend" @click="showTranscendModal = true">
                ✨ Transcend
              </button>
            </div>
          </div>
        </CardSection>

        <CardSection section-key="transcendenceShop" level="panel">
          <div v-for="upgrade in upgrades" :key="upgrade.codeName"
            class="card nested-card upgrade-card" :class="{ 'can-afford': upgrade.canBuy, 'maxed-out': upgrade.maxed }">
            <div class="card-header">
              <span class="card-icon">{{ upgrade.icon }}</span>
              <span class="card-name">{{ upgrade.displayName }}</span>
              <span class="card-owned">Lv {{ upgrade.level }}/{{ upgrade.maxLevel }}</span>
              <MoreInfoButton @click="$emit('more-info', 'transcendenceUpgrade', upgrade.codeName)" />
            </div>
            <p class="card-description">{{ upgrade.description }}</p>
            <CardSection v-if="upgrade.levelProgress" section-key="levelProgress" :first="true">
              <ResourceProgressList :entries="[upgrade.levelProgress]" />
            </CardSection>
            <CardSection v-if="!upgrade.maxed" section-key="purchaseRequirements"
              :first="!upgrade.levelProgress">
              <ResourceProgressList :entries="upgrade.costProgress" />
              <div class="section-actions">
                <button class="btn btn-primary btn-sm" :disabled="!upgrade.canBuy"
                  @click="$emit('buy-upgrade', upgrade.codeName)">Buy</button>
              </div>
            </CardSection>
            <CardSection v-else section-key="status" :first="!upgrade.levelProgress">
              <p class="hint-text" style="margin-bottom:0">Max level reached ✨</p>
            </CardSection>
          </div>
        </CardSection>
      </template>

      <div v-if="showTranscendModal" class="modal-overlay" @click.self="showTranscendModal = false">
        <div class="modal transcend-modal animate__animated animate__fadeIn">
          <h3>🌌 Confirm Transcendence</h3>
          <CardSection section-key="warning" :first="true">
            <p class="section-text">You will transcend this reality and begin anew — but your cosmic wisdom persists forever.</p>
          </CardSection>
          <div class="modal-columns">
            <CardSection section-key="lost" class="lost">
              <div v-for="l in transcendLost" :key="l" class="section-text">• {{ l }}</div>
            </CardSection>
            <CardSection section-key="kept" class="kept">
              <div v-for="k in transcendKept" :key="k" class="section-text">• {{ k }}</div>
            </CardSection>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showTranscendModal = false">Cancel</button>
            <button class="btn btn-transcend" @click="$emit('transcend'); showTranscendModal = false">
              Transcend (+{{ projectedGain }})
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    transcendTitle() {
      return AFK?.ConfigManager?.getSection?.('transcendenceReset')?.title || 'Transcendence';
    }
  }
};
