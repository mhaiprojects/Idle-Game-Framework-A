import MoreInfoButton from './MoreInfoButton.vue.js';

export default {
  name: 'EquipmentGrid',
  components: { MoreInfoButton },
  props: {
    character: Object,
    equipableItems: Array,
    inventory: Object,
    characters: Array,
    slotLayout: Array
  },
  emits: ['equip', 'unequip', 'more-info'],
  data() {
    return { openSlot: null };
  },
  methods: {
    itemMeta(code) {
      if (!code) return null;
      return this.equipableItems.find(i => i.codeName === code)
        || { codeName: code, displayName: code, icon: '❓' };
    },
    isItemEquipped(itemCode) {
      return this.characters.find(c => Object.values(c.equipment || {}).includes(itemCode));
    },
    availableForSlot(slotId) {
      return this.equipableItems.filter(item => {
        if (item.slot !== slotId) return false;
        if ((this.inventory[item.codeName] || 0) <= 0) return false;
        return !this.isItemEquipped(item.codeName);
      });
    },
    toggleSlot(slotId) {
      this.openSlot = this.openSlot === slotId ? null : slotId;
    },
    pickItem(slotId, itemCode) {
      this.$emit('equip', this.character.codeName, slotId, itemCode);
      this.openSlot = null;
    },
    unequip(slotId) {
      this.$emit('unequip', this.character.codeName, slotId);
      this.openSlot = null;
    }
  },
  template: `
    <div class="equipment-grid-wrap">
      <div class="equipment-grid">
        <div v-for="slot in slotLayout" :key="slot.id"
          class="equip-grid-cell"
          :class="{ filled: character.equipment?.[slot.id], open: openSlot === slot.id }"
          :style="{ gridRow: slot.row + 1, gridColumn: slot.col + 1 }"
          @click="toggleSlot(slot.id)">
          <span class="equip-grid-slot-label">{{ slot.label }}</span>
          <template v-if="character.equipment?.[slot.id]">
            <span class="equip-grid-item-icon">{{ itemMeta(character.equipment[slot.id]).icon }}</span>
            <span class="equip-grid-item-name">{{ itemMeta(character.equipment[slot.id]).displayName }}</span>
          </template>
          <span v-else class="equip-grid-empty">+</span>
        </div>
      </div>
      <div v-if="openSlot" class="equip-picker">
        <div class="equip-picker-header">
          <span>{{ slotLayout.find(s => s.id === openSlot)?.label }}</span>
          <button v-if="character.equipment?.[openSlot]" class="btn btn-ghost btn-sm" @click="unequip(openSlot)">Unequip</button>
        </div>
        <div v-if="availableForSlot(openSlot).length" class="equip-picker-list">
          <button v-for="item in availableForSlot(openSlot)" :key="item.codeName"
            class="equip-picker-item" @click="pickItem(openSlot, item.codeName)">
            <span>{{ item.icon }}</span>
            <span>{{ item.displayName }}</span>
            <MoreInfoButton @click.stop="$emit('more-info', 'item', item.codeName)" />
          </button>
        </div>
        <p v-else class="hint-text">No available items for this slot.</p>
      </div>
    </div>
  `
};
