import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import ResourceProgressList from './components/ResourceProgressList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'UpgradePanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, CardSection, PanelHeader },
  props: {
    upgrades: Array,
    formatNumber: Function,
    getResourceMeta: Function,
    bestUpgradeCode: String,
    primaryCurrencyLabel: String
  },
  emits: ['buy', 'more-info'],
  methods: {
    resourceMeta(code) {
      return this.getResourceMeta ? this.getResourceMeta(code) : { icon: '', name: code };
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="upgrades" />
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
        <p class="card-description">{{ upg.description }}</p>
        <template v-if="upg.unlocked && !upg.maxed">
          <CardSection v-if="upg.levelProgress" section-key="levelProgress" :first="true">
            <ResourceProgressList :entries="[upg.levelProgress]" />
          </CardSection>
          <CardSection section-key="purchaseRequirements" :first="!upg.levelProgress">
            <ResourceProgressList :entries="upg.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary" :disabled="!upg.canBuy" @click="$emit('buy', upg.codeName)">Buy</button>
            </div>
          </CardSection>
        </template>
        <UnlockRequirementsList v-else-if="!upg.unlocked" :requirements="upg.unlockRequirements" :first="true" />
        <CardSection v-else section-key="status" :first="true">
          <ResourceProgressList v-if="upg.levelProgress" :entries="[upg.levelProgress]" />
          <p class="hint-text" style="margin-bottom:0">{{ maxLevelLabel }}</p>
        </CardSection>
      </div>
    </div>
  `,
  computed: {
    maxLevelLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('maxLevelReached') || '';
    }
  }
};
