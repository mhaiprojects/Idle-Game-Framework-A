import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'StatsPanel',
  components: { PanelHeader, CardSection },
  props: {
    stats: Object,
    primaryBreakdown: Object,
    primaryCurrencyLabel: String,
    formatNumber: Function,
    activeEvents: Array,
    getGeneratorLabel: Function,
    synergies: Array
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="stats" />
      <CardSection section-key="overview" level="panel" :first="true">
        <div class="stats-grid">
          <div class="stat-box">Total Taps: {{ stats.totalTaps }}</div>
          <div class="stat-box">Play Time: {{ Math.floor(stats.playTimeSeconds) }}s</div>
          <div class="stat-box">Peak {{ primaryCurrencyLabel }}: {{ formatNumber(stats.peakPrimaryCurrencyRate) }}/s</div>
          <div class="stat-box">Current {{ primaryCurrencyLabel }}: {{ formatNumber(primaryBreakdown.total) }}/s</div>
        </div>
      </CardSection>
      <CardSection v-if="synergies?.length" section-key="synergies" level="panel">
        <p class="hint-text">Generator combo bonuses activate when you own all listed generators.</p>
        <div v-for="s in synergies" :key="s.codeName" class="card nested-card synergy-stat-card"
          :class="{ 'synergy-active': s.active }">
          <div class="card-header">
            <span class="card-icon">{{ s.icon }}</span>
            <span class="card-name">{{ s.displayName }}</span>
            <span class="card-owned">{{ s.active ? '✓ Active' : 'Inactive' }}</span>
          </div>
          <p class="card-description">{{ s.description }}</p>
        </div>
      </CardSection>
      <CardSection section-key="resourceGeneration" title="Resource Generation" level="panel">
        <p class="hint-text">Lifetime totals and current net production rate per resource.</p>
        <div v-for="row in stats.resourceTotals" :key="row.codeName" class="card nested-card">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;gap:0.5rem">
            <span>{{ row.icon }} {{ row.name }}</span>
            <span>{{ formatNumber(row.currentRate) }}/s</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-muted)">
            <span>Lifetime generated</span>
            <span>{{ formatNumber(row.lifetimeGenerated) }}</span>
          </div>
        </div>
      </CardSection>
      <CardSection section-key="primaryByGenerator" :title="primaryCurrencyLabel + ' by Generator'" level="panel">
        <div v-for="item in primaryBreakdown.breakdown" :key="item.generator" class="card nested-card">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem">
            <span>{{ getGeneratorLabel ? getGeneratorLabel(item.generator) : item.generator }}</span>
            <span>{{ formatNumber(item.amount) }}/s ({{ item.percent.toFixed(1) }}%)</span>
          </div>
        </div>
      </CardSection>
      <CardSection v-if="activeEvents.length" section-key="activeEvents" level="panel">
        <div v-for="evt in activeEvents" :key="evt.codeName" class="card nested-card">
          {{ evt.icon }} {{ evt.displayName }}
        </div>
      </CardSection>
    </div>
  `
};
