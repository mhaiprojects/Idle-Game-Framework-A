import EquipSlotModal from './EquipSlotModal.vue.js';

export default {
  name: 'EquipmentGrid',
  components: { EquipSlotModal },
  props: {
    character: Object,
    inventory: Object,
    slotLayout: Array,
    getSlotItems: Function
  },
  emits: ['equip', 'unequip', 'more-info'],
  data() {
    return { modalSlot: null };
  },
  computed: {
    modalItems() {
      if (!this.modalSlot || !this.getSlotItems) return [];
      return this.getSlotItems(this.character.codeName, this.modalSlot);
    },
    activeSlotMeta() {
      return this.slotLayout.find(s => s.id === this.modalSlot) || null;
    },
    equippedCode() {
      return this.modalSlot ? this.character.equipment?.[this.modalSlot] : null;
    }
  },
  methods: {
    itemMeta(code, slotId) {
      if (!code) return null;
      const items = this.getSlotItems ? this.getSlotItems(this.character.codeName, slotId || this.modalSlot || '') : [];
      return items.find(i => i.codeName === code)
        || { codeName: code, displayName: code, icon: '❓', rarityLabel: '' };
    },
    openSlot(slotId) {
      this.modalSlot = slotId;
    },
    closeModal() {
      this.modalSlot = null;
    },
    pickItem(itemCode) {
      this.$emit('equip', this.character.codeName, this.modalSlot, itemCode);
      this.closeModal();
    },
    unequipSlot() {
      this.$emit('unequip', this.character.codeName, this.modalSlot);
      this.closeModal();
    }
  },
  template: `
    <div class="equipment-grid-wrap">
      <div class="equipment-grid">
        <div v-for="slot in slotLayout" :key="slot.id"
          class="equip-grid-cell"
          :class="{ filled: character.equipment?.[slot.id] }"
          :style="{ gridRow: slot.row + 1, gridColumn: slot.col + 1 }"
          @click="openSlot(slot.id)">
          <span class="equip-grid-slot-label">{{ slot.label }}</span>
          <template v-if="character.equipment?.[slot.id]">
            <span class="equip-grid-item-icon">{{ itemMeta(character.equipment[slot.id], slot.id).icon }}</span>
            <span class="equip-grid-item-name">{{ itemMeta(character.equipment[slot.id], slot.id).displayName }}</span>
          </template>
          <span v-else class="equip-grid-empty">+</span>
        </div>
      </div>
      <EquipSlotModal
        :open="!!modalSlot"
        :slot="activeSlotMeta"
        :character-name="character.displayName"
        :items="modalItems"
        :equipped-code="equippedCode"
        @close="closeModal"
        @equip="pickItem"
        @unequip="unequipSlot"
        @more-info="(type, code) => $emit('more-info', type, code)" />
    </div>
  `
};
