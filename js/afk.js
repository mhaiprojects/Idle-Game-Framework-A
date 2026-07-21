/** Engine namespace — imported by main.js and test utilities. */
export { EventBus, EVENTS } from './core/EventBus.js';
export { SaveManager } from './core/SaveManager.js';
export { ProgressTracker } from './core/ProgressTracker.js';
export { FormulaEngine } from './game/FormulaEngine.js';
export { ModifierSystem } from './game/ModifierSystem.js';
export { GameState, createInitialState } from './game/GameState.js';
export { GameLoop } from './game/GameLoop.js';
export { GeneratorSystem } from './game/systems/GeneratorSystem.js';
export { PrestigeSystem } from './game/systems/PrestigeSystem.js';
export { AscensionSystem } from './game/systems/AscensionSystem.js';
export { DropSystem } from './game/systems/DropSystem.js';
export { AchievementSystem } from './game/systems/AchievementSystem.js';
export { EventSystem } from './game/systems/EventSystem.js';
export {
  ConfigManager,
  loadContentRegistry,
  loadAllConfigs,
  getSelectedContentId,
  setSelectedContentId,
  getContentRegistry,
  getCurrentContentId,
  getCurrentManifest,
  validateGeneratorChain
} from './core/ConfigManager.js';
