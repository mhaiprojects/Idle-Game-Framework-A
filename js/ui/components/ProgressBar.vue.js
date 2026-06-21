export default {
  name: 'ProgressBar',
  props: {
    progress: { type: Number, default: 0 },
    met: { type: Boolean, default: false }
  },
  computed: {
    widthPct() {
      const value = this.met ? 1 : this.progress;
      return Math.round(Math.min(1, Math.max(0, value)) * 100);
    }
  },
  template: `
    <div class="progress-bar" :class="{ met }">
      <div class="progress-bar-fill" :style="{ width: widthPct + '%' }"></div>
    </div>
  `
};
