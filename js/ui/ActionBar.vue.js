import TapButton from './components/TapButton.vue.js';
import SkillSlot from './components/SkillSlot.vue.js';
import BoostSlot from './components/BoostSlot.vue.js';

export default {
  name: 'ActionBar',
  components: { TapButton, SkillSlot, BoostSlot },
  props: { tapGainFormatted: String, primaryIcon: String, skills: Array, boosts: Array, highlightTap: Boolean },
  emits: ['tap', 'activate-skill', 'use-boost'],
  template: `
    <div class="action-bar" :class="{ 'tutorial-highlight-bar': highlightTap }">
      <TapButton class="tutorial-tap-target" :class="{ 'tutorial-pulse': highlightTap }"
        :gain-formatted="tapGainFormatted" :primary-icon="primaryIcon" @tap="$emit('tap')" />
      <div class="action-bar-center">
        <SkillSlot v-for="skill in skills" :key="skill.codeName" :skill="skill" @activate="$emit('activate-skill', $event)" />
        <BoostSlot v-for="boost in boosts" :key="boost.codeName" :boost="boost" @use="$emit('use-boost', $event)" />
      </div>
      <TapButton :gain-formatted="tapGainFormatted" :primary-icon="primaryIcon" @tap="$emit('tap')" />
    </div>
  `
};
