import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'ParagonPanel',
  components: { UnlockRequirementsList, ResourceProgressList, PanelHeader, CardSection },
  props: {
    paragon: Object,
    formatNumber: Function
  },
  emits: ['buy-level'],
  template: `
    <div class="panel paragon-panel">
      <PanelHeader panel-key="paragon" />

      <div v-if="!paragon?.enabled" class="hint-text">Paragon system not available.</div>

      <div v-else-if="!paragon.unlocked" class="card locked-card">
        <CardSection section-key="unlockRequirements" level="panel" :first="true">
          <p class="section-text muted">Paragon unlocks after 10 transcendences. Infinite scaling awaits.</p>
          <UnlockRequirementsList :requirements="paragon.unlockRequirements" section-key="unlockRequirements" />
        </CardSection>
      </div>

      <template v-else>
        <CardSection section-key="overview" level="panel" :first="true">
          <div class="stats-grid transcendence-stats">
            <div class="stat-box glow-stat paragon-stat">
              <span class="stat-icon">💎</span>
              <span class="stat-value">{{ paragon.level }}</span>
              <span class="stat-label">Paragon Level</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">✨</span>
              <span class="stat-value">+{{ paragon.totalBonusPercent }}%</span>
              <span class="stat-label">Global Bonus</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">💠</span>
              <span class="stat-value">{{ formatNumber(paragon.currency) }}</span>
              <span class="stat-label">Essence</span>
            </div>
          </div>
        </CardSection>

        <CardSection section-key="paragonShop" level="panel">
          <div class="card paragon-card">
            <p class="section-text muted">{{ paragon.rulesExplanation }}</p>
            <p class="section-text">Each level: +{{ paragon.multiplierPerLevelPercent }}% global (infinite scaling)</p>
            <ResourceProgressList :entries="[paragon.costProgress]" />
            <div class="section-actions section-actions-start">
              <button class="btn btn-transcend" :disabled="!paragon.canBuy" @click="$emit('buy-level')">
                Ascend Paragon (+1 Level)
              </button>
            </div>
          </div>
        </CardSection>
      </template>
    </div>
  `
};
