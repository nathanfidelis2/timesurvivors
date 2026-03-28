export class TemporalClone {
  static id = 'TemporalClone';
  static displayName = 'Clone Temporal';
  static icon = '👥';
  static maxLevel = 5;

  static getDescription(level) {
    const durations = [5, 7, 9, 11, 15];
    const cooldowns = [15, 13, 11, 9, 7];
    const dmgMults  = [50, 60, 70, 85, 100];
    return `Cria um clone por ${durations[level - 1]}s. Dano: ${dmgMults[level - 1]}%. Cooldown: ${cooldowns[level - 1]}s. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
    this._cooldown = 0;
    this._cooldownMax = 15;
    this._duration = 5;
    this._damageMult = 0.5;
    this._cloneActive = false;
    this._cloneX = 0;
    this._cloneY = 0;
    this._cloneLife = 0;
    this._cloneOffsetX = -40;
    this._cloneOffsetY = -40;
    this._applyStats();
  }

  _applyStats() {
    const durations = [5, 7, 9, 11, 15];
    const cooldowns = [15, 13, 11, 9, 7];
    const dmgMults  = [0.5, 0.6, 0.7, 0.85, 1.0];
    this._duration    = durations[this.level - 1];
    this._cooldownMax = cooldowns[this.level - 1];
    this._damageMult  = dmgMults[this.level - 1];
  }

  onAcquire() {}

  upgrade(newLevel) {
    this.level = newLevel;
    this._applyStats();
  }

  update(dt, player) {
    if (this._cloneActive) {
      this._cloneLife -= dt;
      // Clone mirrors player movement with an offset
      this._cloneX = player.x + this._cloneOffsetX;
      this._cloneY = player.y + this._cloneOffsetY;

      if (this._cloneLife <= 0) {
        this._cloneActive = false;
      }
    } else if (this._cooldown > 0) {
      this._cooldown -= dt;
    } else {
      // Spawn clone
      this._cloneActive = true;
      this._cloneLife = this._duration;
      this._cloneX = player.x + this._cloneOffsetX;
      this._cloneY = player.y + this._cloneOffsetY;
      this._cooldown = this._cooldownMax;
    }
  }

  /** Returns clone's projectile hits to damage enemies (50% damage aura) */
  getCloneEnemyDamage(enemies, dt) {
    if (!this._cloneActive) return;
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const dx = enemy.x - this._cloneX;
      const dy = enemy.y - this._cloneY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Clone damages enemies within 30px at 10 damage/s
      if (dist < 30 + enemy.radius) {
        enemy.takeDamage(10 * this._damageMult * dt);
      }
    }
  }

  draw(ctx, camera) {
    if (!this._cloneActive) return;
    const sx = this._cloneX - camera.x;
    const sy = this._cloneY - camera.y;
    const alpha = Math.min(1, this._cloneLife);

    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    // Ghost-like blue tint
    ctx.fillStyle = '#80deea';
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  get cooldownRatio() {
    if (this._cloneActive) return 0;
    return this._cooldownMax > 0 ? Math.max(0, this._cooldown / this._cooldownMax) : 0;
  }

  get cloneActive() { return this._cloneActive; }
  get cloneX() { return this._cloneX; }
  get cloneY() { return this._cloneY; }
}
