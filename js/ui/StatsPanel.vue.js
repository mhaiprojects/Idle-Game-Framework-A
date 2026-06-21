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
    getGeneratorLabel: Function
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
