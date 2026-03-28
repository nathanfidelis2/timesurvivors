export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.hp = 100;
    this.maxHp = 100;
    this.speed = 150;
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 100;
    this.powers = [];
    this.radius = 16;
    this.color = '#4fc3f7';
    this.invincibleTime = 0;
    this.shield = 0;
    this.regenRate = 0;
    this.dead = false;

    // Movement direction for drawing the indicator
    this._lastDirX = 0;
    this._lastDirY = -1;

    // Visual effects
    this._flashTime = 0;
    this._levelUpFlash = 0;

    // Clone reference (set by TemporalClone power)
    this.clone = null;
  }

  update(dt, input, enemies) {
    const dir = input.getMoveDirection();
    if (dir.x !== 0 || dir.y !== 0) {
      this._lastDirX = dir.x;
      this._lastDirY = dir.y;
    }

    this.x += dir.x * this.speed * dt;
    this.y += dir.y * this.speed * dt;

    // Invincibility countdown
    if (this.invincibleTime > 0) {
      this.invincibleTime -= dt;
    }

    // Damage flash
    if (this._flashTime > 0) this._flashTime -= dt;
    if (this._levelUpFlash > 0) this._levelUpFlash -= dt;

    // HP regeneration from ChronoAura
    if (this.regenRate > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.regenRate * dt);
    }

    // Update active powers
    for (const power of this.powers) {
      if (power.update) power.update(dt, this, enemies);
    }
  }

  takeDamage(amount) {
    if (this.invincibleTime > 0) return;
    const reduced = amount * (1 - Math.min(this.shield, 0.9));
    this.hp -= reduced;
    this._flashTime = 0.15;
    this.invincibleTime = 0.5;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  gainXP(amount) {
    this.xp += amount;
    let leveled = false;
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level++;
      this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.3);
      this._levelUpFlash = 0.6;
      leveled = true;
    }
    return leveled;
  }

  getProjectiles() {
    const projectiles = [];
    for (const power of this.powers) {
      if (power.projectiles) projectiles.push(...power.projectiles);
    }
    return projectiles;
  }

  draw(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // Level-up flash ring
    if (this._levelUpFlash > 0) {
      const alpha = this._levelUpFlash / 0.6;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = '#ffeb3b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sx, sy, this.radius + 10 + (1 - alpha) * 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Invincibility blink
    const visible = this.invincibleTime <= 0 || (Math.floor(this.invincibleTime * 10) % 2 === 0);
    if (!visible) return;

    // Body
    const color = this._flashTime > 0 ? '#ff5252' : this.color;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Direction indicator (triangle pointing movement direction)
    const angle = Math.atan2(this._lastDirY, this._lastDirX);
    const tipX = sx + Math.cos(angle) * (this.radius + 8);
    const tipY = sy + Math.sin(angle) * (this.radius + 8);
    const leftX = sx + Math.cos(angle + 2.4) * this.radius * 0.6;
    const leftY = sy + Math.sin(angle + 2.4) * this.radius * 0.6;
    const rightX = sx + Math.cos(angle - 2.4) * this.radius * 0.6;
    const rightY = sy + Math.sin(angle - 2.4) * this.radius * 0.6;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Draw active power effects
    for (const power of this.powers) {
      if (power.draw) power.draw(ctx, camera, this);
    }
  }

  reset(x, y) {
    this.x = x; this.y = y;
    this.hp = 100; this.maxHp = 100;
    this.speed = 150;
    this.xp = 0; this.level = 1; this.xpToNextLevel = 100;
    this.powers = [];
    this.invincibleTime = 0;
    this.shield = 0;
    this.regenRate = 0;
    this.dead = false;
    this._lastDirX = 0; this._lastDirY = -1;
    this._flashTime = 0; this._levelUpFlash = 0;
    this.clone = null;
  }
}
