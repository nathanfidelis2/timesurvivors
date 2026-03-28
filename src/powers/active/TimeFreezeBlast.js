export class TimeFreezeBlast {
  static id = 'TimeFreezeBlast';
  static displayName = 'Explosão Temporal';
  static icon = '❄️';
  static maxLevel = 5;

  static getDescription(level) {
    const durations = [2, 2, 3, 3, 4];
    const cooldowns = [8, 7, 6, 5, 4];
    const damages  = [0, 10, 20, 35, 50];
    return `Congela inimigos por ${durations[level - 1]}s. Cooldown: ${cooldowns[level - 1]}s. Dano ao descongelar: ${damages[level - 1]}. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
    this._cooldown = 0;
    this._cooldownMax = 8;
    this._freezeDuration = 2;
    this._damage = 0;
    this._blastRadius = 300;
    this._blastEffect = 0;
    this._applyStats();
  }

  _applyStats() {
    const durations = [2, 2, 3, 3, 4];
    const cooldowns = [8, 7, 6, 5, 4];
    const damages   = [0, 10, 20, 35, 50];
    this._freezeDuration = durations[this.level - 1];
    this._cooldownMax    = cooldowns[this.level - 1];
    this._damage         = damages[this.level - 1];
  }

  onAcquire() {}

  upgrade(newLevel) {
    this.level = newLevel;
    this._applyStats();
  }

  update(dt, player, enemies) {
    if (this._cooldown > 0) {
      this._cooldown -= dt;
    } else {
      // Auto-trigger
      this._trigger(player, enemies);
      this._cooldown = this._cooldownMax;
    }

    if (this._blastEffect > 0) this._blastEffect -= dt;
  }

  _trigger(player, enemies) {
    this._blastEffect = 0.5;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (dx * dx + dy * dy < this._blastRadius * this._blastRadius) {
        enemy.freeze(this._freezeDuration);
        if (this._damage > 0) {
          enemy.takeDamage(this._damage);
        }
      }
    }
  }

  draw(ctx, camera, player) {
    if (this._blastEffect > 0) {
      const alpha = this._blastEffect / 0.5;
      const progress = 1 - alpha;
      const radius = this._blastRadius * (0.3 + progress * 0.7);
      const sx = player.x - camera.x;
      const sy = player.y - camera.y;

      ctx.save();
      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = '#90caf9';
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  get cooldownRatio() {
    return this._cooldownMax > 0 ? Math.max(0, this._cooldown / this._cooldownMax) : 0;
  }
}
