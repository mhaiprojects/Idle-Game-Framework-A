export default {
  name: 'SkillSlot',
  props: { skill: Object },
  emits: ['activate'],
  computed: {
    disabled() { return this.skill.cooldownRemaining > 0; },
    cooldownText() { return Math.ceil(this.skill.cooldownRemaining) + 's'; }
  },
  template: `
    <div class="skill-slot" :class="{ disabled }"
      @click="!disabled && $emit('activate', skill.codeName)"
      :title="(skill.characterName ? skill.characterName + ': ' : '') + skill.displayName">
      <span class="skill-slot-icon">{{ skill.icon }}</span>
      <span v-if="skill.characterIcon" class="skill-char-badge">{{ skill.characterIcon }}</span>
      <div v-if="disabled" class="cooldown-overlay">{{ cooldownText }}</div>
    </div>
  `
};
