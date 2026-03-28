import { Enemy } from '../../entities/Enemy.js';

export class CyberMutant extends Enemy {
  static config = {
    name: 'Cibernético Mutante',
    era: 'future',
    hp: 300,
    speed: 40,
    damage: 60,
    xpDrop: 40,
    size: 52,
    color: '#7c4dff',
    behavior: 'charge',
    spawnWeight: 1,
  };

  constructor(x, y) {
    super(x, y);
    this._chargeTimer = 3.0;
    this._charging = false;
    this._chargeDuration = 0;
    this._chargeVx = 0;
    this._chargeVy = 0;
    this._chargeSpeed = 500;
    this._enrageThreshold = 0.5; // enrage below 50% HP
    this._enraged = false;
    this._pulseTime = 0;
  }

  _behaviorUpdate(dt, player) {
    this._pulseTime += dt;

    // Enrage at low HP
    if (!this._enraged && this.hp / this.maxHp < this._enrageThreshold) {
      this._enraged = true;
      this.speed = 80;
    }

    this._chargeTimer -= dt;

    if (this._charging) {
      this._chargeDuration -= dt;
      this.x += this._chargeVx * dt;
      this.y += this._chargeVy * dt;
      if (this._chargeDuration <= 0) {
        this._charging = false;
        this._chargeTimer = this._enraged ? 1.5 : 3.0;
      }
      return;
    }

    // Slow drift
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;

    if (this._chargeTimer <= 0) {
      this._charging = true;
      this._chargeDuration = 0.6;
      const ndx = dx / dist;
      const ndy = dy / dist;
      this._chargeVx = ndx * this._chargeSpeed;
      this._chargeVy = ndy * this._chargeSpeed;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const r = this.radius;
    const color = this.frozen ? '#90caf9' : (this._enraged ? '#ff1744' : this.color);
    const pulse = Math.sin(this._pulseTime * 3) * 0.3 + 0.7;

    ctx.save();
    // Glowing aura
    ctx.globalAlpha = 0.3 * pulse;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    if (this.frozen) {
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Circuit lines
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - r * 0.5, sy);
    ctx.lineTo(sx + r * 0.5, sy);
    ctx.moveTo(sx, sy - r * 0.5);
    ctx.lineTo(sx, sy + r * 0.5);
    ctx.stroke();

    // Health bar
    const barW = r * 2;
    const barH = 7;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx - r, sy - r - 13, barW, barH);
    ctx.fillStyle = this._enraged ? '#ff1744' : '#f44336';
    ctx.fillRect(sx - r, sy - r - 13, barW * (this.hp / this.maxHp), barH);

    ctx.restore();
  }
}
