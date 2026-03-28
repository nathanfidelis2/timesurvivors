import { Enemy } from '../../entities/Enemy.js';

export class RobotDrone extends Enemy {
  static config = {
    name: 'Drone Robô',
    era: 'future',
    hp: 100,
    speed: 100,
    damage: 20,
    xpDrop: 18,
    size: 30,
    color: '#00bcd4',
    behavior: 'patrol',
    spawnWeight: 3,
  };

  constructor(x, y) {
    super(x, y);
    this._patrolAngle = Math.random() * Math.PI * 2;
    this._patrolRadius = 150 + Math.random() * 100;
    this._patrolCenterX = x;
    this._patrolCenterY = y;
    this._patrolSpeed = 1.5 + Math.random() * 0.5;
    this._chaseRange = 350;
    this._hover = 0;
    this._hoverSpeed = 3;
  }

  _behaviorUpdate(dt, player) {
    this._hover += this._hoverSpeed * dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (dist < this._chaseRange) {
      // Chase player
      this.x += (dx / dist) * this.speed * dt;
      this.y += (dy / dist) * this.speed * dt;
      // Update patrol center to follow along
      this._patrolCenterX = this.x;
      this._patrolCenterY = this.y;
    } else {
      // Patrol with sinusoidal hover offset
      this._patrolAngle += this._patrolSpeed * dt;
      const targetX = player.x + Math.cos(this._patrolAngle) * this._patrolRadius;
      const targetY = player.y + Math.sin(this._patrolAngle) * this._patrolRadius + Math.sin(this._hover) * 20;
      const tdx = targetX - this.x;
      const tdy = targetY - this.y;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy) || 1;
      this.x += (tdx / tdist) * this.speed * dt;
      this.y += (tdy / tdist) * this.speed * dt;
    }
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const r = this.radius;
    const color = this.frozen ? '#90caf9' : this.color;

    ctx.save();
    // Drone body (diamond shape)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx, sy - r);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx, sy + r);
    ctx.lineTo(sx - r, sy);
    ctx.closePath();
    ctx.fill();

    if (this.frozen) {
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Eye
    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    const barW = r * 2;
    const barH = 5;
    ctx.fillStyle = '#333';
    ctx.fillRect(sx - r, sy - r - 10, barW, barH);
    ctx.fillStyle = '#f44336';
    ctx.fillRect(sx - r, sy - r - 10, barW * (this.hp / this.maxHp), barH);

    ctx.restore();
  }
}
