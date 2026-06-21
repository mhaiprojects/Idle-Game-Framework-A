export default {
  name: 'Tooltip',
  props: { text: String, visible: Boolean },
  template: `
    <div v-if="visible && text" class="tooltip-popup" style="position:absolute;background:var(--color-bg-card);border:1px solid var(--color-primary);padding:0.5rem;border-radius:6px;font-size:0.75rem;z-index:150;max-width:200px;">{{ text }}</div>
  `
};
