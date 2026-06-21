import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';

export default {
  name: 'CharacterPanel',
  props: {
    characters: Array,
    maxActive: Number,
    activeCount: Number,
    inventory: Object,
    equipableItems: Array,
    equipmentSlots: Array
  },
  emits: ['toggle', 'equip', 'unequip', 'more-info'],
  methods: {
    equippedItem(char, slot) {
      const code = char.equipment?.[slot];
      if (!code) return null;
      return this.equipableItems.find(i => i.codeName === code) || { codeName: code, displayName: code, icon: '❓' };
    },
    ownedForSlot(slot) {
      return this.equipableItems.filter(i =>
        i.slot === slot && (this.inventory[i.codeName] || 0) > 0
      );
    },
    onEquipSelect(char, slot, event) {
      const code = event.target.value;
      if (code) {
        this.$emit('equip', char.codeName, slot, code);
        event.target.value = '';
      }
    },
    slotLabel(slot) {
      return slot.charAt(0).toUpperCase() + slot.slice(1);
    }
  },
  template: `
    <div class="panel">
      <h2 class="panel-title">👤 Characters</h2>
      <p class="hint-text">Active: {{ activeCount }}/{{ maxActive }}</p>
      <div v-for="char in characters" :key="char.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ char.icon }}</span>
          <span class="card-name">{{ char.displayName }}</span>
          <span v-if="char.activated" style="color:var(--color-success)">● Active</span>
          <MoreInfoButton @click="$emit('more-info', 'character', char.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ char.description }}</p>
        <div v-if="char.unlocked">
          <div class="card-actions">
            <button class="btn" :class="char.activated ? 'btn-ghost' : 'btn-primary'" @click="$emit('toggle', char.codeName)">
              {{ char.activated ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
          <div class="equipment-section">
            <h4 class="equipment-heading">Equipment</h4>
            <div v-for="slot in equipmentSlots" :key="slot" class="equip-slot-row">
              <span class="slot-label">{{ slotLabel(slot) }}</span>
              <template v-if="equippedItem(char, slot)">
                <span class="equipped-item">{{ equippedItem(char, slot).icon }} {{ equippedItem(char, slot).displayName }}</span>
                <button class="btn btn-ghost btn-sm" @click="$emit('unequip', char.codeName, slot)">Unequip</button>
              </template>
              <template v-else>
                <select class="equip-select" @change="onEquipSelect(char, slot, $event)">
                  <option value="">— Equip item —</option>
                  <option v-for="item in ownedForSlot(slot)" :key="item.codeName" :value="item.codeName">
                    {{ item.icon }} {{ item.displayName }} (×{{ inventory[item.codeName] }})
                  </option>
                </select>
              </template>
            </div>
          </div>
        </div>
        <UnlockRequirementsList v-else :requirements="char.unlockRequirements" />
      </div>
    </div>
  `
};
