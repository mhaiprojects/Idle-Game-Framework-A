export default {
  name: 'Toast',
  props: { toasts: Array },
  template: `
    <div class="toast-container">
      <div v-for="t in toasts" :key="t.id" class="toast animate__animated animate__fadeInDown">{{ t.message }}</div>
    </div>
  `
};
