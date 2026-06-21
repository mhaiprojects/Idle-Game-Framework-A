export default {
  name: 'ProgressPanel',
  props: { progress: Object },
  template: `
    <div class="panel">
      <h2 class="panel-title">🔧 Progress Tracker</h2>
      <div style="font-size:1.2rem;font-weight:700;margin-bottom:1rem;color:var(--color-accent)">
        {{ progress.percentage }}% Complete ({{ progress.passed }}/{{ progress.total }})
      </div>
      <div v-for="(items, section) in progress.sections" :key="section" class="progress-section">
        <h4>{{ section }}</h4>
        <div v-for="item in items" :key="item.id" class="progress-item" :class="item.passed ? 'pass' : 'fail'">
          <span>{{ item.passed ? '✓' : '✗' }}</span>
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  `
};
