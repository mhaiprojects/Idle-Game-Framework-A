export default {
  name: 'TapButton',
  props: { gain: Number, gainFormatted: String, primaryIcon: String },
  emits: ['tap'],
  data() {
    return { ripples: [] };
  },
  methods: {
    onTap(e) {
      this.$emit('tap');
      const btn = e.currentTarget;
      btn.classList.add('tap-active');
      setTimeout(() => btn.classList.remove('tap-active'), 300);

      const rect = btn.getBoundingClientRect();
      const ripple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      this.ripples.push(ripple);
      setTimeout(() => {
        this.ripples = this.ripples.filter(r => r.id !== ripple.id);
      }, 600);
    }
  },
  template: `
    <button class="tap-btn" @click="onTap" :title="'Tap for ' + gainFormatted">
      <span v-for="r in ripples" :key="r.id" class="tap-ripple"
        :style="{ left: r.x + 'px', top: r.y + 'px' }"></span>
      <span class="tap-icon">{{ primaryIcon || '⏱️' }}</span>
      <small class="tap-gain">+{{ gainFormatted }}</small>
    </button>
  `
};
