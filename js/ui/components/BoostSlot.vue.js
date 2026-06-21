export default {
  name: 'BoostSlot',
  props: { boost: Object },
  emits: ['use'],
  template: `
    <div class="boost-slot" :class="{ disabled: boost.quantity <= 0 }" @click="boost.quantity > 0 && $emit('use', boost.codeName)" :title="boost.displayName">
      <span>{{ boost.icon }}</span>
      <span class="slot-qty">{{ boost.quantity }}</span>
    </div>
  `
};
