export default {
  name: 'MilestoneCelebration',
  props: {
    milestone: Object
  },
  emits: ['dismiss'],
  template: `
    <div v-if="milestone" class="milestone-overlay" @click.self="$emit('dismiss')">
      <div class="milestone-card animate__animated animate__bounceIn">
        <div class="milestone-icon">{{ milestone.icon }}</div>
        <h2 class="milestone-title">{{ milestone.title }}</h2>
        <p class="milestone-subtitle">{{ milestone.subtitle }}</p>
        <button class="btn btn-primary milestone-btn" @click="$emit('dismiss')">Continue</button>
      </div>
    </div>
  `
};
