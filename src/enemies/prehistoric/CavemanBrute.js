import { Enemy } from '../../entities/Enemy.js';

export class CavemanBrute extends Enemy {
  static config = {
    name: 'Homem das Cavernas',
    era: 'prehistoric',
    hp: 200,
    speed: 50,
    damage: 40,
    xpDrop: 25,
    size: 40,
    color: '#8d6e63',
    behavior: 'swarm',
    spawnWeight: 2,
  };

  constructor(x, y) {
    super(x, y);
    this._wobble = Math.random() * Math.PI * 2;
    this._wobbleSpeed = 2 + Math.random() * 2;
  }

  _behaviorUpdate(dt, player, enemies) {
    this._wobble += this._wobbleSpeed * dt;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Slightly unpredictable wobbling movement
    const wobbleX = Math.cos(this._wobble) * 30;
    const wobbleY = Math.sin(this._wobble) * 30;
    const targetX = player.x + wobbleX - this.x;
    const targetY = player.y + wobbleY - this.y;
    const targetDist = Math.sqrt(targetX * targetX + targetY * targetY) || 1;

    this.x += (targetX / targetDist) * this.speed * dt;
    this.y += (targetY / targetDist) * this.speed * dt;

    // Avoid overlapping other enemies
    if (enemies) {
      for (const other of enemies) {
        if (other === this || other.dead) continue;
        const ex = this.x - other.x;
        const ey = this.y - other.y;
        const ed = Math.sqrt(ex * ex + ey * ey) || 1;
        const minDist = this.radius + other.radius;
        if (ed < minDist) {
          const push = (minDist - ed) / ed * 0.5;
          this.x += ex * push;
          this.y += ey * push;
        }
      }
    }
  }
}
