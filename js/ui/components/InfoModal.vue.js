import UnlockRequirementsList from './UnlockRequirementsList.vue.js';
import CardSection from './CardSection.vue.js';

export default {
  name: 'InfoModal',
  components: { UnlockRequirementsList, CardSection },
  props: { info: Object },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal info-modal animate__animated animate__fadeIn">
        <div class="info-modal-header">
          <span v-if="info.icon" class="card-icon">{{ info.icon }}</span>
          <h3>{{ info.title }}</h3>
        </div>
        <CardSection v-for="(section, i) in info.sections" :key="i"
          :title="section.heading" :first="i === 0">
          <p class="section-text">{{ section.body }}</p>
        </CardSection>
        <UnlockRequirementsList v-if="info.requirements?.length" :requirements="info.requirements" />
        <button class="btn btn-primary" style="margin-top:1rem" @click="$emit('close')">Close</button>
      </div>
    </div>
  `
};
