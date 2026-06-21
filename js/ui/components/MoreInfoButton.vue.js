export default {
  name: 'MoreInfoButton',
  emits: ['click'],
  template: `
    <button type="button" class="more-info-btn" title="More info" aria-label="More info" @click.stop="$emit('click')">!</button>
  `
};
