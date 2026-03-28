export class Projectile {
  constructor(x, y, vx, vy, damage, radius = 6, color = '#ffeb3b', lifetime = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.color = color;
    this.lifetime = lifetime;
    this.dead = false;
    this._age = 0;
    this.piercing = false; // if true, doesn't die on first hit
    this._hitEnemies = new Set();
    this.isParadox = false;
    this._reversed = false;
  }

  update(dt) {
    if (this.dead) return;

    this._age += dt;
    if (this._age >= this.lifetime) {
      this.dead = true;
      return;
    }

    // ParadoxBullets reversal after 1 second
    if (this.isParadox && !this._reversed && this._age >= 1.0) {
      this.vx = -this.vx;
      this.vy = -this.vy;
      this._reversed = true;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  onHit(enemy) {
    if (!this.piercing) {
      this.dead = true;
    } else {
      this._hitEnemies.add(enemy);
    }
  }

  hasHit(enemy) {
    return this._hitEnemies.has(enemy);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    ctx.save();
    ctx.fillStyle = this.color;
    // Glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Fire projectile shot by DragonHatchling */
export class FireProjectile extends Projectile {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy, 15, 8, '#ff7043', 2);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.fillStyle = '#ff7043';
    ctx.shadowColor = '#ff5722';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();
    // Inner hot core
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
