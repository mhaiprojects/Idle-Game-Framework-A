export default {
  name: 'TutorialOverlay',
  props: {
    step: Object,
    stepIndex: Number,
    totalSteps: Number
  },
  emits: ['next', 'skip'],
  template: `
    <div v-if="step" class="tutorial-overlay">
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-card animate__animated animate__fadeInUp">
        <div class="tutorial-step-badge">Step {{ stepIndex + 1 }} / {{ totalSteps }}</div>
        <div class="tutorial-icon">{{ step.icon }}</div>
        <h3 class="tutorial-title">{{ step.title }}</h3>
        <p class="tutorial-message">{{ step.message }}</p>
        <div class="tutorial-actions">
          <button class="btn btn-ghost" @click="$emit('skip')">Skip Tutorial</button>
          <button class="btn btn-primary" @click="$emit('next')">
            {{ stepIndex + 1 >= totalSteps ? 'Finish' : 'Next' }}
          </button>
        </div>
      </div>
    </div>
  `
};
