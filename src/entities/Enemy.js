export class Enemy {
  static config = {
    name: 'Enemy',
    era: 'prehistoric',
    hp: 100,
    speed: 60,
    damage: 20,
    xpDrop: 10,
    size: 24,
    color: '#f44336',
    behavior: 'chase',
    spawnWeight: 1,
  };

  constructor(x, y) {
    const cfg = this.constructor.config;
    this.x = x;
    this.y = y;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.damage = cfg.damage;
    this.xpDrop = cfg.xpDrop;
    this.radius = cfg.size / 2;
    this.color = cfg.color;
    this.behavior = cfg.behavior;
    this.frozen = false;
    this.frozenTime = 0;
    this.dead = false;
    this._damageCooldown = 0;
    // contact damage is applied max once per second
    this._contactCooldown = 0;
  }

  update(dt, player, enemies) {
    if (this.dead) return;

    if (this.frozen) {
      this.frozenTime -= dt;
      if (this.frozenTime <= 0) this.frozen = false;
      return;
    }

    if (this._contactCooldown > 0) this._contactCooldown -= dt;

    this._behaviorUpdate(dt, player, enemies);
  }

  /** Override in subclasses for custom behavior. Default: chase. */
  _behaviorUpdate(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }

  tryContactDamage(player) {
    if (this._contactCooldown > 0) return;
    player.takeDamage(this.damage);
    this._contactCooldown = 1.0;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  freeze(duration) {
    this.frozen = true;
    this.frozenTime = Math.max(this.frozenTime, duration);
  }

  draw(ctx, camera) {
    if (this.dead) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const r = this.radius;

    // Frozen tint overlay
    const color = this.frozen ? '#90caf9' : this.color;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // Frozen blue border
    if (this.frozen) {
      ctx.strokeStyle = '#2196f3';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Health bar
    const barW = r * 2;
    const barH = 5;
    const barX = sx - r;
    const barY = sy - r - 10;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#f44336';
    ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);

    ctx.restore();
  }
}
