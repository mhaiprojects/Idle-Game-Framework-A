import PurchaseMultiplier from './components/PurchaseMultiplier.vue.js';
import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'GeneratorPanel',
  components: { PurchaseMultiplier, UnlockRequirementsList, ResourceProgressList, MoreInfoButton },
  props: {
    generators: Array,
    multiplier: [Number, String],
    multiplierOptions: Array,
    formatNumber: Function,
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
          <div v-if="gen.production?.length" class="production-section">
            <h4 class="production-heading">Production</h4>
            <div v-for="row in gen.production" :key="row.resource" class="production-row">
              <span class="production-resource">
                <span>{{ row.icon }}</span>
                <span>{{ row.name }}</span>
              </span>
              <span class="production-stats">
                <span>{{ formatNumber(row.rate) }}/s</span>
                <span class="efficiency-tag">{{ row.percent.toFixed(1) }}%</span>
              </span>
            </div>
          </div>
          <div class="card-actions" style="flex-direction:column;align-items:stretch;margin-top:0.5rem">
            <ResourceProgressList :entries="gen.costProgress" />
            <div style="display:flex;justify-content:flex-end;margin-top:0.35rem">
              <button class="btn btn-primary animate__animated" :disabled="!gen.canBuy" @click="$emit('buy', gen.codeName)">{{ buyLabel(gen) }}</button>
            </div>
          </div>
        </div>
        <template v-else>
          <UnlockRequirementsList v-if="gen.unlockRequirements?.length"
            :requirements="gen.unlockRequirements" />
          <p v-else class="hint-text">Requirements unavailable.</p>
        </template>
      </div>
    </div>
  `
};
