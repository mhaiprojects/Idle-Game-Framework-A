export default {
  name: 'ResourceBar',
  props: {
    resources: Array,
    primaryCurrencyRate: String,
    primaryIcon: String,
    ascensionIcon: String,
    deltas: Array,
    getResourceLabel: Function,
    formatNumber: Function
  },
  methods: {
    deltaLabel(d) {
      const label = this.getResourceLabel ? this.getResourceLabel(d.resource) : d.resource;
      const sign = d.amount >= 0 ? '+' : '';
      const amt = this.formatNumber ? this.formatNumber(Math.abs(d.amount)) : Math.abs(d.amount);
      return `${sign}${amt} ${label}`;
    }
  },
  template: `
    <div class="resource-bar">
      <div v-if="ascensionIcon" class="resource-item ascension-tier-badge" :title="'Current age'">
        <span>{{ ascensionIcon }}</span>
      </div>
      <div v-for="r in resources" :key="r.codeName"
        class="resource-item" :class="{ primary: r.isPrimary }" style="position:relative">
        <span>{{ r.icon }}</span>
        <span>{{ r.formatted }}</span>
        <span v-if="r.isPrimary && primaryCurrencyRate" style="font-size:0.7rem;color:var(--color-muted)">(+{{ primaryCurrencyRate }}/s)</span>
        <span v-for="d in deltas.filter(x => x.resource === r.codeName)" :key="d.id"
          class="resource-delta" :class="d.amount >= 0 ? 'positive' : 'negative'">
          {{ deltaLabel(d) }}
        </span>
      </div>
    </div>
  `
};
