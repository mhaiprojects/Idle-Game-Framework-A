import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'ArtifactPanel',
  props: { artifacts: Array },
  emits: ['more-info'],
  template: `
    <div class="panel">
      <h2 class="panel-title">🔮 Artifacts</h2>
      <p class="hint-text">Permanent collection bonuses — kept through prestige and ascension.</p>
      <div v-for="art in artifacts" :key="art.codeName" class="card" :class="{ acquired: art.acquired }">
        <div class="card-header">
          <span class="card-icon">{{ art.icon }}</span>
          <span class="card-name">{{ art.acquired ? art.displayName : '???' }}</span>
          <span v-if="art.acquired" class="efficiency-tag" style="color:var(--color-success)">✓ Collected</span>
          <span v-else style="font-size:0.7rem;color:var(--color-muted)">{{ art.rarity }}</span>
          <MoreInfoButton v-if="art.acquired" @click="$emit('more-info', 'artifact', art.codeName)" />
        </div>
        <p v-if="art.acquired" style="font-size:0.75rem;color:var(--color-muted)">{{ art.description }}</p>
        <p v-else style="font-size:0.75rem;color:var(--color-muted)">Discover this artifact through play.</p>
      </div>
    </div>
  `
};
