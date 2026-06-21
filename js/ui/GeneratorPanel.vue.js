import PurchaseMultiplier from './components/PurchaseMultiplier.vue.js';
import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'GeneratorPanel',
  components: { PurchaseMultiplier, UnlockRequirementsList, MoreInfoButton },
  props: {
    generators: Array,
    multiplier: [Number, String],
    multiplierOptions: Array,
    formatNumber: Function,
    formatCostEntries: Function,
    primaryCurrencyLabel: { type: String, default: 'Primary currency' }
  },
  emits: ['buy', 'multiplier-change', 'more-info'],
  methods: {
    buyLabel(gen) {
      if (gen.buyQuantity > 1) return `Buy ×${gen.buyQuantity}`;
      return 'Buy';
    }
  },
  template: `
    <div class="panel">
      <h2 class="panel-title">⚙️ Generators</h2>
      <PurchaseMultiplier :options="multiplierOptions" :active="multiplier" @change="$emit('multiplier-change', $event)" />
      <div v-for="gen in generators" :key="gen.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ gen.icon }}</span>
          <span class="card-name">{{ gen.displayName }}</span>
          <span class="card-owned">×{{ gen.owned }}</span>
          <MoreInfoButton @click="$emit('more-info', 'generator', gen.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ gen.description }}</p>
        <div v-if="gen.isUnlocked">
          <div style="font-size:0.8rem;margin-top:0.35rem">
            {{ primaryCurrencyLabel }}: {{ formatNumber(gen.primaryCurrencyRate) }}/s
            <span v-if="gen.primaryCurrencyPercent > 0" class="efficiency-tag">{{ gen.primaryCurrencyPercent.toFixed(1) }}%</span>
          </div>
          <div class="card-actions">
            <span style="font-size:0.75rem;display:flex;align-items:center;gap:0.25rem;flex-wrap:wrap">
              Cost:
              <span v-for="(entry, i) in formatCostEntries(gen.nextCost)" :key="entry.code">
                <span v-if="i"> · </span>{{ entry.formattedAmount }} {{ entry.icon }} {{ entry.name }}
              </span>
            </span>
            <button class="btn btn-primary animate__animated" :disabled="!gen.canBuy" @click="$emit('buy', gen.codeName)">{{ buyLabel(gen) }}</button>
          </div>
        </div>
        <UnlockRequirementsList v-else :requirements="gen.unlockRequirements" />
      </div>
    </div>
  `
};
