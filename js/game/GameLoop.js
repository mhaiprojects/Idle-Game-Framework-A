import { EventBus, EVENTS } from '../core/EventBus.js';
import { SaveManager } from '../core/SaveManager.js';
import { FormulaEngine } from './FormulaEngine.js';
import { DropSystem } from './systems/DropSystem.js';
import { AchievementSystem } from './systems/AchievementSystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { AutomationSystem } from './systems/AutomationSystem.js';
import { DirectiveSystem } from './systems/DirectiveSystem.js';

export class GameLoop {
  constructor(gameState, config) {
    this.gameState = gameState;
    this.config = config;
    this.running = false;
    this.accumulator = 0;
    this.lastFrameTime = 0;
    this.autoSaveTimer = 0;
    this.backupTimer = 0;
    this.speedMultiplier = 1;
    this.rafId = null;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    EventSystem.init(this.gameState.state, this.config);
    this._loop(this.lastFrameTime);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  setSpeedMultiplier(mult) {
    this.speedMultiplier = mult;
  }

  _loop(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(t => this._loop(t));

    let deltaMs = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const fw = this.config.framework;
    const maxDelta = fw.gameLoop.maxDeltaCapSeconds * 1000;
    if (deltaMs > maxDelta) deltaMs = maxDelta;

    deltaMs *= this.speedMultiplier;
    this.accumulator += deltaMs;

    const tickInterval = 1000 / fw.gameLoop.tickRate;
    const state = this.gameState.state;

    while (this.accumulator >= tickInterval) {
      const deltaSec = tickInterval / 1000;
      this.gameState.tickProduction(deltaSec);
      DropSystem.onTick(state, this.config, deltaSec, this.gameState);
      EventSystem.tick(state, this.config, deltaSec, this.gameState);
      AchievementSystem.checkAll(state, this.config, this.gameState);
      DirectiveSystem.checkAll(state, this.config, this.gameState);
      AutomationSystem.tick(state, this.config, deltaSec, this.gameState);
      this.accumulator -= tickInterval;
    }

    this.autoSaveTimer += deltaMs;
    if (this.autoSaveTimer >= fw.save.autoSaveIntervalMs) {
      SaveManager.save(this.gameState);
      this.autoSaveTimer = 0;
    }

    this.backupTimer += deltaMs;
    if (this.backupTimer >= fw.save.rollingBackupIntervalMs) {
      SaveManager.saveWithBackup(this.gameState);
      this.backupTimer = 0;
    }
  }

  applyOfflineProgress(lastTimestamp) {
    const fw = this.config.framework;
    const elapsedSec = (Date.now() - lastTimestamp) / 1000;
    if (elapsedSec <= 0) return null;

    const mods = this.gameState.getMods();
    const result = FormulaEngine.calculateOfflineGains(
      elapsedSec, this.gameState.state, this.config, mods, fw.save.offlineCapSeconds
    );

    this.gameState.applyOfflineGains(result.gains, result.elapsed);
    return {
      ...result,
      elapsedSec,
      showModal: elapsedSec >= fw.save.offlineModalMinSeconds
    };
  }
}
