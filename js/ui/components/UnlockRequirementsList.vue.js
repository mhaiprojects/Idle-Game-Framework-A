export default {
  name: 'UnlockRequirementsList',
  props: {
    requirements: { type: Array, default: () => [] },
    heading: { type: String, default: 'Unlock requirements:' }
  },
  template: `
    <div v-if="requirements.length" class="unlock-requirements-inline">
      <p class="unlock-heading">{{ heading }}</p>
      <div v-for="(req, i) in requirements" :key="i" class="unlock-req-row">
        <span class="unlock-req-icon">{{ req.icon }}</span>
        <div style="flex:1">
          <div :style="{ color: req.met ? 'var(--color-success)' : 'var(--color-text)' }">
            {{ req.met ? '✓' : '✗' }} {{ req.label }}
          </div>
          <div v-if="req.progress != null && !req.met" class="milestone-bar" style="margin-top:0.25rem">
            <div class="milestone-fill" :style="{ width: Math.round(req.progress * 100) + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  `
};
