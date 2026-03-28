import { Projectile } from '../../entities/Projectile.js';

export class ParadoxBullets {
  static id = 'ParadoxBullets';
  static displayName = 'Balas Paradoxo';
  static icon = '🔄';
  static maxLevel = 5;

  static getDescription(level) {
    const damages   = [40, 55, 70, 90, 120];
    const cooldowns = [3.0, 2.5, 2.0, 1.8, 1.5];
    const bullets   = [3, 3, 5, 5, 7];
    return `Dispara ${bullets[level - 1]} projéteis que invertem direção. Dano: ${damages[level - 1]}. Cooldown: ${cooldowns[level - 1]}s. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
    this._cooldown = 0;
    this._cooldownMax = 3.0;
    this._damage = 40;
    this._bulletCount = 3;
    this._bulletSpeed = 300;
    this.projectiles = [];
    this._lastDirX = 1;
    this._lastDirY = 0;
    this._applyStats();
  }

  _applyStats() {
    const damages   = [40, 55, 70, 90, 120];
    const cooldowns = [3.0, 2.5, 2.0, 1.8, 1.5];
    const bullets   = [3, 3, 5, 5, 7];
    const speeds    = [300, 320, 340, 360, 400];
    this._damage       = damages[this.level - 1];
    this._cooldownMax  = cooldowns[this.level - 1];
    this._bulletCount  = bullets[this.level - 1];
    this._bulletSpeed  = speeds[this.level - 1];
  }

  onAcquire() {}

  upgrade(newLevel) {
    this.level = newLevel;
    this._applyStats();
  }

  update(dt, player) {
    // Track player movement direction
    if (player._lastDirX !== 0 || player._lastDirY !== 0) {
      this._lastDirX = player._lastDirX;
      this._lastDirY = player._lastDirY;
    }

    if (this._cooldown > 0) {
      this._cooldown -= dt;
    } else {
      this._fire(player);
      this._cooldown = this._cooldownMax;
    }

    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  _fire(player) {
    const baseAngle = Math.atan2(this._lastDirY, this._lastDirX);
    const spread = Math.PI / 6; // 30 degrees between bullets
    const halfCount = Math.floor(this._bulletCount / 2);

    for (let i = -halfCount; i <= halfCount; i++) {
      const angle = baseAngle + i * spread;
      const vx = Math.cos(angle) * this._bulletSpeed;
      const vy = Math.sin(angle) * this._bulletSpeed;
      const proj = new Projectile(player.x, player.y, vx, vy, this._damage, 7, '#ce93d8', 2.5);
      proj.isParadox = true;
      this.projectiles.push(proj);
    }
  }

  draw(ctx, camera) {
    for (const p of this.projectiles) p.draw(ctx, camera);
  }

  get cooldownRatio() {
    return this._cooldownMax > 0 ? Math.max(0, this._cooldown / this._cooldownMax) : 0;
  }
}
