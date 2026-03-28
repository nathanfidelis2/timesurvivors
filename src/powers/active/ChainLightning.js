import { Projectile } from '../../entities/Projectile.js';

export class ChainLightning {
  static id = 'ChainLightning';
  static displayName = 'Relâmpago em Cadeia';
  static icon = '⚡';
  static maxLevel = 5;
  static maxChains = 3;

  static getDescription(level) {
    const damages   = [30, 45, 60, 80, 110];
    const cooldowns = [2.5, 2.0, 1.8, 1.5, 1.2];
    const chains    = [2, 3, 3, 4, 5];
    return `Dispara um raio que encadeia ${chains[level - 1]} inimigos. Dano: ${damages[level - 1]}. Cooldown: ${cooldowns[level - 1]}s. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
    this._cooldown = 0;
    this._cooldownMax = 2.5;
    this._damage = 30;
    this._chainCount = 2;
    this._chainRadius = 200;
    this.projectiles = [];
    this._applyStats();
  }

  _applyStats() {
    const damages   = [30, 45, 60, 80, 110];
    const cooldowns = [2.5, 2.0, 1.8, 1.5, 1.2];
    const chains    = [2, 3, 3, 4, 5];
    this._damage      = damages[this.level - 1];
    this._cooldownMax = cooldowns[this.level - 1];
    this._chainCount  = chains[this.level - 1];
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
      this._fire(player, enemies);
      this._cooldown = this._cooldownMax;
    }

    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  _fire(player, enemies) {
    const living = (enemies || []).filter(e => !e.dead);
    if (living.length === 0) return;

    // Find nearest enemy as first target
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of living) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const d = dx * dx + dy * dy;
      if (d < nearestDist) { nearestDist = d; nearest = e; }
    }
    if (!nearest) return;

    // Chain from player → nearest → up to _chainCount more
    let origin = { x: player.x, y: player.y };
    let target = nearest;
    const hit = new Set([target]);

    for (let i = 0; i < this._chainCount; i++) {
      const dx = target.x - origin.x;
      const dy = target.y - origin.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 600;
      const proj = new Projectile(
        origin.x, origin.y,
        (dx / len) * speed, (dy / len) * speed,
        this._damage, 8, '#00d4ff', 1.0,
      );
      this.projectiles.push(proj);

      // Find next closest unvisited enemy within chain radius
      origin = { x: target.x, y: target.y };
      let next = null;
      let nextDist = this._chainRadius * this._chainRadius;
      for (const e of living) {
        if (hit.has(e)) continue;
        const ex = e.x - origin.x;
        const ey = e.y - origin.y;
        const d = ex * ex + ey * ey;
        if (d < nextDist) { nextDist = d; next = e; }
      }
      if (!next) break;
      hit.add(next);
      target = next;
    }
  }

  draw(ctx, camera) {
    for (const p of this.projectiles) p.draw(ctx, camera);
  }

  get cooldownRatio() {
    return this._cooldownMax > 0 ? Math.max(0, this._cooldown / this._cooldownMax) : 0;
  }
}
