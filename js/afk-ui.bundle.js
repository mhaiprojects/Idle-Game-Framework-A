// Generated UI bundle for file:// support
(function () {
window.AFK_UI = window.AFK_UI || {};
const AFK_UI = window.AFK_UI;

// --- js/ui/components/Toast.vue.js ---
AFK_UI.Toast = {
  name: 'Toast',
  props: { toasts: Array },
  template: `
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast animate__animated animate__fadeInDown">{{ t.message }}</div>
    </div>
  `
};

// --- js/ui/components/Tooltip.vue.js ---
AFK_UI.Tooltip = {
  name: 'Tooltip',
  props: { text: String, visible: Boolean },
  template: `
    <div v-if="visible && text" class="tooltip-popup" style="position:absolute;background:var(--color-bg-card);border:1px solid var(--color-primary);padding:0.5rem;border-radius:6px;font-size:0.75rem;z-index:150;max-width:200px;">{{ text }}</div>
  `
};

// --- js/ui/components/EventBanner.vue.js ---
AFK_UI.EventBanner = {
  name: 'EventBanner',
  props: { events: Array },
  template: `
    <div v-if="events.length" class="event-banner animate__animated animate__fadeInDown">
      <div v-for="evt in events" :key="evt.codeName" class="event-banner-item">
        <span>{{ evt.icon }}</span>
        <span>{{ evt.displayName }}</span>
        <span class="event-timer">{{ Math.ceil(evt.remainingSeconds) }}s</span>
      </div>
    </div>
  `
};

// --- js/ui/components/ProgressBar.vue.js ---
AFK_UI.ProgressBar = {
  name: 'ProgressBar',
  props: {
    progress: { type: Number, default: 0 },
    met: { type: Boolean, default: false }
  },
  computed: {
    widthPct() {
      const value = this.met ? 1 : this.progress;
      return Math.round(Math.min(1, Math.max(0, value)) * 100);
    }
  },
  template: `
    <div class="progress-bar" :class="{ met }">
      <div class="progress-bar-fill" :style="{ width: widthPct + '%' }"></div>
    </div>
  `
};

// --- js/ui/components/PanelHeader.vue.js ---
AFK_UI.PanelHeader = {
  name: 'PanelHeader',
  props: {
    panelKey: { type: String, required: true }
  },
  computed: {
    panel() {
      const cm = typeof AFK !== 'undefined' ? AFK.ConfigManager : null;
      return cm?.getPanel?.(this.panelKey) || { icon: '', title: this.panelKey };
    }
  },
  template: `
    <h2 class="panel-title">
      <span class="panel-title-icon">{{ panel.icon }}</span>
      <span>{{ panel.title }}</span>
    </h2>
  `
};

// --- js/ui/components/CardSection.vue.js ---
AFK_UI.CardSection = {
  name: 'CardSection',
  props: {
    sectionKey: { type: String, default: '' },
    title: { type: String, default: '' },
    icon: { type: String, default: '' },
    level: { type: String, default: 'card' },
    first: { type: Boolean, default: false }
  },
  computed: {
    sectionClass() {
      return this.level === 'panel' ? 'panel-section' : 'card-section';
    },
    headingClass() {
      return this.level === 'panel' ? 'panel-section-heading' : 'card-section-heading';
    },
    headingTag() {
      return this.level === 'panel' ? 'h3' : 'h4';
    },
    sectionMeta() {
      const cm = typeof AFK !== 'undefined' ? AFK.ConfigManager : null;
      const fromKey = this.sectionKey && cm ? cm.getSection(this.sectionKey) : {};
      return {
        title: this.title || fromKey.title || this.sectionKey || '',
        icon: this.icon || fromKey.icon || ''
      };
    }
  },
  template: `
    <div :class="[sectionClass, { 'section-first': first }]">
      <component :is="headingTag" :class="headingClass">
        <span v-if="sectionMeta.icon" class="section-title-icon">{{ sectionMeta.icon }}</span>
        <span>{{ sectionMeta.title }}</span>
      </component>
      <div class="section-body">
        <slot></slot>
      </div>
    </div>
  `
};

// --- js/ui/components/ResourceProgressList.vue.js ---
const ProgressBar = AFK_UI.ProgressBar;

AFK_UI.ResourceProgressList = {
  name: 'ResourceProgressList',
  components: { ProgressBar },
  props: {
    entries: { type: Array, default: () => [] }
  },
  methods: {
    entryLabel(entry) {
      if (entry.label) return entry.label;
      const parts = [entry.formattedHeld, entry.formattedRequired].filter(Boolean).join(' / ');
      return `${parts} ${entry.icon || ''} ${entry.name || ''}`.trim();
    }
  },
  template: `
    <div v-if="entries.length" class="resource-progress-list">
      <div v-for="entry in entries" :key="entry.code" class="resource-progress-row">
        <div class="resource-progress-label" :class="{ met: entry.met }">{{ entryLabel(entry) }}</div>
        <ProgressBar :progress="entry.progress" :met="entry.met" />
      </div>
    </div>
  `
};

// --- js/ui/components/GeneratorProductionList.vue.js ---
AFK_UI.GeneratorProductionList = {
  name: 'GeneratorProductionList',
  props: {
    rows: Array,
    formatNumber: Function
  },
  template: `
    <div v-if="rows?.length" class="generator-production-list">
      <div v-for="row in rows" :key="row.resource" class="production-row">
        <span class="production-resource">
          <span>{{ row.icon }}</span>
          <span>{{ row.name }}</span>
        </span>
        <span class="production-stats">
          <span class="production-metric">
            <span class="production-metric-label">{{ perUnitLabel }}</span>
            <span>{{ formatNumber(row.unitRate) }}/s</span>
          </span>
          <span class="production-metric">
            <span class="production-metric-label">{{ totalLabel }}</span>
            <span>{{ formatNumber(row.totalRate) }}/s</span>
          </span>
          <span class="efficiency-tag">{{ row.percent.toFixed(1) }}%</span>
        </span>
      </div>
    </div>
    <p v-else class="hint-text" style="margin-bottom:0">{{ emptyLabel }}</p>
  `,
  computed: {
    emptyLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('noProductionDefined') || '';
    },
    perUnitLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('productionPerUnit') || 'Each';
    },
    totalLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('productionTotal') || 'Total';
    }
  }
};

// --- js/ui/components/UnlockRequirementsList.vue.js ---
const CardSection = AFK_UI.CardSection;

AFK_UI.UnlockRequirementsList = {
  name: 'UnlockRequirementsList',
  components: { ProgressBar, CardSection },
  props: {
    requirements: { type: Array, default: () => [] },
    sectionKey: { type: String, default: 'unlockRequirements' },
    title: { type: String, default: '' },
    first: { type: Boolean, default: false }
  },
  template: `
    <CardSection v-if="requirements.length" :section-key="sectionKey" :title="title" :first="first">
      <div v-for="(req, i) in requirements" :key="i" class="unlock-req-row">
        <span class="unlock-req-icon">{{ req.icon }}</span>
        <div class="unlock-req-body">
          <div class="unlock-req-label" :class="{ met: req.met }">
            {{ req.met ? '✓' : '✗' }} {{ req.label }}
          </div>
          <ProgressBar v-if="typeof req.progress === 'number'"
            :progress="req.progress" :met="req.met" />
        </div>
      </div>
    </CardSection>
  `
};

// --- js/ui/components/MoreInfoButton.vue.js ---
AFK_UI.MoreInfoButton = {
  name: 'MoreInfoButton',
  emits: ['click'],
  template: `
    <button type="button" class="more-info-btn" title="More info" aria-label="More info" @click.stop="$emit('click')">!</button>
  `
};

// --- js/ui/components/EquipSlotModal.vue.js ---
const MoreInfoButton = AFK_UI.MoreInfoButton;

AFK_UI.EquipSlotModal = {
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

// --- js/ui/components/EquipmentGrid.vue.js ---
const EquipSlotModal = AFK_UI.EquipSlotModal;

AFK_UI.EquipmentGrid = {
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

// --- js/ui/components/UnlockModal.vue.js ---
const UnlockRequirementsList = AFK_UI.UnlockRequirementsList;

AFK_UI.UnlockModal = {
  name: 'UnlockModal',
  components: { UnlockRequirementsList },
  props: { info: Object },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal animate__animated animate__fadeIn">
        <h3>🔒 {{ info.title }}</h3>
        <UnlockRequirementsList :requirements="info.requirements" :first="true" />
        <button class="btn btn-primary" style="margin-top:1rem" @click="$emit('close')">OK</button>
      </div>
    </div>
  `
};

// --- js/ui/components/InfoModal.vue.js ---
const GeneratorProductionList = AFK_UI.GeneratorProductionList;

AFK_UI.InfoModal = {
  name: 'InfoModal',
  components: { UnlockRequirementsList, GeneratorProductionList, CardSection },
  props: {
    info: Object,
    formatNumber: Function
  },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal info-modal animate__animated animate__fadeIn">
        <div class="info-modal-header">
          <span v-if="info.icon" class="card-icon">{{ info.icon }}</span>
          <h3>{{ info.title }}</h3>
        </div>
        <p v-if="info.description" class="card-description">{{ info.description }}</p>
        <CardSection v-if="info.productionRows" section-key="production" :first="true">
          <GeneratorProductionList :rows="info.productionRows" :format-number="formatNumber" />
        </CardSection>
        <CardSection v-for="(section, i) in info.sections" :key="i"
          :section-key="section.sectionKey"
          :title="section.title || section.heading"
          :first="!info.description && !info.productionRows && i === 0">
          <p class="section-text">{{ section.body }}</p>
        </CardSection>
        <UnlockRequirementsList v-if="info.requirements?.length" :requirements="info.requirements" />
        <button class="btn btn-primary" style="margin-top:1rem" @click="$emit('close')">Close</button>
      </div>
    </div>
  `
};

// --- js/ui/components/TapButton.vue.js ---
AFK_UI.TapButton = {
  name: 'TapButton',
  props: { gain: Number, gainFormatted: String, primaryIcon: String },
  emits: ['tap'],
  methods: {
    onTap(e) {
      this.$emit('tap');
      e.target.classList.add('animate__animated', 'animate__pulse');
      setTimeout(() => e.target.classList.remove('animate__animated', 'animate__pulse'), 500);
    }
  },
  template: `
    <button class="tap-btn" @click="onTap" :title="'Tap for ' + gainFormatted">
      <span>{{ primaryIcon || '⏱️' }}</span>
      <small>+{{ gainFormatted }}</small>
    </button>
  `
};

// --- js/ui/components/SkillSlot.vue.js ---
AFK_UI.SkillSlot = {
  name: 'SkillSlot',
  props: { skill: Object },
  emits: ['activate'],
  computed: {
    disabled() { return this.skill.cooldownRemaining > 0; },
    cooldownText() { return Math.ceil(this.skill.cooldownRemaining) + 's'; }
  },
  template: `
    <div class="skill-slot" :class="{ disabled }"
      @click="!disabled && $emit('activate', skill.codeName)"
      :title="(skill.characterName ? skill.characterName + ': ' : '') + skill.displayName">
      <span class="skill-slot-icon">{{ skill.icon }}</span>
      <span v-if="skill.characterIcon" class="skill-char-badge">{{ skill.characterIcon }}</span>
      <div v-if="disabled" class="cooldown-overlay">{{ cooldownText }}</div>
    </div>
  `
};

// --- js/ui/components/BoostSlot.vue.js ---
AFK_UI.BoostSlot = {
  name: 'BoostSlot',
  props: { boost: Object },
  emits: ['use'],
  template: `
    <div class="boost-slot" :class="{ disabled: boost.quantity <= 0 }" @click="boost.quantity > 0 && $emit('use', boost.codeName)" :title="boost.displayName">
      <span>{{ boost.icon }}</span>
      <span class="slot-qty">{{ boost.quantity }}</span>
    </div>
  `
};

// --- js/ui/components/PurchaseMultiplier.vue.js ---
AFK_UI.PurchaseMultiplier = {
  name: 'PurchaseMultiplier',
  props: { options: Array, active: [Number, String] },
  emits: ['change'],
  template: `
    <div class="multiplier-bar">
      <button v-for="opt in options" :key="opt"
        class="multiplier-btn" :class="{ active: active === opt }"
        @click="$emit('change', opt)">{{ opt }}</button>
    </div>
  `
};

// --- js/ui/ResourceBar.vue.js ---
AFK_UI.ResourceBar = {
  name: 'ResourceBar',
  props: {
    resources: Array,
    primaryCurrencyRate: String,
    primaryIcon: String,
    deltas: Array,
    getResourceLabel: Function,
    formatNumber: Function
  },
  methods: {
    deltaLabel(d) {
      const label = this.getResourceLabel ? this.getResourceLabel(d.resource) : d.resource;
      const sign = d.amount >= 0 ? '+' : '';
      const amt = this.formatNumber ? this.formatNumber(Math.abs(d.amount)) : Math.abs(d.amount);
      return `${sign}${amt} ${label}`;
    }
  },
  template: `
    <div class="resource-bar">
      <div v-for="r in resources" :key="r.codeName"
        class="resource-item" :class="{ primary: r.isPrimary }" style="position:relative">
        <span>{{ r.icon }}</span>
        <span>{{ r.formatted }}</span>
        <span v-if="r.isPrimary && primaryCurrencyRate" style="font-size:0.7rem;color:var(--color-muted)">(+{{ primaryCurrencyRate }}/s)</span>
        <span v-for="d in deltas.filter(x => x.resource === r.codeName)" :key="d.id"
          class="resource-delta" :class="d.amount >= 0 ? 'positive' : 'negative'">
          {{ deltaLabel(d) }}
        </span>
      </div>
    </div>
  `
};

// --- js/ui/GameSelectorPanel.vue.js ---
const PanelHeader = AFK_UI.PanelHeader;

AFK_UI.GameSelectorPanel = {
  name: 'GameSelectorPanel',
  components: { PanelHeader, CardSection },
  props: {
    games: Array,
    currentGame: Object
  },
  emits: ['select-game'],
  template: `
    <div class="panel">
      <PanelHeader panel-key="gameSelector" />
      <CardSection section-key="currentGame" level="panel" :first="true">
        <p v-if="currentGame" class="section-text">
          Currently playing: {{ currentGame.icon }} <strong>{{ currentGame.displayName }}</strong>
        </p>
      </CardSection>
      <CardSection section-key="gameCards" level="panel">
        <div class="game-card-grid">
          <div v-for="game in games" :key="game.id"
            class="card game-card"
            :class="{ 'game-card-active': game.active }"
            :style="game.themeColor ? { '--game-accent': game.themeColor } : null">
            <div class="card-header">
              <span class="card-icon game-card-icon">{{ game.icon }}</span>
              <span class="card-name">{{ game.displayName }}</span>
              <span v-if="game.active" class="game-card-badge">Playing</span>
              <span v-else-if="game.hasSave" class="game-card-badge save">Save</span>
            </div>
            <p class="card-description">{{ game.description }}</p>
            <p v-if="game.tagline" class="hint-text">{{ game.tagline }}</p>
            <div class="section-actions section-actions-start">
              <button class="btn" :class="game.active ? 'btn-ghost' : 'btn-primary'"
                :disabled="game.active" @click="$emit('select-game', game.id)">
                {{ game.active ? 'Selected' : (game.hasSave ? 'Continue' : 'Play') }}
              </button>
            </div>
          </div>
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/GeneratorPanel.vue.js ---
const PurchaseMultiplier = AFK_UI.PurchaseMultiplier;
const ResourceProgressList = AFK_UI.ResourceProgressList;

AFK_UI.GeneratorPanel = {
  name: 'GeneratorPanel',
  components: {
    PurchaseMultiplier, UnlockRequirementsList, ResourceProgressList,
    MoreInfoButton, GeneratorProductionList, CardSection, PanelHeader
  },
  props: {
    generators: Array,
    multiplier: [Number, String],
    multiplierOptions: Array,
    formatNumber: Function,
    primaryCurrencyLabel: String
  },
  emits: ['buy', 'multiplier-change', 'more-info'],
  methods: {
    buyLabel(gen) {
      if (gen.buyQuantity > 1) return `Buy ×${gen.buyQuantity}`;
      return 'Buy';
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="generators" />
      <CardSection section-key="bulkPurchase" level="panel" :first="true">
        <PurchaseMultiplier :options="multiplierOptions" :active="multiplier" @change="$emit('multiplier-change', $event)" />
      </CardSection>
      <div v-for="gen in generators" :key="gen.codeName" class="card">
        <div class="card-header">
          <span class="card-icon">{{ gen.icon }}</span>
          <span class="card-name">{{ gen.displayName }}</span>
          <span class="card-owned">×{{ gen.owned }}</span>
          <MoreInfoButton @click="$emit('more-info', 'generator', gen.codeName)" />
        </div>
        <p class="card-description">{{ gen.description }}</p>
        <CardSection section-key="production" :first="true">
          <GeneratorProductionList :rows="gen.production" :format-number="formatNumber" />
        </CardSection>
        <UnlockRequirementsList v-if="!gen.isUnlocked && gen.unlockRequirements?.length"
          :requirements="gen.unlockRequirements" />
        <p v-else-if="!gen.isUnlocked" class="hint-text">{{ requirementsUnavailable }}</p>
        <CardSection v-if="gen.isUnlocked" section-key="purchaseRequirements">
          <ResourceProgressList :entries="gen.costProgress" />
          <div class="section-actions">
            <button class="btn btn-primary animate__animated" :disabled="!gen.canBuy" @click="$emit('buy', gen.codeName)">{{ buyLabel(gen) }}</button>
          </div>
        </CardSection>
      </div>
    </div>
  `,
  computed: {
    requirementsUnavailable() {
      return AFK?.ConfigManager?.getDefaultLabel?.('requirementsUnavailable') || '';
    }
  }
};

// --- js/ui/UpgradePanel.vue.js ---

AFK_UI.UpgradePanel = {
  name: 'UpgradePanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, CardSection, PanelHeader },
  props: {
    upgrades: Array,
    formatNumber: Function,
    getResourceMeta: Function,
    bestUpgradeCode: String,
    primaryCurrencyLabel: String
  },
  emits: ['buy', 'more-info'],
  methods: {
    resourceMeta(code) {
      return this.getResourceMeta ? this.getResourceMeta(code) : { icon: '', name: code };
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="upgrades" />
      <div v-for="upg in upgrades" :key="upg.codeName" class="card"
        :class="{ 'best-upgrade': upg.codeName === bestUpgradeCode && upg.canBuy }">
        <div class="card-header">
          <span class="card-icon">{{ upg.icon }}</span>
          <span class="card-name">{{ upg.displayName }}</span>
          <span class="card-owned" v-if="upg.maxPurchases">{{ upg.purchaseCount }}/{{ upg.maxPurchases }}</span>
          <span class="card-owned" v-else>Lv {{ upg.purchaseCount }}</span>
          <span v-if="upg.codeName === bestUpgradeCode && upg.canBuy" class="efficiency-tag">Best</span>
          <MoreInfoButton @click="$emit('more-info', 'upgrade', upg.codeName)" />
        </div>
        <p class="card-description">{{ upg.description }}</p>
        <template v-if="upg.unlocked && !upg.maxed">
          <CardSection v-if="upg.levelProgress" section-key="levelProgress" :first="true">
            <ResourceProgressList :entries="[upg.levelProgress]" />
          </CardSection>
          <CardSection section-key="purchaseRequirements" :first="!upg.levelProgress">
            <ResourceProgressList :entries="upg.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary" :disabled="!upg.canBuy" @click="$emit('buy', upg.codeName)">Buy</button>
            </div>
          </CardSection>
        </template>
        <UnlockRequirementsList v-else-if="!upg.unlocked" :requirements="upg.unlockRequirements" :first="true" />
        <CardSection v-else section-key="status" :first="true">
          <ResourceProgressList v-if="upg.levelProgress" :entries="[upg.levelProgress]" />
          <p class="hint-text" style="margin-bottom:0">{{ maxLevelLabel }}</p>
        </CardSection>
      </div>
    </div>
  `,
  computed: {
    maxLevelLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('maxLevelReached') || '';
    }
  }
};

// --- js/ui/CharacterPanel.vue.js ---
const EquipmentGrid = AFK_UI.EquipmentGrid;
const CharacterEffectsList = AFK_UI.CharacterEffectsList;

AFK_UI.CharacterPanel = {
  name: 'CharacterPanel',
  components: { UnlockRequirementsList, MoreInfoButton, EquipmentGrid, PanelHeader, CardSection, CharacterEffectsList },
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
          <CardSection section-key="effects">
            <CharacterEffectsList :effects="char.effectSummary || []" />
          </CardSection>
        </template>
      </div>
    </div>
  `
};

// --- js/ui/InventoryPanel.vue.js ---

AFK_UI.InventoryPanel = {
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

// --- js/ui/ArtifactPanel.vue.js ---

AFK_UI.ArtifactPanel = {
  name: 'ArtifactPanel',
  components: { MoreInfoButton, PanelHeader, CardSection },
  props: { artifacts: Array },
  emits: ['more-info'],
  computed: {
    unknownLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('unknownEntity') || '';
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="artifacts" />
      <CardSection section-key="overview" level="panel" :first="true">
        <p class="hint-text" style="margin-bottom:0">Permanent collection bonuses — kept through prestige and ascension.</p>
      </CardSection>
      <CardSection section-key="collection" level="panel">
        <div v-for="art in artifacts" :key="art.codeName" class="card" :class="{ acquired: art.acquired }">
          <div class="card-header">
            <span class="card-icon">{{ art.icon }}</span>
            <span class="card-name">{{ art.acquired ? art.displayName : unknownLabel }}</span>
            <span v-if="art.acquired" class="efficiency-tag" style="color:var(--color-success)">✓ Collected</span>
            <span v-else style="font-size:0.7rem;color:var(--color-muted)">{{ art.rarity }}</span>
            <MoreInfoButton v-if="art.acquired" @click="$emit('more-info', 'artifact', art.codeName)" />
          </div>
          <p v-if="art.acquired" style="font-size:0.75rem;color:var(--color-muted)">{{ art.description }}</p>
          <p v-else style="font-size:0.75rem;color:var(--color-muted)">Discover this artifact through play.</p>
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/AchievementPanel.vue.js ---

AFK_UI.AchievementPanel = {
  name: 'AchievementPanel',
  components: { UnlockRequirementsList, MoreInfoButton, PanelHeader, CardSection },
  props: { achievements: Array },
  emits: ['more-info'],
  template: `
    <div class="panel">
      <PanelHeader panel-key="achievements" />
      <CardSection section-key="allAchievements" level="panel" :first="true">
        <div v-for="ach in achievements" :key="ach.codeName" class="card achievement-badge"
          :class="{ unlocked: ach.unlocked, 'animate__animated animate__bounceIn': ach.unlocked }">
          <div class="card-header">
            <span class="card-icon">{{ ach.icon }}</span>
            <span class="card-name">{{ ach.displayName }}</span>
            <span v-if="ach.unlocked">✓</span>
            <MoreInfoButton @click="$emit('more-info', 'achievement', ach.codeName)" />
          </div>
          <p class="card-description">{{ ach.description }}</p>
          <UnlockRequirementsList v-if="!ach.unlocked && ach.requirementRows?.length"
            :requirements="ach.requirementRows"
            section-key="achievementRequirements"
            :first="true" />
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/AscensionPanel.vue.js ---

AFK_UI.AscensionPanel = {
  name: 'AscensionPanel',
  components: { UnlockRequirementsList, ResourceProgressList, MoreInfoButton, PanelHeader, CardSection },
  props: {
    tierName: String, currentTier: Number, prestigeCount: Number,
    lifetimePrestiges: Number, projectedGain: Number, canPrestige: Boolean,
    canAscend: Boolean, nextTierName: String,     prestigeRequirements: Array,
    ascensionRequirements: Array, prestigeLost: Array, prestigeKept: Array,
    shardProgress: Object,
    ascendLost: Array, ascendKept: Array, featurePreview: Array,
    prestigeCurrency: Number, formatNumber: Function, maxTierReached: Boolean,
    difficulty: Object, primaryCurrencyLabel: String, prestigeBonuses: Array
  },
  emits: ['prestige', 'ascend', 'buy-bonus', 'more-info'],
  data() { return { showPrestigeModal: false, showAscendModal: false }; },
  template: `
    <div class="panel">
      <PanelHeader panel-key="ascension" />

      <CardSection section-key="overview" level="panel" :first="true">
        <div class="stats-grid">
          <div class="stat-box">{{ tierName }}</div>
          <div class="stat-box">Prestiges: {{ prestigeCount }}</div>
          <div class="stat-box">Lifetime: {{ lifetimePrestiges }}</div>
          <div class="stat-box">Shards: {{ formatNumber(prestigeCurrency) }}</div>
        </div>
      </CardSection>

      <CardSection section-key="prestigeSoftReset" level="panel">
        <div class="card">
          <div class="card-header">
            <span class="card-name">{{ prestigeSectionTitle }}</span>
            <MoreInfoButton @click="$emit('more-info', 'prestige', 'softReset')" />
          </div>
          <UnlockRequirementsList
            :requirements="prestigeRequirements"
            section-key="prestigeRequirements"
            :first="true" />
          <CardSection v-if="shardProgress" section-key="prestigeShards">
            <p class="section-text muted">{{ shardProgress.rulesExplanation }}</p>
            <p class="section-text">Weighted run value: {{ formatNumber(shardProgress.currentRunValue) }} / {{ formatNumber(shardProgress.nextMilestone) }} toward next shard</p>
            <ResourceProgressList :entries="[{
              code: 'shard-overall',
              label: 'Overall shard progress',
              progress: shardProgress.overallProgress,
              met: shardProgress.overallMet
            }]" />
            <ResourceProgressList :entries="(shardProgress.subRequirements || []).map(r => ({
              code: r.code,
              icon: r.icon,
              name: r.name,
              label: r.label,
              progress: r.progress,
              met: r.met
            }))" />
          </CardSection>
          <CardSection section-key="rewards">
            <p class="section-text">Gain: +{{ projectedGain }} Prestige Shards</p>
            <p class="section-text muted">Cost mult: {{ difficulty?.costMultiplier?.toFixed(2) }}× | {{ primaryCurrencyLabel }}: {{ difficulty?.primaryCurrencyMultiplier?.toFixed(2) }}×</p>
          </CardSection>
          <div class="section-actions section-actions-start">
            <button class="btn btn-accent" :disabled="!canPrestige" @click="showPrestigeModal = true">Prestige</button>
          </div>
        </div>
      </CardSection>

      <CardSection section-key="prestigeShop" level="panel">
        <div v-for="bonus in prestigeBonuses" :key="bonus.codeName" class="card nested-card">
          <div class="card-header">
            <span class="card-icon">{{ bonus.icon }}</span>
            <span class="card-name">{{ bonus.displayName }}</span>
            <span class="card-owned">Lv {{ bonus.level }}/{{ bonus.maxLevel }}</span>
            <MoreInfoButton @click="$emit('more-info', 'prestigeBonus', bonus.codeName)" />
          </div>
          <p class="card-description">{{ bonus.description }}</p>
          <UnlockRequirementsList v-if="bonus.locked && bonus.unlockRequirements?.length"
            :requirements="bonus.unlockRequirements"
            section-key="unlockRequirements"
            :first="true" />
          <CardSection v-else-if="bonus.levelProgress" section-key="levelProgress" :first="true">
            <ResourceProgressList :entries="[bonus.levelProgress]" />
          </CardSection>
          <CardSection v-if="!bonus.locked && !bonus.maxed" section-key="purchaseRequirements"
            :first="bonus.locked || !bonus.levelProgress">
            <ResourceProgressList :entries="bonus.costProgress" />
            <div class="section-actions">
              <button class="btn btn-primary btn-sm" :disabled="!bonus.canBuy" @click="$emit('buy-bonus', bonus.codeName)">Buy</button>
            </div>
          </CardSection>
          <CardSection v-else-if="bonus.maxed" section-key="status" :first="!bonus.levelProgress">
            <p class="hint-text" style="margin-bottom:0">{{ maxLevelLabel }}</p>
          </CardSection>
        </div>
      </CardSection>

      <CardSection v-if="!maxTierReached" section-key="ascension" level="panel">
        <div class="card">
          <div class="card-header">
            <span class="card-name">{{ ascendTitle }}</span>
            <MoreInfoButton @click="$emit('more-info', 'ascension', 'next')" />
          </div>
          <UnlockRequirementsList
            :requirements="ascensionRequirements"
            section-key="ascensionRequirements"
            :first="true" />
          <CardSection v-if="featurePreview.length" section-key="unlocksPreview">
            <p class="section-text accent">{{ featurePreview.join(', ') }}</p>
          </CardSection>
          <div class="section-actions section-actions-start">
            <button class="btn btn-primary" :disabled="!canAscend" @click="showAscendModal = true">Ascend</button>
          </div>
        </div>
      </CardSection>

      <div v-if="showPrestigeModal" class="modal-overlay" @click.self="showPrestigeModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Confirm Prestige</h3>
          <UnlockRequirementsList :requirements="prestigeRequirements" section-key="prestigeRequirements" :first="true" />
          <div class="modal-columns">
            <CardSection section-key="lost" :first="true" class="lost">
              <div v-for="l in prestigeLost" :key="l" class="section-text">• {{ l }}</div>
            </CardSection>
            <CardSection section-key="kept" :first="true" class="kept">
              <div v-for="k in prestigeKept" :key="k" class="section-text">• {{ k }}</div>
            </CardSection>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showPrestigeModal = false">Cancel</button>
            <button class="btn btn-accent" @click="$emit('prestige'); showPrestigeModal = false">Prestige (+{{ projectedGain }})</button>
          </div>
        </div>
      </div>

      <div v-if="showAscendModal" class="modal-overlay" @click.self="showAscendModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Ascend to {{ nextTierName }}</h3>
          <CardSection section-key="warning" :first="true">
            <p class="section-text danger">This cannot be undone.</p>
          </CardSection>
          <UnlockRequirementsList :requirements="ascensionRequirements" section-key="ascensionRequirements" />
          <div class="modal-columns">
            <CardSection section-key="lost" class="lost">
              <div v-for="l in ascendLost" :key="l" class="section-text">• {{ l }}</div>
            </CardSection>
            <CardSection section-key="kept" class="kept">
              <div v-for="k in ascendKept" :key="k" class="section-text">• {{ k }}</div>
            </CardSection>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showAscendModal = false">Cancel</button>
            <button class="btn btn-danger" @click="$emit('ascend'); showAscendModal = false">Ascend</button>
          </div>
        </div>
      </div>
    </div>
  `,
  computed: {
    prestigeSectionTitle() {
      return AFK?.ConfigManager?.getSection?.('prestigeSoftReset')?.title || 'Prestige';
    },
    ascendTitle() {
      return `Ascend to ${this.nextTierName}`;
    },
    maxLevelLabel() {
      return AFK?.ConfigManager?.getDefaultLabel?.('maxLevelReached') || '';
    }
  }
};

// --- js/ui/SettingsPanel.vue.js ---

AFK_UI.SettingsPanel = {
  name: 'SettingsPanel',
  components: { PanelHeader, CardSection },
  props: {
    settings: Object,
    saveManagement: Object
  },
  emits: [
    'update-setting', 'export-save', 'import-save', 'reset-game',
    'save-now', 'restore-backup', 'delete-backup', 'delete-all-backups',
    'delete-current-save', 'revert-latest-backup'
  ],
  methods: {
    onImport(e) {
      const file = e.target.files[0];
      if (file) this.$emit('import-save', file);
      e.target.value = '';
    },
    formatLabel(template, vars) {
      if (!template) return '';
      return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
    }
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="settings" />
      <CardSection section-key="display" level="panel" :first="true">
        <div class="settings-row">
          <span>Sidebar Position</span>
          <div class="toggle-group">
            <button class="btn btn-ghost" :class="{ 'btn-primary': settings.sidebarPosition === 'left' }" @click="$emit('update-setting', 'sidebarPosition', 'left')">Left</button>
            <button class="btn btn-ghost" :class="{ 'btn-primary': settings.sidebarPosition === 'right' }" @click="$emit('update-setting', 'sidebarPosition', 'right')">Right</button>
          </div>
        </div>
        <div class="settings-row">
          <span>Sound</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'soundEnabled', !settings.soundEnabled)">{{ settings.soundEnabled ? 'On' : 'Off' }}</button>
        </div>
        <div class="settings-row">
          <span>Notifications</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'notificationsEnabled', !settings.notificationsEnabled)">{{ settings.notificationsEnabled ? 'On' : 'Off' }}</button>
        </div>
        <div class="settings-row">
          <span>Tutorial</span>
          <button class="btn btn-ghost" @click="$emit('update-setting', 'showTutorial', !settings.showTutorial)">{{ settings.showTutorial ? 'On' : 'Off' }}</button>
        </div>
      </CardSection>
      <CardSection section-key="saveData" level="panel">
        <div v-if="saveManagement?.current" class="save-meta">
          <div class="save-meta-row">{{ formatLabel(saveManagement.labels.lastSaved, { time: saveManagement.current.formattedTime }) }}</div>
          <div class="save-meta-row">{{ formatLabel(saveManagement.labels.version, { version: saveManagement.current.version }) }}</div>
          <div v-if="saveManagement.current.integrityWarning" class="save-warning">{{ saveManagement.labels.integrityWarning }}</div>
        </div>
        <div v-else class="hint-text">{{ saveManagement?.labels?.noData }}</div>
        <div class="section-actions section-actions-start save-actions">
          <button class="btn btn-primary" @click="$emit('save-now')">{{ saveManagement?.labels?.saveNow }}</button>
          <button class="btn btn-ghost" @click="$emit('export-save')">{{ saveManagement?.labels?.export }}</button>
          <label class="btn btn-ghost save-import-label">
            {{ saveManagement?.labels?.import }}
            <input type="file" accept=".json" class="save-file-input" @change="onImport" />
          </label>
        </div>
      </CardSection>
      <CardSection section-key="saveBackups" level="panel">
        <p class="hint-text save-backup-hint">{{ saveManagement?.labels?.backupHint }}</p>
        <div v-if="saveManagement?.backups?.length" class="save-backup-list">
          <div v-for="backup in saveManagement.backups" :key="backup.storageIndex" class="save-backup-row">
            <div class="save-backup-info">
              <div class="save-backup-time">{{ backup.formattedTime }}</div>
              <div class="save-backup-meta">
                v{{ backup.version }}
                <span v-if="!backup.integrityValid" class="save-warning-inline">⚠</span>
              </div>
            </div>
            <div class="save-backup-actions">
              <button class="btn btn-ghost btn-sm" @click="$emit('restore-backup', backup.storageIndex)">{{ saveManagement.labels.restore }}</button>
              <button class="btn btn-ghost btn-sm btn-danger-ghost" @click="$emit('delete-backup', backup.storageIndex)">{{ saveManagement.labels.deleteBackup }}</button>
            </div>
          </div>
        </div>
        <div v-else class="hint-text">{{ saveManagement?.labels?.backupsEmpty }}</div>
        <div class="section-actions section-actions-start save-actions">
          <button
            class="btn btn-accent"
            :disabled="!saveManagement?.backups?.length"
            @click="$emit('revert-latest-backup')"
          >{{ saveManagement?.labels?.revertLatest }}</button>
          <button
            class="btn btn-ghost"
            :disabled="!saveManagement?.backups?.length"
            @click="$emit('delete-all-backups')"
          >{{ saveManagement?.labels?.deleteAllBackups }}</button>
        </div>
      </CardSection>
      <CardSection section-key="warning" level="panel">
        <div class="section-actions section-actions-start save-actions">
          <button class="btn btn-ghost btn-danger-ghost" @click="$emit('delete-current-save')">{{ saveManagement?.labels?.deleteCurrent }}</button>
          <button class="btn btn-danger" @click="$emit('reset-game')">{{ saveManagement?.labels?.reset }}</button>
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/StatsPanel.vue.js ---

AFK_UI.StatsPanel = {
  name: 'StatsPanel',
  components: { PanelHeader, CardSection },
  props: {
    stats: Object,
    primaryBreakdown: Object,
    primaryCurrencyLabel: String,
    formatNumber: Function,
    activeEvents: Array,
    getGeneratorLabel: Function
  },
  template: `
    <div class="panel">
      <PanelHeader panel-key="stats" />
      <CardSection section-key="overview" level="panel" :first="true">
        <div class="stats-grid">
          <div class="stat-box">Total Taps: {{ stats.totalTaps }}</div>
          <div class="stat-box">Play Time: {{ Math.floor(stats.playTimeSeconds) }}s</div>
          <div class="stat-box">Peak {{ primaryCurrencyLabel }}: {{ formatNumber(stats.peakPrimaryCurrencyRate) }}/s</div>
          <div class="stat-box">Current {{ primaryCurrencyLabel }}: {{ formatNumber(primaryBreakdown.total) }}/s</div>
        </div>
      </CardSection>
      <CardSection section-key="primaryByGenerator" :title="primaryCurrencyLabel + ' by Generator'" level="panel">
        <div v-for="item in primaryBreakdown.breakdown" :key="item.generator" class="card nested-card">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem">
            <span>{{ getGeneratorLabel ? getGeneratorLabel(item.generator) : item.generator }}</span>
            <span>{{ formatNumber(item.amount) }}/s ({{ item.percent.toFixed(1) }}%)</span>
          </div>
        </div>
      </CardSection>
      <CardSection v-if="activeEvents.length" section-key="activeEvents" level="panel">
        <div v-for="evt in activeEvents" :key="evt.codeName" class="card nested-card">
          {{ evt.icon }} {{ evt.displayName }}
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/ProgressPanel.vue.js ---

AFK_UI.ProgressPanel = {
  name: 'ProgressPanel',
  components: { PanelHeader, CardSection },
  props: { progress: Object },
  template: `
    <div class="panel">
      <PanelHeader panel-key="progress" />
      <CardSection section-key="summary" level="panel" :first="true">
        <div class="progress-summary">
          {{ progress.percentage }}% Complete ({{ progress.passed }}/{{ progress.total }})
        </div>
      </CardSection>
      <CardSection v-for="(items, section, index) in progress.sections" :key="section"
        :title="section" level="panel">
        <div v-for="item in items" :key="item.id" class="progress-item" :class="item.passed ? 'pass' : 'fail'">
          <span>{{ item.passed ? '✓' : '✗' }}</span>
          <span>{{ item.label }}</span>
        </div>
      </CardSection>
    </div>
  `
};

// --- js/ui/ActionBar.vue.js ---
const TapButton = AFK_UI.TapButton;
const SkillSlot = AFK_UI.SkillSlot;
const BoostSlot = AFK_UI.BoostSlot;

AFK_UI.ActionBar = {
  name: 'ActionBar',
  components: { TapButton, SkillSlot, BoostSlot },
  props: { tapGainFormatted: String, primaryIcon: String, skills: Array, boosts: Array },
  emits: ['tap', 'activate-skill', 'use-boost'],
  template: `
    <div class="action-bar">
      <TapButton :gain-formatted="tapGainFormatted" :primary-icon="primaryIcon" @tap="$emit('tap')" />
      <div class="action-bar-center">
        <SkillSlot v-for="skill in skills" :key="skill.codeName" :skill="skill" @activate="$emit('activate-skill', $event)" />
        <BoostSlot v-for="boost in boosts" :key="boost.codeName" :boost="boost" @use="$emit('use-boost', $event)" />
      </div>
      <TapButton :gain-formatted="tapGainFormatted" :primary-icon="primaryIcon" @tap="$emit('tap')" />
    </div>
  `
};

// --- js/ui/App.vue.js ---
const GameSelectorPanel = AFK_UI.GameSelectorPanel;
const ResourceBar = AFK_UI.ResourceBar;
const GeneratorPanel = AFK_UI.GeneratorPanel;
const UpgradePanel = AFK_UI.UpgradePanel;
const CharacterPanel = AFK_UI.CharacterPanel;
const InventoryPanel = AFK_UI.InventoryPanel;
const ArtifactPanel = AFK_UI.ArtifactPanel;
const AchievementPanel = AFK_UI.AchievementPanel;
const AscensionPanel = AFK_UI.AscensionPanel;
const SettingsPanel = AFK_UI.SettingsPanel;
const StatsPanel = AFK_UI.StatsPanel;
const ProgressPanel = AFK_UI.ProgressPanel;
const ActionBar = AFK_UI.ActionBar;
const Toast = AFK_UI.Toast;
const EventBanner = AFK_UI.EventBanner;
const UnlockModal = AFK_UI.UnlockModal;
const InfoModal = AFK_UI.InfoModal;

AFK_UI.App = {
  name: 'App',
  components: {
    GameSelectorPanel, ResourceBar, GeneratorPanel, UpgradePanel, CharacterPanel,
    InventoryPanel, ArtifactPanel, AchievementPanel, AscensionPanel,
    SettingsPanel, StatsPanel, ProgressPanel, ActionBar, Toast, EventBanner,
    UnlockModal, InfoModal, CardSection, PanelHeader
  },
  props: {
    game: Object
  },
  data() {
    return { unlockModal: null, infoModal: null };
  },
  computed: {
    state() { return this.game.state; },
    config() { return this.game.config; },
    formatNumber() {
      return (v) => this.game.formatNumber(v);
    },
    sidebarClass() {
      return this.state.settings.sidebarPosition === 'left' ? 'sidebar-left' : 'sidebar-right';
    },
    allTabs() {
      return this.config?.defaults?.tabs || [];
    },
    engineTabs() {
      return [{ id: 'gameSelector', icon: '🎮', label: 'Games' }];
    },
    tabs() {
      return [...this.engineTabs, ...this.allTabs.filter(t => !t.devOnly || this.state.settings.devMode)];
    },
    gameSelectorData() {
      return this.game.getGameSelectorDisplay();
    },
    resourceBarItems() {
      return this.game.getResourceBarItems();
    },
    resourceDeltas() {
      void this.game._reactiveTick;
      return this.state.ui.resourceDeltas || [];
    },
    primaryCurrencyLabel() {
      return this.game.getPrimaryCurrencyLabel();
    },
    primaryCurrencyRate() {
      return this.game.getPrimaryCurrencyRateFormatted();
    },
    primaryBreakdown() {
      return this.game.getPrimaryCurrencyBreakdown();
    },
    generators() {
      return this.game.getGeneratorDisplay();
    },
    upgrades() {
      return this.game.getUpgradeDisplay();
    },
    bestUpgradeCode() {
      return this.state.ui.bestUpgradeCode;
    },
    characters() {
      return this.game.getCharacterDisplay();
    },
    achievements() {
      return this.game.getAchievementDisplay();
    },
    inventoryItems() {
      return this.game.getInventoryDisplay();
    },
    equipableItems() {
      return this.game.getEquipableItems();
    },
    equipmentSlots() {
      return this.game.getEquipmentSlots();
    },
    equipmentSlotLayout() {
      return this.game.getEquipmentSlotLayout();
    },
    artifacts() {
      return this.game.getArtifactDisplay();
    },
    ascensionData() {
      return this.game.getAscensionDisplay();
    },
    statsData() {
      return this.game.getStatsDisplay();
    },
    progressData() {
      return this.game.getProgress();
    },
    skills() {
      return this.game.getSkillSlots();
    },
    boosts() {
      return this.game.getBoostSlots();
    },
    tapGainFormatted() {
      return this.formatNumber(this.game.getTapGain());
    },
    primaryIcon() {
      return this.game.getPrimaryIcon();
    },
    eventBannerItems() {
      return this.game.getEventBannerItems();
    },
    formulaInspector() {
      return this.state.ui.formulaInspector;
    },
    offlineModal() {
      return this.game.offlineModal;
    },
    saveManagement() {
      return this.game.getSaveManagementDisplay();
    },
    uiTick() {
      return this.game._reactiveTick;
    }
  },
  methods: {
    isTabUnlocked(tab) {
      if (tab.id === 'gameSelector') return true;
      if (tab.devOnly) return this.state.settings.devMode;
      if (!tab.feature) return true;
      return this.game.isFeatureUnlocked(tab.feature);
    },
    showUnlockModal(tab) {
      this.unlockModal = this.game.getFeatureUnlockInfo(tab.feature);
      this.unlockModal.title = this.unlockModal.title || tab.label;
    },
    closeUnlockModal() {
      this.unlockModal = null;
    },
    showInfoModal(type, codeName) {
      const info = this.game.getEntityInfo(type, codeName);
      if (info) this.infoModal = info;
    },
    closeInfoModal() {
      this.infoModal = null;
    },
    onSelectGame(contentId) { this.game.switchContent(contentId); },
    onTabClick(tab) {
      if (this.isTabUnlocked(tab)) {
        this.game.setTab(tab.id);
      } else {
        this.showUnlockModal(tab);
      }
    },
    onTabLockClick(tab, event) {
      event.stopPropagation();
      this.showUnlockModal(tab);
    },
    onMoreInfo(type, codeName) {
      this.showInfoModal(type, codeName);
    },
    onTap() { this.game.onTap(); },
    onBuyGenerator(code) { this.game.onBuyGenerator(code); },
    onBuyUpgrade(code) { this.game.onBuyUpgrade(code); },
    onMultiplierChange(val) { this.game.setPurchaseMultiplier(val); },
    onToggleCharacter(code) { this.game.toggleCharacter(code); },
    onActivateSkill(code) { this.game.activateSkill(code); },
    onUseBoost(code) { this.game.useBoost(code); },
    onEquip(char, slot, item) { this.game.equipItem(char, slot, item); },
    onUnequip(char, slot) { this.game.unequipItem(char, slot); },
    onPrestige() { this.game.performPrestige(); },
    onAscend() { this.game.performAscend(); },
    onBuyBonus(code) { this.game.buyPrestigeBonus(code); },
    onUpdateSetting(key, val) { this.game.updateSetting(key, val); },
    onExportSave() { this.game.exportSave(); },
    onImportSave(file) { this.game.importSave(file); },
    onSaveNow() { this.game.saveNow(); },
    onRestoreBackup(index) { this.game.restoreBackup(index); },
    onDeleteBackup(index) { this.game.deleteBackup(index); },
    onDeleteAllBackups() { this.game.deleteAllBackups(); },
    onDeleteCurrentSave() { this.game.deleteCurrentSave(); },
    onRevertLatestBackup() { this.game.revertToLatestBackup(); },
    onResetGame() { this.game.resetGame(); },
    resolveItem(code) {
      return this.game.getItemDisplay(code);
    },
    formatEquipEffect(effect) {
      return this.describeEffectShort(effect) || this.game.describeEffect(effect);
    },
    dismissOffline() { this.game.dismissOfflineModal(); },
    formatCostEntries(cost) {
      return this.game.formatCostEntries(cost);
    },
    getResourceMeta(code) {
      return this.game.getResourceMeta(code);
    },
    describeEffectShort(effect) {
      return this.game.describeEffectShort(effect);
    }
  },
  template: `
    <div class="app-container" :class="sidebarClass">
      <ResourceBar :resources="resourceBarItems" :primary-currency-rate="primaryCurrencyRate"
        :primary-icon="primaryIcon" :deltas="resourceDeltas"
        :get-resource-label="game.getResourceLabel.bind(game)" :format-number="formatNumber" />
      <EventBanner :events="eventBannerItems" />
      <div class="main-layout">
        <div class="content-area">
          <GameSelectorPanel v-if="state.ui.activeTab === 'gameSelector'"
            :games="gameSelectorData.games"
            :current-game="gameSelectorData.currentGame"
            @select-game="onSelectGame" />
          <GeneratorPanel v-if="state.ui.activeTab === 'generators'"
            :generators="generators" :multiplier="state.ui.purchaseMultiplier"
            :multiplier-options="config.framework.ui.purchaseMultipliers"
            :format-number="formatNumber"
            :primary-currency-label="primaryCurrencyLabel"
            @buy="onBuyGenerator" @multiplier-change="onMultiplierChange"
            @more-info="onMoreInfo" />
          <UpgradePanel v-if="state.ui.activeTab === 'upgrades'"
            :upgrades="upgrades" :format-number="formatNumber"
            :get-resource-meta="getResourceMeta"
            :best-upgrade-code="bestUpgradeCode"
            :primary-currency-label="primaryCurrencyLabel"
            @buy="onBuyUpgrade" @more-info="onMoreInfo" />
          <CharacterPanel v-if="state.ui.activeTab === 'characters'"
            :characters="characters" :max-active="config.framework.characters.maxActive"
            :active-count="game.getActiveCharacterCount()"
            :equipment-slot-layout="equipmentSlotLayout"
            :game-state="state"
            :ui-tick="uiTick"
            :resolve-item="resolveItem"
            :format-effect="formatEquipEffect"
            @toggle="onToggleCharacter" @equip="onEquip" @unequip="onUnequip"
            @more-info="onMoreInfo" />
          <InventoryPanel v-if="state.ui.activeTab === 'inventory'"
            :items="inventoryItems" :inventory="state.inventory"
            :characters="characters" :equipable-items="equipableItems"
            :describe-effect-short="describeEffectShort"
            @use-boost="onUseBoost" @more-info="onMoreInfo" />
          <ArtifactPanel v-if="state.ui.activeTab === 'artifacts'" :artifacts="artifacts"
            @more-info="onMoreInfo" />
          <AchievementPanel v-if="state.ui.activeTab === 'achievements'" :achievements="achievements"
            @more-info="onMoreInfo" />
          <AscensionPanel v-if="state.ui.activeTab === 'ascension'" v-bind="ascensionData"
            :format-number="formatNumber" :primary-currency-label="primaryCurrencyLabel"
            @prestige="onPrestige" @ascend="onAscend" @buy-bonus="onBuyBonus"
            @more-info="onMoreInfo" />
          <StatsPanel v-if="state.ui.activeTab === 'stats'"
            :stats="statsData" :primary-breakdown="primaryBreakdown"
            :primary-currency-label="primaryCurrencyLabel"
            :get-generator-label="game.getGeneratorLabel.bind(game)"
            :format-number="formatNumber" :active-events="eventBannerItems" />
          <SettingsPanel v-if="state.ui.activeTab === 'settings'"
            :settings="state.settings"
            :save-management="saveManagement"
            @update-setting="onUpdateSetting"
            @export-save="onExportSave"
            @import-save="onImportSave"
            @save-now="onSaveNow"
            @restore-backup="onRestoreBackup"
            @delete-backup="onDeleteBackup"
            @delete-all-backups="onDeleteAllBackups"
            @delete-current-save="onDeleteCurrentSave"
            @revert-latest-backup="onRevertLatestBackup"
            @reset-game="onResetGame" />
          <ProgressPanel v-if="state.ui.activeTab === 'progress'" :progress="progressData" />
          <div v-if="state.settings.devMode && state.ui.activeTab !== 'progress'" class="dev-tools panel">
            <PanelHeader panel-key="devTools" />
            <CardSection section-key="speedControls" level="panel" :first="true">
              <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
                <button v-for="s in config.framework.devTools.speedMultipliers" :key="s"
                  class="btn btn-ghost" @click="game.setSpeed(s)">{{ s }}×</button>
                <button class="btn btn-ghost" @click="game.devAddResources()">+1000 Shards</button>
                <button class="btn btn-ghost" @click="game.devForceEvent()">Force Event</button>
                <button class="btn btn-ghost" @click="game.devExportState()">Log State</button>
              </div>
            </CardSection>
            <CardSection v-if="formulaInspector" section-key="formulaInspector" level="panel">
              <div style="font-size:0.75rem;background:var(--color-bg-card);padding:0.5rem;border-radius:6px">
                <div>Tap gain: {{ formatNumber(formulaInspector.tapGain) }}</div>
                <div>{{ primaryCurrencyLabel }} rate: {{ formatNumber(formulaInspector.primaryRate) }}/s</div>
                <div>Tap %: {{ formulaInspector.tapPercent }}</div>
              </div>
            </CardSection>
          </div>
        </div>
        <nav class="tab-sidebar">
          <button v-for="tab in tabs" :key="tab.id"
            class="tab-btn" :class="{ active: state.ui.activeTab === tab.id, locked: !isTabUnlocked(tab) }"
            @click="onTabClick(tab)" :title="tab.label">
            {{ tab.icon }}
            <span v-if="!isTabUnlocked(tab)" class="tab-lock" @click="onTabLockClick(tab, $event)">🔒</span>
          </button>
        </nav>
      </div>
      <ActionBar :tap-gain-formatted="tapGainFormatted" :primary-icon="primaryIcon"
        :skills="skills" :boosts="boosts"
        @tap="onTap" @activate-skill="onActivateSkill" @use-boost="onUseBoost" />
      <Toast :toasts="state.ui.toasts" />
      <UnlockModal v-if="unlockModal" :info="unlockModal" @close="closeUnlockModal" />
      <InfoModal v-if="infoModal" :info="infoModal" :format-number="formatNumber" @close="closeInfoModal" />
      <div v-if="offlineModal" class="modal-overlay" @click.self="dismissOffline">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Welcome Back!</h3>
          <CardSection section-key="timeAway" :first="true">
            <p class="section-text">You were away for {{ Math.floor(offlineModal.elapsed) }}s</p>
          </CardSection>
          <CardSection section-key="offlineGains">
            <div v-for="(amt, res) in offlineModal.gains" :key="res" class="section-text">
              {{ game.getResourceMeta(res).icon }} {{ game.getResourceLabel(res) }}: +{{ formatNumber(amt) }}
            </div>
          </CardSection>
          <button class="btn btn-primary" style="margin-top:1rem" @click="dismissOffline">Collect</button>
        </div>
      </div>
    </div>
  `
};

}).call(typeof window !== "undefined" ? window : globalThis);
