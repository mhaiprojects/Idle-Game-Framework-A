import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'InventoryPanel',
  props: {
    items: Array,
    inventory: Object,
    characters: Array,
    equipableItems: Array,
    equipmentSlots: Array
  },
  emits: ['use-boost', 'equip', 'unequip', 'more-info'],
  methods: {
    slotLabel(slot) {
      return slot.charAt(0).toUpperCase() + slot.slice(1);
    },
    equippedOn(code) {
      return this.characters.filter(c =>
        c.unlocked && Object.values(c.equipment || {}).includes(code)
      );
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
          <div>{{ item.displayName }}</div>
          <div style="font-weight:700">{{ inventory[item.codeName] || 0 }}</div>
          <button v-if="item.actionBarEligible && (inventory[item.codeName] || 0) > 0"
            class="btn btn-primary btn-sm" style="margin-top:0.35rem"
            @click="$emit('use-boost', item.codeName)">Use</button>
        </div>
      </div>
      <div v-if="!items.filter(i => i.type === 'consumable').length" class="hint-text">No consumables yet.</div>

      <h3 class="section-subtitle">Equipment</h3>
      <p class="hint-text">Equip items on the Characters tab, or use the controls below.</p>
      <div v-for="item in equipableItems" :key="item.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ item.icon }}</span>
          <span class="card-name">{{ item.displayName }}</span>
          <span class="card-owned">×{{ inventory[item.codeName] || 0 }}</span>
          <MoreInfoButton @click="$emit('more-info', 'item', item.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ item.description }} · {{ slotLabel(item.slot) }}</p>
        <div v-if="equippedOn(item.codeName).length" style="font-size:0.75rem;margin-top:0.25rem;color:var(--color-accent)">
          Equipped on: {{ equippedOn(item.codeName).map(c => c.displayName).join(', ') }}
        </div>
        <div v-if="characters.filter(c => c.unlocked).length" class="equip-assign-list">
          <div v-for="char in characters.filter(c => c.unlocked)" :key="char.codeName" class="equip-slot-row">
            <span>{{ char.icon }} {{ char.displayName }}</span>
            <button v-if="char.equipment?.[item.slot] === item.codeName" class="btn btn-ghost btn-sm"
              @click="$emit('unequip', char.codeName, item.slot)">Unequip</button>
            <button v-else-if="(inventory[item.codeName] || 0) > 0" class="btn btn-primary btn-sm"
              @click="$emit('equip', char.codeName, item.slot, item.codeName)">Equip</button>
          </div>
        </div>
      </div>
    </div>
  `
};
