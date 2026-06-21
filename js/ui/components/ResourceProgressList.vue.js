import ProgressBar from './ProgressBar.vue.js';

export default {
  name: 'ResourceProgressList',
  components: { ProgressBar },
  props: {
    entries: { type: Array, default: () => [] }
  },
  methods: {
    entryLabel(entry) {
      if (entry.label) return entry.label;
      const parts = [entry.formattedHeld, entry.formattedRequired].filter(Boolean).join(' / ');
      return `${parts} ${entry.icon || ''} ${entry.name || ''}`.trim();
    }
  },
  template: `
    <div v-if="entries.length" class="resource-progress-list">
      <div v-for="entry in entries" :key="entry.code" class="resource-progress-row">
        <div class="resource-progress-label" :class="{ met: entry.met }">{{ entryLabel(entry) }}</div>
        <ProgressBar :progress="entry.progress" :met="entry.met" />
      </div>
    </div>
  `
};
