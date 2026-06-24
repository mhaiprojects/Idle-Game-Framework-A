import UnlockRequirementsList from './UnlockRequirementsList.vue.js';
import GeneratorProductionList from './GeneratorProductionList.vue.js';
import CardSection from './CardSection.vue.js';

export default {
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
