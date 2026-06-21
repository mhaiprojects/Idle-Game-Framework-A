import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import EquipmentGrid from './components/EquipmentGrid.vue.js';

export default {
  name: 'CharacterPanel',
  components: { UnlockRequirementsList, MoreInfoButton, EquipmentGrid },
  props: {
    characters: Array,
    maxActive: Number,
    activeCount: Number,
    inventory: Object,
    equipableItems: Array,
    equipmentSlotLayout: Array
  },
  emits: ['toggle', 'equip', 'unequip', 'more-info'],
  template: `
    <div class="panel">
      <h2 class="panel-title">👤 Characters</h2>
      <p class="hint-text">Active: {{ activeCount }}/{{ maxActive }} · Each item can be equipped on one character only.</p>
      <div v-for="char in characters" :key="char.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ char.icon }}</span>
          <span class="card-name">{{ char.displayName }}</span>
          <span v-if="char.activated" style="color:var(--color-success)">● Active</span>
          <MoreInfoButton @click="$emit('more-info', 'character', char.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ char.description }}</p>
        <UnlockRequirementsList v-if="!char.unlocked" :requirements="char.unlockRequirements" />
        <div v-else>
          <div class="card-actions">
            <button class="btn" :class="char.activated ? 'btn-ghost' : 'btn-primary'" @click="$emit('toggle', char.codeName)">
              {{ char.activated ? 'Deactivate' : 'Activate' }}
            </button>
          </div>
          <div class="equipment-section">
            <h4 class="equipment-heading">Equipment</h4>
            <EquipmentGrid
              :character="char"
              :equipable-items="equipableItems"
              :inventory="inventory"
              :characters="characters"
              :slot-layout="equipmentSlotLayout"
              @equip="(c, s, i) => $emit('equip', c, s, i)"
              @unequip="(c, s) => $emit('unequip', c, s)"
              @more-info="(type, code) => $emit('more-info', type, code)" />
          </div>
        </div>
      </div>
    </div>
  `
};
