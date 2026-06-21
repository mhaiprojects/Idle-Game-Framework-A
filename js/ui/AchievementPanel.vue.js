import UnlockRequirementsList from './components/UnlockRequirementsList.vue.js';
import MoreInfoButton from './components/MoreInfoButton.vue.js';
import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'AchievementPanel',
  components: { UnlockRequirementsList, MoreInfoButton, PanelHeader, CardSection },
  props: { achievements: Array },
  emits: ['more-info'],
  template: `
    <div class="panel">
      <PanelHeader panel-key="achievements" />
      <CardSection section-key="allAchievements" level="panel" :first="true">
        <div v-for="ach in achievements" :key="ach.codeName" class="card achievement-badge"
          :class="{ unlocked: ach.unlocked, 'animate__animated animate__bounceIn': ach.unlocked }">
          <div class="card-header">
            <span class="card-icon">{{ ach.icon }}</span>
            <span class="card-name">{{ ach.displayName }}</span>
            <span v-if="ach.unlocked">✓</span>
            <MoreInfoButton @click="$emit('more-info', 'achievement', ach.codeName)" />
          </div>
          <p class="card-description">{{ ach.description }}</p>
          <UnlockRequirementsList v-if="!ach.unlocked && ach.requirementRows?.length"
            :requirements="ach.requirementRows"
            section-key="achievementRequirements"
            :first="true" />
        </div>
      </CardSection>
    </div>
  `
};
