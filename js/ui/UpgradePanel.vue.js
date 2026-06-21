import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'UpgradePanel',
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
        <div v-if="upg.unlocked && !upg.maxed" class="card-actions" style="flex-direction:column;align-items:stretch">
          <ResourceProgressList v-if="upg.levelProgress" :entries="[upg.levelProgress]" />
          <ResourceProgressList :entries="upg.costProgress" />
          <div style="display:flex;justify-content:flex-end;margin-top:0.35rem">
            <button class="btn btn-primary" :disabled="!upg.canBuy" @click="$emit('buy', upg.codeName)">Buy</button>
          </div>
        </div>
        <UnlockRequirementsList v-else-if="!upg.unlocked" :requirements="upg.unlockRequirements" />
        <div v-else class="locked-conditions">
          <ResourceProgressList v-if="upg.levelProgress" :entries="[upg.levelProgress]" />
          Max level reached
        </div>
      </div>
    </div>
  `
};
