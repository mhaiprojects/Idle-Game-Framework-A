import MoreInfoButton from './MoreInfoButton.vue.js';
import CardSection from './CardSection.vue.js';

export default {
  name: 'EquipSlotModal',
  components: { MoreInfoButton, CardSection },
  props: {
    open: Boolean,
    slot: Object,
    characterName: String,
    items: Array,
    equippedCode: String
  },
  emits: ['close', 'equip', 'unequip', 'more-info'],
  methods: {
    rarityClass(rarity) {
      return `rarity-${rarity || 'common'}`;
    }
  },
  computed: {
    slotFallback() {
      return AFK?.ConfigManager?.getDefaultLabel?.('equipmentSlotFallback') || '';
    },
    emptyHint() {
      return AFK?.ConfigManager?.getDefaultLabel?.('equipSlotEmpty')
        || 'No matching gear in your inventory for this slot.';
    }
  },
  template: `
    <div v-if="open" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal equip-slot-modal animate__animated animate__fadeIn">
        <div class="equip-modal-header">
          <h3>{{ slot?.label || slotFallback }}</h3>
          <p class="hint-text">{{ characterName }} · sorted by rarity</p>
        </div>
        <CardSection section-key="availableItems" :first="true">
          <div v-if="items.length" class="equip-modal-list">
            <button v-for="item in items" :key="item.codeName"
              class="equip-modal-item"
              :class="[rarityClass(item.rarity), { selected: equippedCode === item.codeName, disabled: !item.canEquip && equippedCode !== item.codeName }]"
              :disabled="!item.canEquip && equippedCode !== item.codeName"
              @click="$emit('equip', item.codeName)">
              <div class="equip-modal-item-top">
                <span class="equip-modal-icon">{{ item.icon }}</span>
                <div class="equip-modal-meta">
                  <div class="equip-modal-name">{{ item.displayName }}</div>
                  <div class="equip-modal-sub">
                    <span class="rarity-badge" :class="rarityClass(item.rarity)">{{ item.rarityLabel }}</span>
                    <span>Owned ×{{ item.owned }}</span>
                    <span v-if="item.available !== item.owned">Free ×{{ item.available }}</span>
                    <span v-if="item.statusLabel" class="equip-modal-status">{{ item.statusLabel }}</span>
                  </div>
                </div>
                <MoreInfoButton @click.stop="$emit('more-info', 'item', item.codeName)" />
              </div>
              <div class="equip-modal-effect">{{ item.effectSummary }}</div>
              <div v-if="equippedCode === item.codeName" class="equip-modal-equipped-tag">Equipped</div>
            </button>
          </div>
          <p v-else class="hint-text" style="margin-bottom:0">{{ emptyHint }}</p>
        </CardSection>
        <div class="modal-actions" style="margin-top:1rem">
          <button v-if="equippedCode" class="btn btn-ghost" @click="$emit('unequip')">Unequip</button>
          <button class="btn btn-primary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  `
};
