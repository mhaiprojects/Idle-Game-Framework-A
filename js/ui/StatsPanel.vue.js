export default {
  name: 'StatsPanel',
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
      <h2 class="panel-title">📊 Stats</h2>
      <div class="stats-grid">
        <div class="stat-box">Total Taps: {{ stats.totalTaps }}</div>
        <div class="stat-box">Play Time: {{ Math.floor(stats.playTimeSeconds) }}s</div>
        <div class="stat-box">Peak {{ primaryCurrencyLabel }}: {{ formatNumber(stats.peakPrimaryCurrencyRate) }}/s</div>
        <div class="stat-box">Current {{ primaryCurrencyLabel }}: {{ formatNumber(primaryBreakdown.total) }}/s</div>
      </div>
      <h3 style="font-size:0.85rem;margin:1rem 0 0.5rem;color:var(--color-muted)">{{ primaryCurrencyLabel }} by Generator</h3>
      <div v-for="item in primaryBreakdown.breakdown" :key="item.generator" class="card" style="padding:0.5rem">
        <div style="display:flex;justify-content:space-between;font-size:0.8rem">
          <span>{{ getGeneratorLabel ? getGeneratorLabel(item.generator) : item.generator }}</span>
          <span>{{ formatNumber(item.amount) }}/s ({{ item.percent.toFixed(1) }}%)</span>
        </div>
      </div>
      <div v-if="activeEvents.length" style="margin-top:1rem">
        <h3 style="font-size:0.85rem;margin-bottom:0.5rem;color:var(--color-muted)">Active Events</h3>
        <div v-for="evt in activeEvents" :key="evt.codeName" class="card">
          {{ evt.icon }} {{ evt.displayName }}
        </div>
      </div>
    </div>
  `
};
