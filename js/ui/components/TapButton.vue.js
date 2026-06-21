export default {
  name: 'TapButton',
  props: { gain: Number, gainFormatted: String, primaryIcon: String },
  emits: ['tap'],
  methods: {
    onTap(e) {
      this.$emit('tap');
      e.target.classList.add('animate__animated', 'animate__pulse');
      setTimeout(() => e.target.classList.remove('animate__animated', 'animate__pulse'), 500);
    }
  },
  template: `
    <button class="tap-btn" @click="onTap" :title="'Tap for ' + gainFormatted">
      <span>{{ primaryIcon || '⏱️' }}</span>
      <small>+{{ gainFormatted }}</small>
    </button>
  `
};
