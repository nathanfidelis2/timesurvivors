import { Vector2 } from '../utils/Vector2.js';

/**
 * @class Player
 * Viajante do Tempo — personagem principal desenhado em canvas puro.
 * Visual: explorador com manto, óculos de engrenagem e aura temporal pulsante.
 */
export class Player {
  constructor(x, y) {
    this.pos = new Vector2(x, y);
    this.speed = 250;
    this.maxHp = 100;
    this.hp = 100;
    this.hpRegen = 2; // Regenera 2 HP por segundo
    this.radius = 20;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 100;
    this.powers = [];

    // --- Estado visual ---
    this._tick = 0;             // tempo acumulado para animações
    this._hitFlash = 0;         // timer de flash ao tomar dano (ms)
    this._moveDir = 1;          // 1 = direita, -1 = esquerda (espelha o sprite)
    this._bobOffset = 0;        // oscilação vertical ao caminhar
    this._particles = [];       // partículas de rastro temporal
  }

  // ─────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────
  update(dt, input) {
    const move = input.getMovementVector();

    if (move.x !== 0 || move.y !== 0) {
      this.pos = this.pos.add(move.mult(this.speed * dt));
      if (move.x !== 0) this._moveDir = move.x > 0 ? 1 : -1;
      this._bobOffset = Math.sin(this._tick * 8) * 3;
    } else {
      this._bobOffset *= 0.85; // suaviza ao parar
    }

    this._tick += dt;
    if (this._hitFlash > 0) this._hitFlash -= dt * 1000;

    // Regeneração de vida
    if (this.hp < this.maxHp && this.hp > 0) {
      this.hp = Math.min(this.maxHp, this.hp + this.hpRegen * dt);
    }

    // Emite partícula de rastro temporal a cada 80ms
    this._particleTimer = (this._particleTimer || 0) + dt * 1000;
    if (this._particleTimer > 80) {
      this._particleTimer = 0;
      this._spawnTrailParticle();
    }

    // Atualiza partículas existentes
    this._particles = this._particles.filter(p => {
      p.life -= dt * 1000;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = p.life / p.maxLife;
      p.radius *= 0.97;
      return p.life > 0;
    });
  }

  _spawnTrailParticle() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.radius * 0.6;
    this._particles.push({
      x: this.pos.x + Math.cos(angle) * dist,
      y: this.pos.y + Math.sin(angle) * dist + this._bobOffset,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20 - 10,
      radius: Math.random() * 4 + 2,
      alpha: 0.7,
      maxLife: 400 + Math.random() * 200,
      life: 400 + Math.random() * 200,
      hue: 180 + Math.random() * 60, // ciano → azul
    });
  }

  // ─────────────────────────────────────────────
  //  DRAW
  // ─────────────────────────────────────────────
  draw(renderer) {
    const ctx = renderer.ctx;
    const cx = Math.round(this.pos.x);
    const cy = Math.round(this.pos.y + this._bobOffset);
    const t = this._tick;
    const flash = this._hitFlash > 0;

    ctx.save();

    // ── Partículas de rastro ──────────────────
    this._particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha * 0.6;
      ctx.fillStyle = `hsl(${p.hue}, 90%, 65%)`;
      ctx.shadowColor = `hsl(${p.hue}, 100%, 70%)`;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ── Aura temporal (anel externo pulsante) ─
    const auraPulse = 0.75 + Math.sin(t * 3) * 0.25;
    const auraRadius = this.radius * 1.8 * auraPulse;
    const auraGrad = ctx.createRadialGradient(cx, cy, this.radius * 0.8, cx, cy, auraRadius);
    auraGrad.addColorStop(0, 'rgba(0, 220, 255, 0.15)');
    auraGrad.addColorStop(1, 'rgba(0, 180, 255, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
    ctx.fillStyle = auraGrad;
    ctx.fill();

    // Anel pontilhado girando
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 1.2);
    ctx.strokeStyle = flash ? 'rgba(255,80,80,0.8)' : 'rgba(0, 200, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ── Sombra no chão ────────────────────────
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.scale(1, 0.35);
    ctx.beginPath();
    ctx.arc(cx, (cy + this.radius + 4) / 0.35, this.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Manto (capa traseira) ─────────────────
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(this._moveDir, 1);
    {
      // Corpo do manto
      const capeSwing = Math.sin(t * 7) * 3;
      ctx.fillStyle = flash ? '#ff4444' : '#1a237e';
      ctx.beginPath();
      ctx.moveTo(-12, -8);
      ctx.quadraticCurveTo(-18 + capeSwing, 6, -10, 20);
      ctx.lineTo(10, 20);
      ctx.quadraticCurveTo(18 - capeSwing, 6, 12, -8);
      ctx.closePath();
      ctx.fill();

      // Borda do manto — dourado
      ctx.strokeStyle = flash ? '#ffaaaa' : '#ffd54f';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // ── Corpo principal ───────────────────────
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(this._moveDir, 1);
    {
      // Pernas
      const legSwing = Math.sin(t * 8) * 5;
      ctx.fillStyle = flash ? '#ff6666' : '#37474f';
      // Perna esquerda
      ctx.beginPath();
      ctx.roundRect(-7, 8, 6, 14 + legSwing, 3);
      ctx.fill();
      // Perna direita
      ctx.beginPath();
      ctx.roundRect(1, 8, 6, 14 - legSwing, 3);
      ctx.fill();

      // Botas
      ctx.fillStyle = flash ? '#ff4444' : '#1a1a2e';
      ctx.beginPath();
      ctx.roundRect(-9, 19 + legSwing, 8, 5, 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(0, 19 - legSwing, 8, 5, 2);
      ctx.fill();

      // Torso
      const torsoGrad = ctx.createLinearGradient(-10, -8, 10, 10);
      torsoGrad.addColorStop(0, flash ? '#ff6666' : '#5c6bc0');
      torsoGrad.addColorStop(1, flash ? '#cc2222' : '#283593');
      ctx.fillStyle = torsoGrad;
      ctx.beginPath();
      ctx.roundRect(-10, -8, 20, 18, [4, 4, 6, 6]);
      ctx.fill();

      // Detalhe: fivela / colete
      ctx.fillStyle = flash ? '#ffaaaa' : '#ffd54f';
      ctx.beginPath();
      ctx.roundRect(-3, -4, 6, 10, 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#ff4444' : '#283593';
      ctx.beginPath();
      ctx.roundRect(-1.5, -2.5, 3, 7, 1);
      ctx.fill();

      // Braços
      const armSwing = Math.sin(t * 8 + Math.PI) * 8;
      ctx.fillStyle = flash ? '#ff6666' : '#5c6bc0';
      // Braço esquerdo
      ctx.save();
      ctx.translate(-12, -2);
      ctx.rotate((armSwing * Math.PI) / 180);
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6, 14, 3);
      ctx.fill();
      ctx.restore();
      // Braço direito
      ctx.save();
      ctx.translate(12, -2);
      ctx.rotate((-armSwing * Math.PI) / 180);
      ctx.beginPath();
      ctx.roundRect(-3, 0, 6, 14, 3);
      ctx.fill();
      ctx.restore();

      // Luvas
      ctx.fillStyle = flash ? '#ffcccc' : '#ffe0b2';
      ctx.beginPath();
      ctx.arc(-12 - Math.sin((armSwing * Math.PI) / 180) * 14, 13, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(12 + Math.sin((armSwing * Math.PI) / 180) * 14, 13, 4, 0, Math.PI * 2);
      ctx.fill();

      // ── Cabeça ──────────────────────────────
      // Pescoço
      ctx.fillStyle = flash ? '#ffaaaa' : '#ffcc80';
      ctx.beginPath();
      ctx.roundRect(-4, -16, 8, 10, 2);
      ctx.fill();

      // Cabeça (rosto)
      const headGrad = ctx.createRadialGradient(-2, -24, 2, 0, -22, 12);
      headGrad.addColorStop(0, flash ? '#ffaaaa' : '#ffe0b2');
      headGrad.addColorStop(1, flash ? '#ff8888' : '#ffb74d');
      ctx.fillStyle = headGrad;
      ctx.beginPath();
      ctx.ellipse(0, -22, 10, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cartola steampunk
      ctx.fillStyle = flash ? '#ff4444' : '#1a237e';
      // aba
      ctx.beginPath();
      ctx.ellipse(0, -30, 13, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      // cilindro
      ctx.beginPath();
      ctx.roundRect(-9, -46, 18, 17, [4, 4, 0, 0]);
      ctx.fill();
      // faixa dourada
      ctx.fillStyle = flash ? '#ffaaaa' : '#ffd54f';
      ctx.beginPath();
      ctx.roundRect(-9, -33, 18, 4, 1);
      ctx.fill();
      // engrenagem na cartola
      this._drawGear(ctx, 0, -41, 5, flash);

      // Óculos / Goggles
      ctx.strokeStyle = flash ? '#ffdddd' : '#ffd54f';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = flash ? 'rgba(255,100,100,0.4)' : 'rgba(0, 220, 255, 0.3)';
      // lente esq
      ctx.beginPath();
      ctx.arc(-4, -22, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // lente dir
      ctx.beginPath();
      ctx.arc(4, -22, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // ponte
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(0, -22);
      ctx.strokeStyle = flash ? '#ffaaaa' : '#ffd54f';
      ctx.lineWidth = 1;
      ctx.moveTo(-0.5, -22);
      ctx.lineTo(0.5, -22);
      ctx.stroke();

      // Bigode
      ctx.strokeStyle = flash ? '#ffcccc' : '#5d4037';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5, -17);
      ctx.quadraticCurveTo(-7, -19, -3, -18);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -17);
      ctx.quadraticCurveTo(7, -19, 3, -18);
      ctx.stroke();

      // Relógio de bolso (no torso)
      ctx.fillStyle = flash ? '#ffaaaa' : '#ffd54f';
      ctx.beginPath();
      ctx.arc(6, -2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = flash ? '#cc0000' : '#e3f2fd';
      ctx.beginPath();
      ctx.arc(6, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      // ponteiros girando
      ctx.strokeStyle = flash ? '#ff4444' : '#1a237e';
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(6 + Math.cos(t * 2 - Math.PI / 2) * 3, -2 + Math.sin(t * 2 - Math.PI / 2) * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(6 + Math.cos(t * 0.3 - Math.PI / 2) * 2.5, -2 + Math.sin(t * 0.3 - Math.PI / 2) * 2.5);
      ctx.stroke();
    }
    ctx.restore();

    // ── Barra de HP estilizada ────────────────
    this._drawHpBar(ctx, cx, cy);

    ctx.restore();
  }

  /** Desenha uma engrenagem pequena no canvas */
  _drawGear(ctx, x, y, r, flash) {
    const teeth = 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this._tick * 1.5);
    ctx.fillStyle = flash ? '#ffaaaa' : '#ffd54f';
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const angle = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? r : r * 0.65;
      i === 0
        ? ctx.moveTo(Math.cos(angle) * rad, Math.sin(angle) * rad)
        : ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
    }
    ctx.closePath();
    ctx.fill();
    // buraco central
    ctx.fillStyle = flash ? '#cc2222' : '#1a237e';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Barra de HP com borda, gradiente e texto */
  _drawHpBar(ctx, cx, cy) {
    const BAR_W = 44;
    const BAR_H = 6;
    const bx = cx - BAR_W / 2;
    const by = cy - this.radius - 18;
    const ratio = Math.max(0, this.hp / this.maxHp);

    // Sombra
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, BAR_W, BAR_H, 3);
    ctx.fill();

    // Fundo escuro
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(bx, by, BAR_W, BAR_H, 3);
    ctx.fill();

    // Preenchimento com gradiente dinâmico por HP
    if (ratio > 0) {
      const hue = ratio > 0.5 ? 120 : ratio > 0.25 ? 40 : 0;
      const barGrad = ctx.createLinearGradient(bx, by, bx + BAR_W * ratio, by);
      barGrad.addColorStop(0, `hsl(${hue}, 90%, 45%)`);
      barGrad.addColorStop(1, `hsl(${hue + 30}, 100%, 65%)`);
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(bx + 1, by + 1, (BAR_W - 2) * ratio, BAR_H - 2, 2);
      ctx.fill();

      // Brilho interno
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.roundRect(bx + 1, by + 1, (BAR_W - 2) * ratio, (BAR_H - 2) * 0.45, 2);
      ctx.fill();
    }

    // Borda
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, BAR_W, BAR_H, 3);
    ctx.stroke();

    // Ícone de coração
    ctx.font = '7px serif';
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('♥', bx - 10, by + BAR_H - 0.5);
  }

  // ─────────────────────────────────────────────
  //  LÓGICA
  // ─────────────────────────────────────────────
  /** Collect all Projectile-based projectiles from powers that use them. */
  getProjectiles() {
    const result = [];
    for (const power of this.powers) {
      if (Array.isArray(power.projectiles)) {
        result.push(...power.projectiles);
      }
    }
    return result;
  }

  gainXp(amount) {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.5);
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    const reduction = this.damageReduction || 0;
    const finalDamage = amount * (1 - reduction);
    this.hp = Math.max(0, this.hp - finalDamage);
    this._hitFlash = 150; // ms de flash vermelho
  }
}
