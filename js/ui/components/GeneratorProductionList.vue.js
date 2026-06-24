export default {
  name: 'GeneratorProductionList',
  props: {
    rows: Array,
    formatNumber: Function
  },
  template: `
    <div v-if="rows?.length" class="generator-production-list">
      <div v-for="row in rows" :key="row.resource" class="production-row">
        <span class="production-resource">
          <span>{{ row.icon }}</span>
          <span>{{ row.name }}</span>
        </span>
        <span class="production-stats">
          <span class="production-metric">
            <span class="production-metric-label">{{ perUnitLabel }}</span>
            <span>{{ formatNumber(row.unitRate) }}/s</span>
          </span>
          <span class="production-metric">
            <span class="production-metric-label">{{ totalLabel }}</span>
            <span>{{ formatNumber(row.totalRate) }}/s</span>
          </span>
          <span class="efficiency-tag">{{ row.percent.toFixed(1) }}%</span>
        </span>
      </div>
    </div>
    <p v-else class="hint-text" style="margin-bottom:0">{{ emptyLabel }}</p>
  `,
  computed: {
    emptyLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('noProductionDefined') || '';
    },
    perUnitLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('productionPerUnit') || 'Each';
    },
    totalLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('productionTotal') || 'Total';
    }
  }
};
