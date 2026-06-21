export default {
  name: 'AscensionPanel',
  props: {
    tierName: String, currentTier: Number, prestigeCount: Number,
    lifetimePrestiges: Number, projectedGain: Number, canPrestige: Boolean,
    canAscend: Boolean, nextTierName: String, milestones: Array,
    prestigeLost: Array, prestigeKept: Array, ascendLost: Array, ascendKept: Array,
    featurePreview: Array, prestigeCurrency: Number, formatNumber: Function,
    maxTierReached: Boolean, difficulty: Object, primaryCurrencyLabel: String,
    prestigeBonuses: Array, canBuyPrestigeShop: Boolean
  },
  emits: ['prestige', 'ascend', 'buy-bonus'],
  data() { return { showPrestigeModal: false, showAscendModal: false }; },
  methods: {
    bonusCost(bonus) {
      const level = bonus.level || 0;
      return bonus.cost * (level + 1);
    }
  },
  template: `
    <div class="panel">
      <h2 class="panel-title">🔄 Ascension</h2>
      <div class="stats-grid" style="margin-bottom:1rem">
        <div class="stat-box">{{ tierName }}</div>
        <div class="stat-box">Prestiges: {{ prestigeCount }}</div>
        <div class="stat-box">Lifetime: {{ lifetimePrestiges }}</div>
        <div class="stat-box">Shards: {{ formatNumber(prestigeCurrency) }}</div>
      </div>

      <div class="card">
        <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Prestige (Soft Reset)</h3>
        <p style="font-size:0.8rem;margin-bottom:0.5rem">Gain: +{{ projectedGain }} Prestige Shards</p>
        <p style="font-size:0.75rem;color:var(--color-muted)">Cost mult: {{ difficulty?.costMultiplier?.toFixed(2) }}× | {{ primaryCurrencyLabel }}: {{ difficulty?.primaryCurrencyMultiplier?.toFixed(2) }}×</p>
        <button class="btn btn-accent" style="margin-top:0.5rem" :disabled="!canPrestige" @click="showPrestigeModal = true">Prestige</button>
      </div>

      <div class="card" style="margin-top:0.5rem">
        <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Prestige Shop</h3>
        <div v-for="bonus in prestigeBonuses" :key="bonus.codeName" class="card" style="margin-top:0.35rem;padding:0.5rem">
          <div class="card-header">
            <span class="card-icon">{{ bonus.icon }}</span>
            <span class="card-name">{{ bonus.displayName }}</span>
            <span class="card-owned">Lv {{ bonus.level }}/{{ bonus.maxLevel }}</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-muted)">{{ bonus.description }}</p>
          <div class="card-actions">
            <span style="font-size:0.75rem">Cost: {{ bonusCost(bonus) }} shards</span>
            <button class="btn btn-primary btn-sm" :disabled="!bonus.canBuy" @click="$emit('buy-bonus', bonus.codeName)">Buy</button>
          </div>
          <div v-if="bonus.locked" class="locked-conditions" style="margin-top:0.25rem">🔒 {{ bonus.lockReason }}</div>
        </div>
      </div>

      <div class="card" v-if="!maxTierReached" style="margin-top:0.5rem">
        <h3 style="font-size:0.9rem;margin-bottom:0.5rem">Ascend to {{ nextTierName }}</h3>
        <div v-for="(m, i) in milestones" :key="i" style="font-size:0.8rem;margin-bottom:0.35rem">
          <div>{{ m.label }} — {{ m.met ? '✓' : Math.round(m.progress * 100) + '%' }}</div>
          <div class="milestone-bar"><div class="milestone-fill" :style="{ width: (m.progress * 100) + '%' }"></div></div>
        </div>
        <div v-if="featurePreview.length" style="font-size:0.75rem;margin-top:0.5rem;color:var(--color-accent)">
          Unlocks: {{ featurePreview.join(', ') }}
        </div>
        <button class="btn btn-primary" style="margin-top:0.5rem" :disabled="!canAscend" @click="showAscendModal = true">Ascend</button>
      </div>

      <div v-if="showPrestigeModal" class="modal-overlay" @click.self="showPrestigeModal = false">
        <div class="modal animate__animated animate__fadeIn">
          <h3>Confirm Prestige</h3>
          <div class="modal-columns">
            <div class="lost"><h4>LOST</h4><div v-for="l in prestigeLost" :key="l">• {{ l }}</div></div>
            <div class="kept"><h4>KEPT</h4><div v-for="k in prestigeKept" :key="k">• {{ k }}</div></div>
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
          <p style="color:var(--color-danger);font-size:0.85rem;margin-bottom:0.5rem">This cannot be undone.</p>
          <div class="modal-columns">
            <div class="lost"><h4>LOST</h4><div v-for="l in ascendLost" :key="l">• {{ l }}</div></div>
            <div class="kept"><h4>KEPT</h4><div v-for="k in ascendKept" :key="k">• {{ k }}</div></div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="showAscendModal = false">Cancel</button>
            <button class="btn btn-danger" @click="$emit('ascend'); showAscendModal = false">Ascend</button>
          </div>
        </div>
      </div>
    </div>
  `
};
