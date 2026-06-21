import CardSection from './components/CardSection.vue.js';
import PanelHeader from './components/PanelHeader.vue.js';

export default {
  name: 'AchievementPanel',
  components: { PanelHeader, CardSection },
  props: { achievements: Array },
  template: `
    <div class="panel">
      <PanelHeader panel-key="achievements" />
      <CardSection section-key="allAchievements" level="panel" :first="true">
        <div v-for="ach in achievements" :key="ach.codeName" class="card achievement-badge" :class="{ unlocked: ach.unlocked, 'animate__animated animate__bounceIn': ach.unlocked }">
          <div class="card-header">
            <span class="card-icon">{{ ach.icon }}</span>
            <span class="card-name">{{ ach.displayName }}</span>
            <span v-if="ach.unlocked">✓</span>
          </div>
          <p style="font-size:0.75rem;color:var(--color-muted)">{{ ach.description }}</p>
        </div>
      </CardSection>
    </div>
  `
};
