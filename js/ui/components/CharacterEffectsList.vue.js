import ProgressBar from './ProgressBar.vue.js';

export default {
  name: 'CharacterEffectsList',
  components: { ProgressBar },
  props: {
    effects: { type: Array, default: () => [] }
  },
  template: `
    <div v-if="effects.length" class="character-effects-list">
      <div v-for="(row, idx) in effects" :key="idx" class="character-effect-row">
        <div class="character-effect-label">{{ row.label }}</div>
        <div class="character-effect-sources muted">{{ row.sources }}</div>
      </div>
    </div>
    <p v-else class="hint-text" style="margin-bottom:0">No passive effects from this character or equipment yet.</p>
  `
};
