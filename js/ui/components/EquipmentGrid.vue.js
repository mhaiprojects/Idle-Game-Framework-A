import EquipSlotModal from './EquipSlotModal.vue.js';

export default {
  name: 'EquipmentGrid',
  components: { EquipSlotModal },
  props: {
    character: Object,
    gameState: Object,
    uiTick: Number,
    slotLayout: Array,
    resolveItem: Function,
    formatEffect: Function
  },
  emits: ['equip', 'unequip', 'more-info'],
  data() {
    return { modalSlot: null };
  },
  computed: {
    modalItems() {
      if (!this.modalSlot || !this.gameState) return [];
      void this.uiTick;
      return AFK.ConfigManager.buildEquipSlotOptions(
        this.gameState,
        this.character.codeName,
        this.modalSlot,
        this.formatEffect
      );
    },
    activeSlotMeta() {
      return this.slotLayout.find(s => s.id === this.modalSlot) || null;
    },
    equippedCode() {
      return this.modalSlot ? this.character.equipment?.[this.modalSlot] : null;
    }
  },
  methods: {
    itemMeta(code) {
      if (!code) return null;
      const fromModal = this.modalItems.find(i => i.codeName === code);
      if (fromModal) return fromModal;
      if (this.resolveItem) return this.resolveItem(code);
      return {
        codeName: code,
        displayName: code,
        icon: AFK.ConfigManager.getDefaultIcon('unknown'),
        rarityLabel: ''
      };
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
        <button v-for="slot in slotLayout" :key="slot.id" type="button"
          class="equip-grid-cell"
          :class="{ filled: character.equipment?.[slot.id], open: modalSlot === slot.id }"
          :style="{ gridRow: slot.row + 1, gridColumn: slot.col + 1 }"
          :aria-label="'Equip ' + slot.label"
          @click="openSlot(slot.id)">
          <span class="equip-grid-slot-label">{{ slot.label }}</span>
          <template v-if="character.equipment?.[slot.id]">
            <span class="equip-grid-item-icon">{{ itemMeta(character.equipment[slot.id]).icon }}</span>
            <span class="equip-grid-item-name">{{ itemMeta(character.equipment[slot.id]).displayName }}</span>
          </template>
          <span v-else class="equip-grid-empty">+</span>
        </button>
      </div>
      <Teleport to="body">
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
      </Teleport>
    </div>
  `
};
