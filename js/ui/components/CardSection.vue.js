export default {
  name: 'CardSection',
  props: {
    sectionKey: { type: String, default: '' },
    title: { type: String, default: '' },
    icon: { type: String, default: '' },
    level: { type: String, default: 'card' },
    first: { type: Boolean, default: false }
  },
  computed: {
    sectionClass() {
      return this.level === 'panel' ? 'panel-section' : 'card-section';
    },
    headingClass() {
      return this.level === 'panel' ? 'panel-section-heading' : 'card-section-heading';
    },
    headingTag() {
      return this.level === 'panel' ? 'h3' : 'h4';
    },
    sectionMeta() {
      const cm = typeof AFK !== 'undefined' ? AFK.ConfigManager : null;
      const fromKey = this.sectionKey && cm ? cm.getSection(this.sectionKey) : {};
      return {
        title: this.title || fromKey.title || this.sectionKey || '',
        icon: this.icon || fromKey.icon || ''
      };
    }
  },
  template: `
    <div :class="[sectionClass, { 'section-first': first }]">
      <component :is="headingTag" :class="headingClass">
        <span v-if="sectionMeta.icon" class="section-title-icon">{{ sectionMeta.icon }}</span>
        <span>{{ sectionMeta.title }}</span>
      </component>
      <div class="section-body">
        <slot></slot>
      </div>
    </div>
  `
};
