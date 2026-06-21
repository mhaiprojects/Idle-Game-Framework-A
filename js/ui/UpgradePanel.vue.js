import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'UpgradePanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, CardSection },
  props: {
    upgrades: Array,
    formatNumber: Function,
    getResourceMeta: Function,
    bestUpgradeCode: String,
    primaryCurrencyLabel: { type: String, default: 'Primary currency' }
  },
  emits: ['buy', 'more-info'],
  methods: {
    resourceMeta(code) {
      return this.getResourceMeta ? this.getResourceMeta(code) : { icon: '', name: code };
    }
  },
  template: `
    <div class="panel">
      <h2 class="panel-title">⬆️ Upgrades</h2>
      <div v-for="upg in upgrades" :key="upg.codeName" class="card"
        :class="{ 'best-upgrade': upg.codeName === bestUpgradeCode && upg.canBuy }">
        <div class="card-header">
          <span class="card-icon">{{ upg.icon }}</span>
          <span class="card-name">{{ upg.displayName }}</span>
          <span class="card-owned" v-if="upg.maxPurchases">{{ upg.purchaseCount }}/{{ upg.maxPurchases }}</span>
          <span class="card-owned" v-else>Lv {{ upg.purchaseCount }}</span>
          <span v-if="upg.codeName === bestUpgradeCode && upg.canBuy" class="efficiency-tag">Best</span>
          <MoreInfoButton @click="$emit('more-info', 'upgrade', upg.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ upg.description }}</p>
        <template v-if="upg.unlocked && !upg.maxed">
          <CardSection v-if="upg.levelProgress" title="Level Progress" :first="true">
            <ResourceProgressList :entries="[upg.levelProgress]" />
          </CardSection>
          <CardSection title="Purchase Requirements" :first="!upg.levelProgress">
            <ResourceProgressList :entries="upg.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary" :disabled="!upg.canBuy" @click="$emit('buy', upg.codeName)">Buy</button>
            </div>
          </CardSection>
        </template>
        <UnlockRequirementsList v-else-if="!upg.unlocked" :requirements="upg.unlockRequirements" :first="true" />
        <CardSection v-else title="Status" :first="true">
          <ResourceProgressList v-if="upg.levelProgress" :entries="[upg.levelProgress]" />
          <p class="hint-text" style="margin-bottom:0">Max level reached</p>
        </CardSection>
      </div>
    </div>
  `
};
