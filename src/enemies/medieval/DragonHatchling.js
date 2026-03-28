import { Enemy } from '../../entities/Enemy.js';
import { FireProjectile } from '../../entities/Projectile.js';

export class DragonHatchling extends Enemy {
  static config = {
    name: 'Filhote de Dragão',
    era: 'medieval',
    hp: 80,
    speed: 120,
    damage: 15,
    xpDrop: 12,
    size: 28,
    color: '#ef5350',
    behavior: 'ranged',
    spawnWeight: 2,
  };

  constructor(x, y) {
    super(x, y);
    this._shootTimer = 2.0;
    this._shootInterval = 2.0;
    this._orbitAngle = Math.random() * Math.PI * 2;
    this._orbitRadius = 220 + Math.random() * 80;
    this._orbitSpeed = 1.2;
    this.projectiles = [];
  }

  _behaviorUpdate(dt, player) {
    // Orbit around the player instead of chasing
    this._orbitAngle += this._orbitSpeed * dt;
    const targetX = player.x + Math.cos(this._orbitAngle) * this._orbitRadius;
    const targetY = player.y + Math.sin(this._orbitAngle) * this._orbitRadius;
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const moveSpeed = Math.min(dist * 3, this.speed);
    this.x += (dx / dist) * moveSpeed * dt;
    this.y += (dy / dist) * moveSpeed * dt;

    // Shoot at player
    this._shootTimer -= dt;
    if (this._shootTimer <= 0) {
      this._shootTimer = this._shootInterval;
      const pdx = player.x - this.x;
      const pdy = player.y - this.y;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
      const speed = 220;
      const proj = new FireProjectile(this.x, this.y, (pdx / pdist) * speed, (pdy / pdist) * speed);
      this.projectiles.push(proj);
    }

    // Update own projectiles
    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  draw(ctx, camera) {
    super.draw(ctx, camera);
    for (const p of this.projectiles) p.draw(ctx, camera);
  }
}
