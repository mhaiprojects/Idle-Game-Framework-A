export default {
  name: 'SkillSlot',
  props: { skill: Object },
  emits: ['activate'],
  computed: {
    disabled() { return this.skill.cooldownRemaining > 0; },
    cooldownText() { return Math.ceil(this.skill.cooldownRemaining) + 's'; }
  },
  template: `
    <div class="skill-slot" :class="{ disabled }" @click="!disabled && $emit('activate', skill.codeName)" :title="skill.displayName">
      <span>{{ skill.icon }}</span>
      <div v-if="disabled" class="cooldown-overlay">{{ cooldownText }}</div>
    </div>
  `
};
