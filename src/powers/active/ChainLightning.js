/**
 * @file ChainLightning.js
 * @folder src/powers/active/
 *
 * Poder: Raio em Cadeia
 * Lança um raio que salta entre inimigos próximos,
 * causando dano decrescente a cada salto.
 */

import {
  clamp, lerp, randomRange, angleBetween,
  dist, distSq, easeOut,
} from '../../utils/MathUtils.js';

// ─── Configuração estática (balanceamento) ───────────────────────────────────

const BASE_CONFIG = {
  id:           'chain_lightning',
  name:         'Raio em Cadeia',
  description:  'Lança um raio que salta entre inimigos. Cada salto causa menos dano.',
  type:         'active',
  icon:         '⚡',
  cooldown:     2200,    // ms entre disparos
  damage:       38,      // dano no alvo primário
  chainDamage:  0.65,    // multiplicador por salto (65% do anterior)
  maxChains:    3,       // saltos máximos além do alvo primário
  chainRadius:  130,     // px — raio de busca pelo próximo alvo
  stunDuration: 300,     // ms — congelamento elétrico em cada alvo atingido
  maxLevel:     5,

  upgrades: [
    { level: 2, damage: 50,  maxChains: 4,  description: '+1 salto, +12 dano' },
    { level: 3, cooldown: 1800, chainRadius: 160, description: 'Mais rápido e alcance maior' },
    { level: 4, damage: 65,  chainDamage: 0.75, description: 'Dano base e retenção por salto' },
    { level: 5, maxChains: 6, stunDuration: 600, description: '+2 saltos, congelamento duplo' },
  ],
};

// ─── Raio visual (segmentos ziguezagueantes) ─────────────────────────────────

class LightningBolt {
  /**
   * @param {number} x1  @param {number} y1  origem (world)
   * @param {number} x2  @param {number} y2  destino (world)
   * @param {number} thickness espessura do fio principal
   * @param {string} color     string de cor HSL, ex: '180, 100%, 70%'
   */
  constructor(x1, y1, x2, y2, thickness = 2, color = '180, 100%, 70%') {
    this.x1 = x1; this.y1 = y1;
    this.x2 = x2; this.y2 = y2;
    this.thickness = thickness;
    this.color = color;
    this.life = 1.0;
    this.decay = 0.08;
    this.segments = this._buildSegments();
  }

  _buildSegments(depth = 4) {
    const points = [
      { x: this.x1, y: this.y1 },
      { x: this.x2, y: this.y2 },
    ];

    for (let d = 0; d < depth; d++) {
      const next = [];
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const len = dist(a.x, a.y, b.x, b.y);
        const perp = angleBetween(a.x, a.y, b.x, b.y) + Math.PI / 2;
        const offset = randomRange(-len * 0.25, len * 0.25);
        next.push(a, {
          x: mx + Math.cos(perp) * offset,
          y: my + Math.sin(perp) * offset,
        });
      }
      next.push(points[points.length - 1]);
      points.splice(0, points.length, ...next);
    }

    return points;
  }

  update() {
    this.life -= this.decay;
  }

  /** @param {CanvasRenderingContext2D} ctx  (já com translate de câmera aplicado) */
  draw(ctx) {
    if (this.life <= 0) return;
    const alpha = easeOut(this.life);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Camada 1 — brilho externo largo
    ctx.strokeStyle = `hsla(${this.color}, 0.25)`;
    ctx.lineWidth = this.thickness * 5;
    ctx.shadowBlur = 0;
    this._stroke(ctx);

    // Camada 2 — glow médio
    ctx.strokeStyle = `hsla(${this.color}, 0.55)`;
    ctx.lineWidth = this.thickness * 2.5;
    ctx.shadowColor = `hsla(${this.color}, 1)`;
    ctx.shadowBlur = 12;
    this._stroke(ctx);

    // Camada 3 — fio central branco nítido
    ctx.strokeStyle = `hsla(0, 0%, 100%, ${alpha})`;
    ctx.lineWidth = this.thickness * 0.6;
    ctx.shadowBlur = 6;
    this._stroke(ctx);

    ctx.restore();
  }

  _stroke(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.segments[0].x, this.segments[0].y);
    for (let i = 1; i < this.segments.length; i++) {
      ctx.lineTo(this.segments[i].x, this.segments[i].y);
    }
    ctx.stroke();
  }

  get isDead() { return this.life <= 0; }
}

// ─── Partícula de impacto elétrico ──────────────────────────────────────────

class ElectricParticle {
  constructor(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(30, 120);
    this.x = x; this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = 1.0;
    this.decay = randomRange(0.04, 0.10);
    this.radius = randomRange(1.5, 4);
    this.hue = randomRange(160, 220);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.92;
    this.vy *= 0.92;
    this.life -= this.decay;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = easeOut(this.life) * 0.85;
    ctx.fillStyle = `hsl(${this.hue}, 100%, 75%)`;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 80%)`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get isDead() { return this.life <= 0; }
}

// ─── Classe principal ────────────────────────────────────────────────────────

export class ChainLightning {
  // Identifiers used by UpgradeSystem and PowerSelectScreen
  static id          = 'ChainLightning';
  static displayName = 'Raio em Cadeia';
  static icon        = '⚡';
  static maxLevel    = BASE_CONFIG.maxLevel;
  static maxChains   = BASE_CONFIG.maxChains;

  static getDescription(level) {
    const cfg = ChainLightning._configForLevel(level);
    const cdSec = (cfg.cooldown / 1000).toFixed(1);
    return `Lança um raio que encadeia até ${cfg.maxChains} inimigos. Dano: ${cfg.damage}. Cooldown: ${cdSec}s. (Nível ${level})`;
  }

  static _configForLevel(level) {
    const cfg = { ...BASE_CONFIG };
    for (const u of BASE_CONFIG.upgrades) {
      if (u.level <= level) Object.assign(cfg, u);
    }
    return cfg;
  }

  /** @param {number} level nível inicial [1..5] */
  constructor(level = 1) {
    this.level = clamp(level, 1, BASE_CONFIG.maxLevel);
    this.config = ChainLightning._configForLevel(this.level);

    this._cooldownTimer = 0;   // ms restantes até próximo disparo
    this._bolts      = [];     // LightningBolt[] ativos
    this._particles  = [];     // ElectricParticle[] ativas
  }

  onAcquire() {}

  upgrade(newLevel) {
    this.level = clamp(newLevel, 1, BASE_CONFIG.maxLevel);
    this.config = ChainLightning._configForLevel(this.level);
  }

  // ── Update ───────────────────────────────────────────────────────────────

  update(dt, player, enemies) {
    if (this._cooldownTimer > 0) {
      this._cooldownTimer -= dt * 1000;
    } else {
      this._tryFire(player, enemies);
      this._cooldownTimer = this.config.cooldown;
    }

    for (const bolt of this._bolts)     bolt.update();
    for (const p    of this._particles) p.update(dt);

    this._bolts     = this._bolts.filter(b => !b.isDead);
    this._particles = this._particles.filter(p => !p.isDead);
  }

  // ── Lógica de disparo ────────────────────────────────────────────────────

  _tryFire(player, enemies) {
    if (!enemies || enemies.length === 0) return;

    const px = player.pos ? player.pos.x : player.x;
    const py = player.pos ? player.pos.y : player.y;

    const primary = this._closestEnemy(px, py, enemies, new Set());
    if (!primary) return;

    this._executeChain(px, py, primary, enemies);
  }

  _executeChain(fromX, fromY, target, allEnemies, chainIndex = 0, hit = new Set()) {
    const { damage, chainDamage, maxChains, chainRadius, stunDuration } = this.config;

    const dmg = damage * Math.pow(chainDamage, chainIndex);
    target.takeDamage(dmg);

    // Use the enemy's existing freeze mechanic for stun
    target.frozen    = true;
    target.frozenTime = stunDuration / 1000;

    hit.add(target);

    const thickness = lerp(3, 1.2, chainIndex / (maxChains + 1));
    const hue       = lerp(180, 260, chainIndex / (maxChains + 1));
    this._bolts.push(
      new LightningBolt(fromX, fromY, target.x, target.y, thickness, `${hue}, 100%, 70%`)
    );

    this._spawnImpactParticles(target.x, target.y, Math.max(2, 10 - chainIndex * 2));

    if (chainIndex >= maxChains) return;

    const next = this._closestEnemy(target.x, target.y, allEnemies, hit, chainRadius);
    if (!next) return;

    this._executeChain(target.x, target.y, next, allEnemies, chainIndex + 1, hit);
  }

  _closestEnemy(ox, oy, enemies, exclude, maxDist = Infinity) {
    let best     = null;
    let bestDist = maxDist * maxDist;

    for (const e of enemies) {
      if (exclude.has(e)) continue;
      if (e.dead) continue;

      const dSq = distSq(ox, oy, e.x, e.y);
      if (dSq < bestDist) {
        bestDist = dSq;
        best     = e;
      }
    }

    return best;
  }

  _spawnImpactParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      this._particles.push(new ElectricParticle(x, y));
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────────────

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {{ x: number, y: number }}  camera
   */
  draw(ctx, camera) {
    if (this._bolts.length === 0 && this._particles.length === 0) return;

    ctx.save();
    ctx.translate(-(camera ? camera.x : 0), -(camera ? camera.y : 0));

    for (const p    of this._particles) p.draw(ctx);
    for (const bolt of this._bolts)     bolt.draw(ctx);

    ctx.restore();
  }

  // ── Getters para HUD / UpgradeSystem ─────────────────────────────────────

  get cooldownRatio() {
    return 1 - clamp(this._cooldownTimer / this.config.cooldown, 0, 1);
  }

  get isReady()        { return this._cooldownTimer <= 0; }
  get displayName()    { return this.config.name; }
  get displayIcon()    { return this.config.icon; }
  get currentLevel()   { return this.level; }
  get nextUpgradeDesc() {
    const next = BASE_CONFIG.upgrades.find(u => u.level === this.level + 1);
    return next?.description ?? 'Nível máximo atingido';
  }
}

