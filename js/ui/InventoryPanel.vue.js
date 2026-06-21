import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'InventoryPanel',
  props: {
    items: Array,
    inventory: Object,
    characters: Array,
    equipableItems: Array,
    describeEffectShort: Function
  },
  emits: ['use-boost', 'more-info'],
  methods: {
    slotLabel(slot) {
      return slot ? slot.charAt(0).toUpperCase() + slot.slice(1) : '';
    },
    equippedOn(code) {
      return this.characters.filter(c =>
        c.unlocked && Object.values(c.equipment || {}).includes(code)
      );
    },
    effectLabel(item) {
      return this.describeEffectShort ? this.describeEffectShort(item.effect) : '';
    }
  },
  template: `
    <div class="panel">
      <h2 class="panel-title">🎒 Inventory</h2>

      <h3 class="section-subtitle">Consumables</h3>
      <div class="inventory-grid">
        <div v-for="item in items.filter(i => i.type === 'consumable')" :key="item.codeName" class="inv-item">
          <div class="inv-item-top">
            <div class="icon">{{ item.icon }}</div>
            <MoreInfoButton @click="$emit('more-info', 'item', item.codeName)" />
          </div>
          <div class="inv-item-name">{{ item.displayName }}</div>
          <p class="inv-item-desc">{{ item.description }}</p>
          <span v-if="effectLabel(item)" class="effect-badge">{{ effectLabel(item) }}</span>
          <div class="inv-item-qty">Owned: {{ inventory[item.codeName] || 0 }}</div>
          <button v-if="item.actionBarEligible && (inventory[item.codeName] || 0) > 0"
            class="btn btn-primary btn-sm" style="margin-top:0.35rem"
            @click="$emit('use-boost', item.codeName)">Use</button>
        </div>
      </div>
      <div v-if="!items.filter(i => i.type === 'consumable').length" class="hint-text">No consumables yet.</div>

      <h3 class="section-subtitle">Equipment</h3>
      <p class="hint-text">Equip items on the Characters tab. Each item can only be worn by one character at a time.</p>
      <div v-for="item in equipableItems" :key="item.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ item.icon }}</span>
          <span class="card-name">{{ item.displayName }}</span>
          <span class="card-owned">×{{ inventory[item.codeName] || 0 }}</span>
          <MoreInfoButton @click="$emit('more-info', 'item', item.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ item.description }}</p>
        <span v-if="effectLabel(item)" class="effect-badge">{{ effectLabel(item) }}</span>
        <div style="font-size:0.75rem;margin-top:0.25rem;color:var(--color-muted)">{{ slotLabel(item.slot) }} slot</div>
        <div v-if="equippedOn(item.codeName).length" style="font-size:0.75rem;margin-top:0.25rem;color:var(--color-accent)">
          Equipped on: {{ equippedOn(item.codeName).map(c => c.icon + ' ' + c.displayName).join(', ') }}
        </div>
      </div>
    </div>
  `
};
