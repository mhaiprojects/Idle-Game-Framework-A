export default {
  name: 'EventBanner',
  props: { events: Array },
  template: `
    <div v-if="events.length" class="event-banner animate__animated animate__fadeInDown">
      <div v-for="evt in events" :key="evt.codeName" class="event-banner-item">
        <span>{{ evt.icon }}</span>
        <span>{{ evt.displayName }}</span>
        <span class="event-timer">{{ Math.ceil(evt.remainingSeconds) }}s</span>
      </div>
    </div>
  `
};
