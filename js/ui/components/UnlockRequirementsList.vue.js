import ProgressBar from './ProgressBar.vue.js';

export default {
  name: 'UnlockRequirementsList',
  components: { ProgressBar },
  props: {
    requirements: { type: Array, default: () => [] },
    heading: { type: String, default: 'Unlock requirements:' }
  },
  template: `
    <div v-if="requirements.length" class="unlock-requirements-inline">
      <p class="unlock-heading">{{ heading }}</p>
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
    </div>
  `
};
