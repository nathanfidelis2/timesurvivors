import { Enemy } from '../../entities/Enemy.js';

export class Dinosaur extends Enemy {
  static config = {
    name: 'Dinossauro Rex',
    era: 'prehistoric',
    hp: 120,
    speed: 80,
    damage: 25,
    xpDrop: 15,
    size: 48,
    color: '#5a8a3c',
    behavior: 'charge',
    spawnWeight: 3,
  };

  constructor(x, y) {
    super(x, y);
    this._chargeTimer = 0;
    this._chargeCooldown = 2.5;
    this._charging = false;
    this._chargeDuration = 0.5;
    this._chargeVx = 0;
    this._chargeVy = 0;
    this._chargeSpeed = 380;
  }

  _behaviorUpdate(dt, player) {
    this._chargeTimer -= dt;

    if (this._charging) {
      this._chargeDuration -= dt;
      this.x += this._chargeVx * dt;
      this.y += this._chargeVy * dt;
      if (this._chargeDuration <= 0) {
        this._charging = false;
        this._chargeTimer = 2.5;
      }
      return;
    }

    // Drift slowly toward player between charges
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / dist) * (this.speed * 0.4) * dt;
    this.y += (dy / dist) * (this.speed * 0.4) * dt;

    if (this._chargeTimer <= 0) {
      this._charging = true;
      this._chargeDuration = 0.5;
      const ndx = dx / dist;
      const ndy = dy / dist;
      this._chargeVx = ndx * this._chargeSpeed;
      this._chargeVy = ndy * this._chargeSpeed;
    }
  }

  draw(ctx, camera) {
    super.draw(ctx, camera);
    // Draw charge indicator when charging
    if (this._charging) {
      const sx = this.x - camera.x;
      const sy = this.y - camera.y;
      ctx.save();
      ctx.strokeStyle = '#ff6f00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
