import CardSection from './components/CardSection.vue.js';

export default {
  name: 'ProgressPanel',
  components: { CardSection },
  props: { progress: Object },
  template: `
    <div class="panel">
      <h2 class="panel-title">🔧 Progress Tracker</h2>
      <CardSection title="Summary" level="panel" :first="true">
        <div class="progress-summary">
          {{ progress.percentage }}% Complete ({{ progress.passed }}/{{ progress.total }})
        </div>
      </CardSection>
      <CardSection v-for="(items, section, index) in progress.sections" :key="section"
        :title="section" level="panel">
        <div v-for="item in items" :key="item.id" class="progress-item" :class="item.passed ? 'pass' : 'fail'">
          <span>{{ item.passed ? '✓' : '✗' }}</span>
          <span>{{ item.label }}</span>
        </div>
      </CardSection>
    </div>
  `
};
