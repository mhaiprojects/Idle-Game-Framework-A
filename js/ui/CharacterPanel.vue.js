import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import EquipmentGrid from './components/EquipmentGrid.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'CharacterPanel',
  components: { UnlockRequirementsList, MoreInfoButton, EquipmentGrid, PanelHeader, CardSection },
  props: {
    characters: Array,
    maxActive: Number,
    activeCount: Number,
    equipmentSlotLayout: Array,
    gameState: Object,
    uiTick: Number,
    resolveItem: Function,
    formatEffect: Function
  },
  emits: ['toggle', 'equip', 'unequip', 'more-info'],
  template: `
    <div class="panel">
      <PanelHeader panel-key="characters" />
      <CardSection section-key="overview" level="panel" :first="true">
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
          <CardSection section-key="activation" :first="true">
            <div class="section-actions section-actions-start">
              <button class="btn" :class="char.activated ? 'btn-ghost' : 'btn-primary'" @click="$emit('toggle', char.codeName)">
                {{ char.activated ? 'Deactivate' : 'Activate' }}
              </button>
            </div>
          </CardSection>
          <CardSection section-key="equipment">
            <EquipmentGrid
              :character="char"
              :game-state="gameState"
              :ui-tick="uiTick"
              :slot-layout="equipmentSlotLayout"
              :resolve-item="resolveItem"
              :format-effect="formatEffect"
              @equip="(c, s, i) => $emit('equip', c, s, i)"
              @unequip="(c, s) => $emit('unequip', c, s)"
              @more-info="(type, code) => $emit('more-info', type, code)" />
          </CardSection>
        </template>
      </div>
    </div>
  `
};
