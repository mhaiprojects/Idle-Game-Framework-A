export default {
  name: 'PurchaseMultiplier',
  props: { options: Array, active: [Number, String] },
  emits: ['change'],
  template: `
    <div class="multiplier-bar">
      <button v-for="opt in options" :key="opt"
        class="multiplier-btn" :class="{ active: active === opt }"
        @click="$emit('change', opt)">{{ opt }}</button>
    </div>
  `
};
