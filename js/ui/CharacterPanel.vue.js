import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import EquipmentGrid from './components/EquipmentGrid.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'CharacterPanel',
  components: { UnlockRequirementsList, MoreInfoButton, EquipmentGrid, CardSection },
  props: {
    characters: Array,
    maxActive: Number,
    activeCount: Number,
    equipmentSlotLayout: Array,
    getEquipSlotItems: Function
  },
  emits: ['toggle', 'equip', 'unequip', 'more-info'],
  template: `
    <div class="panel">
      <h2 class="panel-title">👤 Characters</h2>
      <CardSection title="Overview" level="panel" :first="true">
        <p class="hint-text" style="margin-bottom:0">Active: {{ activeCount }}/{{ maxActive }} · Equipment stacks in inventory; each copy boosts power.</p>
      </CardSection>
      <div v-for="char in characters" :key="char.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ char.icon }}</span>
          <span class="card-name">{{ char.displayName }}</span>
          <span v-if="char.activated" style="color:var(--color-success)">● Active</span>
          <MoreInfoButton @click="$emit('more-info', 'character', char.codeName)" />
        </div>
        <p style="font-size:0.75rem;color:var(--color-muted)">{{ char.description }}</p>
        <UnlockRequirementsList v-if="!char.unlocked" :requirements="char.unlockRequirements" :first="true" />
        <template v-else>
          <CardSection title="Activation" :first="true">
            <div class="section-actions section-actions-start">
              <button class="btn" :class="char.activated ? 'btn-ghost' : 'btn-primary'" @click="$emit('toggle', char.codeName)">
                {{ char.activated ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </CardSection>
          <CardSection title="Equipment">
            <EquipmentGrid
              :character="char"
              :slot-layout="equipmentSlotLayout"
              :get-slot-items="getEquipSlotItems"
              @equip="(c, s, i) => $emit('equip', c, s, i)"
              @unequip="(c, s) => $emit('unequip', c, s)"
              @more-info="(type, code) => $emit('more-info', type, code)" />
          </CardSection>
        </template>
      </div>
    </div>
  `
};
