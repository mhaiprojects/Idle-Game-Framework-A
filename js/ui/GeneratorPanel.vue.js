import PurchaseMultiplier from './components/PurchaseMultiplier.vue.js';
import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'GeneratorPanel',
  components: { PurchaseMultiplier, UnlockRequirementsList, ResourceProgressList, MoreInfoButton, CardSection, PanelHeader },
  props: {
    generators: Array,
    multiplier: [Number, String],
    multiplierOptions: Array,
    formatNumber: Function,
    primaryCurrencyLabel: String
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
      <PanelHeader panel-key="generators" />
      <CardSection section-key="bulkPurchase" level="panel" :first="true">
        <PurchaseMultiplier :options="multiplierOptions" :active="multiplier" @change="$emit('multiplier-change', $event)" />
      </CardSection>
      <div v-for="gen in generators" :key="gen.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ gen.icon }}</span>
          <span class="card-name">{{ gen.displayName }}</span>
          <span class="card-owned">×{{ gen.owned }}</span>
          <MoreInfoButton @click="$emit('more-info', 'generator', gen.codeName)" />
        </div>
        <p class="card-description">{{ gen.description }}</p>
        <div v-if="gen.isUnlocked">
          <CardSection v-if="gen.production?.length" section-key="production" :first="true">
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
          </CardSection>
          <CardSection section-key="purchaseRequirements">
            <ResourceProgressList :entries="gen.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary animate__animated" :disabled="!gen.canBuy" @click="$emit('buy', gen.codeName)">{{ buyLabel(gen) }}</button>
            </div>
          </CardSection>
        </div>
        <UnlockRequirementsList v-else-if="gen.unlockRequirements?.length"
          :requirements="gen.unlockRequirements" :first="true" />
        <p v-else class="hint-text">{{ requirementsUnavailable }}</p>
      </div>
    </div>
  `,
  computed: {
    requirementsUnavailable() {
      return AFK?.ConfigManager?.getDefaultLabel?.('requirementsUnavailable') || '';
    }
  }
};
