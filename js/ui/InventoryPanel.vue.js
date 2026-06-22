import MoreInfoButton from './components/MoreInfoButton.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'InventoryPanel',
  components: { MoreInfoButton, PanelHeader, CardSection },
  props: {
    items: Array,
    inventory: Object,
    characters: Array,
    equipableItems: Array,
    describeEffectShort: Function
  },
  emits: ['use-boost', 'more-info'],
  computed: {
    ownedEquipables() {
      return this.equipableItems.filter(item =>
        (this.inventory[item.codeName] || 0) > 0
        || this.equippedOn(item.codeName).length > 0
      );
    }
  },
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
    },
    formatRarity(rarity) {
      if (!rarity) return AFK?.ConfigManager?.getDefaultLabel?.('commonRarity') || '';
      return rarity.charAt(0).toUpperCase() + rarity.slice(1);
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="inventory" />

      <CardSection section-key="consumables" level="panel" :first="true">
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
        <p v-if="!items.filter(i => i.type === 'consumable').length" class="hint-text" style="margin-bottom:0">No consumables yet.</p>
      </CardSection>

      <CardSection section-key="equipment" level="panel">
        <p class="hint-text">Owned gear appears here. Equip on the Characters tab — click a slot to pick from matching inventory items.</p>
        <p v-if="!ownedEquipables.length" class="hint-text" style="margin-bottom:0">No equipment yet — gear drops passively over time.</p>
        <div v-for="item in ownedEquipables" :key="item.codeName" class="card">
          <div class="card-header">
            <span class="card-icon">{{ item.icon }}</span>
            <span class="card-name">{{ item.displayName }}</span>
            <span class="card-owned">×{{ inventory[item.codeName] || 0 }}</span>
            <MoreInfoButton @click="$emit('more-info', 'item', item.codeName)" />
          </div>
          <p style="font-size:0.75rem;color:var(--color-muted)">{{ item.description }}</p>
          <CardSection section-key="details" :first="true">
            <span v-if="item.rarity" class="rarity-badge" :class="'rarity-' + (item.rarity || 'common')">{{ formatRarity(item.rarity) }}</span>
            <span v-if="effectLabel(item)" class="effect-badge">{{ effectLabel(item) }}</span>
            <p class="section-text muted">{{ slotLabel(item.slot) }} slot</p>
            <p v-if="equippedOn(item.codeName).length" class="section-text accent">
              Equipped on: {{ equippedOn(item.codeName).map(c => c.icon + ' ' + c.displayName).join(', ') }}
            </p>
          </CardSection>
        </div>
      </CardSection>
    </div>
  `
};
