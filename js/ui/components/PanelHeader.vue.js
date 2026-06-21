export default {
  name: 'PanelHeader',
  props: {
    panelKey: { type: String, required: true }
  },
  computed: {
    panel() {
      const cm = typeof AFK !== 'undefined' ? AFK.ConfigManager : null;
      return cm?.getPanel?.(this.panelKey) || { icon: '', title: this.panelKey };
    }
  },
  template: `
    <h2 class="panel-title">
      <span class="panel-title-icon">{{ panel.icon }}</span>
      <span>{{ panel.title }}</span>
    </h2>
  `
};
