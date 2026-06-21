import UnlockRequirementsList from './UnlockRequirementsList.vue.js';

export default {
  name: 'InfoModal',
  components: { UnlockRequirementsList },
  props: { info: Object },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal info-modal animate__animated animate__fadeIn">
        <div class="info-modal-header">
          <span v-if="info.icon" class="card-icon">{{ info.icon }}</span>
          <h3>{{ info.title }}</h3>
        </div>
        <div v-for="(section, i) in info.sections" :key="i" class="info-section">
          <h4>{{ section.heading }}</h4>
          <p>{{ section.body }}</p>
        </div>
        <UnlockRequirementsList v-if="info.requirements?.length"
          :requirements="info.requirements" heading="Unlock requirements:" />
        <button class="btn btn-primary" style="margin-top:1rem" @click="$emit('close')">Close</button>
      </div>
    </div>
  `
};
