import { Enemy } from '../../entities/Enemy.js';

export class KnightZombie extends Enemy {
  static config = {
    name: 'Cavaleiro Zumbi',
    era: 'medieval',
    hp: 180,
    speed: 65,
    damage: 35,
    xpDrop: 20,
    size: 36,
    color: '#78909c',
    behavior: 'chase',
    spawnWeight: 3,
  };

  constructor(x, y) {
    super(x, y);
    // Knights march in a straight line then re-orient
    this._stepTimer = 0;
    this._stepInterval = 0.8;
    this._dirX = 0;
    this._dirY = 0;
  }

  _behaviorUpdate(dt, player) {
    this._stepTimer -= dt;
    if (this._stepTimer <= 0) {
      this._stepTimer = this._stepInterval;
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this._dirX = dx / dist;
      this._dirY = dy / dist;
    }
    this.x += this._dirX * this.speed * dt;
    this.y += this._dirY * this.speed * dt;
  }

  draw(ctx, camera) {
    super.draw(ctx, camera);
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    // Draw shield icon
    ctx.save();
    ctx.fillStyle = '#b0bec5';
    ctx.fillRect(sx - 6, sy - 6, 12, 12);
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 6, sy - 6, 12, 12);
    ctx.restore();
  }
}
