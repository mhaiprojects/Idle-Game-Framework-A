import UnlockRequirementsList from './UnlockRequirementsList.vue.js';

export default {
  name: 'UnlockModal',
  components: { UnlockRequirementsList },
  props: { info: Object },
  emits: ['close'],
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal animate__animated animate__fadeIn">
        <h3>🔒 {{ info.title }}</h3>
        <UnlockRequirementsList :requirements="info.requirements" :first="true" />
        <button class="btn btn-primary" style="margin-top:1rem" @click="$emit('close')">OK</button>
      </div>
    </div>
  `
};
