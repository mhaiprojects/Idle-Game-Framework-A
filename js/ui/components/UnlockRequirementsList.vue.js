import ProgressBar from './ProgressBar.vue.js';
import CardSection from './CardSection.vue.js';

export default {
  name: 'UnlockRequirementsList',
  components: { ProgressBar, CardSection },
  props: {
    requirements: { type: Array, default: () => [] },
    heading: { type: String, default: 'Unlock Requirements' },
    first: { type: Boolean, default: false }
  },
  template: `
    <CardSection v-if="requirements.length" :title="heading" :first="first">
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
