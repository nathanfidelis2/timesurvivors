export class EraShift {
  static id = 'EraShift';
  static displayName = 'Mudança de Era';
  static icon = '🌀';
  static maxLevel = 5;

  static getDescription(level) {
    const cooldowns = [30, 25, 20, 15, 10];
    return `Muda a era atual e elimina todos os inimigos. Cooldown: ${cooldowns[level - 1]}s. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
    this._cooldown = 0;
    this._cooldownMax = 30;
    this._shiftEffect = 0;
    this._pendingShift = false;
    this._applyStats();
  }

  _applyStats() {
    const cooldowns = [30, 25, 20, 15, 10];
    this._cooldownMax = cooldowns[this.level - 1];
  }

  onAcquire() {}

  upgrade(newLevel) {
    this.level = newLevel;
    this._applyStats();
  }

  /** Called by Game when this power triggers a shift. */
  consumeShift() {
    if (!this._pendingShift) return null;
    this._pendingShift = false;
    return true;
  }

  update(dt) {
    if (this._cooldown > 0) {
      this._cooldown -= dt;
    } else if (!this._pendingShift) {
      this._pendingShift = true;
      this._cooldown = this._cooldownMax;
      this._shiftEffect = 0.8;
    }

    if (this._shiftEffect > 0) this._shiftEffect -= dt;
  }

  draw(ctx, camera, player) {
    if (this._shiftEffect > 0) {
      const alpha = this._shiftEffect / 0.8;
      const sx = player.x - camera.x;
      const sy = player.y - camera.y;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#ce93d8';
      ctx.beginPath();
      ctx.arc(sx, sy, 600 * (1 - alpha), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  get cooldownRatio() {
    return this._cooldownMax > 0 ? Math.max(0, this._cooldown / this._cooldownMax) : 0;
  }

  get hasPendingShift() {
    return this._pendingShift;
  }
}
