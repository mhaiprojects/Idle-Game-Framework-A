export default {
  name: 'CardSection',
  props: {
    title: { type: String, required: true },
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
    }
  },
  template: `
    <div :class="[sectionClass, { 'section-first': first }]">
      <component :is="headingTag" :class="headingClass">{{ title }}</component>
      <div class="section-body">
        <slot></slot>
      </div>
    </div>
  `
};
