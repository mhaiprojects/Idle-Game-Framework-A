import PanelHeader from './components/PanelHeader.vue.js';
import CardSection from './components/CardSection.vue.js';

export default {
  name: 'GameSelectorPanel',
  components: { PanelHeader, CardSection },
  props: {
    games: Array,
    currentGame: Object
  },
  emits: ['select-game'],
  template: `
    <div class="panel">
      <PanelHeader panel-key="gameSelector" />
      <CardSection section-key="currentGame" level="panel" :first="true">
        <p v-if="currentGame" class="section-text">
          Currently playing: {{ currentGame.icon }} <strong>{{ currentGame.displayName }}</strong>
        </p>
      </CardSection>
      <CardSection section-key="gameCards" level="panel">
        <div class="game-card-grid">
          <div v-for="game in games" :key="game.id"
            class="card game-card"
            :class="{ 'game-card-active': game.active }"
            :style="game.themeColor ? { '--game-accent': game.themeColor } : null">
            <div class="card-header">
              <span class="card-icon game-card-icon">{{ game.icon }}</span>
              <span class="card-name">{{ game.displayName }}</span>
              <span v-if="game.active" class="game-card-badge">Playing</span>
              <span v-else-if="game.hasSave" class="game-card-badge save">Save</span>
            </div>
            <p class="card-description">{{ game.description }}</p>
            <p v-if="game.tagline" class="hint-text">{{ game.tagline }}</p>
            <div class="section-actions section-actions-start">
              <button class="btn" :class="game.active ? 'btn-ghost' : 'btn-primary'"
                :disabled="game.active" @click="$emit('select-game', game.id)">
                {{ game.active ? 'Selected' : (game.hasSave ? 'Continue' : 'Play') }}
              </button>
            </div>
          </div>
        </div>
      </CardSection>
    </div>
  `
};
