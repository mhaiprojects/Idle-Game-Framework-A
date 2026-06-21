import MoreInfoButton from './components/MoreInfoButton.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'ArtifactPanel',
  components: { MoreInfoButton, PanelHeader, CardSection },
  props: { artifacts: Array },
  emits: ['more-info'],
  computed: {
    unknownLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('unknownEntity') || '';
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="artifacts" />
      <CardSection section-key="overview" level="panel" :first="true">
        <p class="hint-text" style="margin-bottom:0">Permanent collection bonuses — kept through prestige and ascension.</p>
      </CardSection>
      <CardSection section-key="collection" level="panel">
        <div v-for="art in artifacts" :key="art.codeName" class="card" :class="{ acquired: art.acquired }">
          <div class="card-header">
            <span class="card-icon">{{ art.icon }}</span>
            <span class="card-name">{{ art.acquired ? art.displayName : unknownLabel }}</span>
            <span v-if="art.acquired" class="efficiency-tag" style="color:var(--color-success)">✓ Collected</span>
            <span v-else style="font-size:0.7rem;color:var(--color-muted)">{{ art.rarity }}</span>
            <MoreInfoButton v-if="art.acquired" @click="$emit('more-info', 'artifact', art.codeName)" />
          </div>
          <p v-if="art.acquired" style="font-size:0.75rem;color:var(--color-muted)">{{ art.description }}</p>
          <p v-else style="font-size:0.75rem;color:var(--color-muted)">Discover this artifact through play.</p>
        </div>
      </CardSection>
    </div>
  `
};
