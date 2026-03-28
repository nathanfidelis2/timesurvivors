/**
 * @file PowerSelectScreen.js
 * @folder src/ui/
 *
 * Tela de seleção inicial de poder.
 * Exibe 3 cartas animadas antes do jogo começar.
 * Integra com o Renderer via canvas 2D.
 */

import { clamp, easeIn, easeOutElastic } from '../utils/MathUtils.js';

// ─── Descrições visuais de cada poder ──────────────────────────────────────

const POWER_VISUALS = {
  ChainLightning: {
    icon: '⚡',
    color: '#00d4ff',
    glowColor: 'rgba(0, 212, 255, 0.35)',
    gradient: ['#001a2e', '#003a5c'],
    tag: 'Controle',
    tagColor: '#00d4ff',
  },
  TimeFreezeBlast: {
    icon: '❄️',
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.35)',
    gradient: ['#1a0a2e', '#2d1055'],
    tag: 'Suporte',
    tagColor: '#a78bfa',
  },
  TemporalClone: {
    icon: '👤',
    color: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.35)',
    gradient: ['#1c1200', '#3d2800'],
    tag: 'Ofensivo',
    tagColor: '#fbbf24',
  },
  ParadoxBullets: {
    icon: '🔮',
    color: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.35)',
    gradient: ['#1f0014', '#3d0028'],
    tag: 'Ofensivo',
    tagColor: '#f472b6',
  },
  EraShift: {
    icon: '🌀',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.35)',
    gradient: ['#001a0e', '#003d21'],
    tag: 'Especial',
    tagColor: '#34d399',
  },
  ChronoAura: {
    icon: '🛡️',
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.35)',
    gradient: ['#1a0800', '#3d1800'],
    tag: 'Passivo',
    tagColor: '#fb923c',
  },
};

const FALLBACK_VISUAL = {
  icon: '✦',
  color: '#ffffff',
  glowColor: 'rgba(255,255,255,0.25)',
  gradient: ['#111', '#222'],
  tag: 'Poder',
  tagColor: '#ffffff',
};

// ─── Classe principal ────────────────────────────────────────────────────────

export class PowerSelectScreen {
  /**
   * @param {object[]} powerOptions  Array com 3 instâncias de poder (já sorteadas)
   * @param {Function} onSelect      Callback(chosenPower) chamado ao confirmar
   */
  constructor(powerOptions, onSelect) {
    this._powers    = powerOptions;
    this._onSelect  = onSelect;
    this._selected  = null;
    this._confirmed = false;

    // Animação de entrada
    this._entranceT = 0;
    this._exitT     = 0;
    this._exiting   = false;

    // Estado de cada carta
    this._cards = powerOptions.map((p, i) => ({
      index:  i,
      power:  p,
      visual: POWER_VISUALS[p.constructor.name] ?? FALLBACK_VISUAL,
      hoverT: 0,
      flipT:  0,
      x: 0, y: 0, w: 0, h: 0,
    }));

    this._unbindInput = null;
  }

  // ─── Ciclo de vida ─────────────────────────────────────────────────────────

  init(canvas) {
    this._canvas = canvas;
    this._bindInput(canvas);
  }

  destroy() {
    if (this._unbindInput) this._unbindInput();
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  /** @param {number} dt segundos */
  update(dt) {
    if (this._confirmed) {
      this._exitT = clamp(this._exitT + dt * 2.5, 0, 1);
      return;
    }

    // Entrada escalonada: cada carta tem delay de 120ms
    this._entranceT = clamp(this._entranceT + dt * 1.8, 0, 1);

    for (let i = 0; i < this._cards.length; i++) {
      const card = this._cards[i];
      const delay = i * 0.15;
      card.flipT = clamp((this._entranceT - delay) * 2, 0, 1);
      const isHovered = this._selected === i;
      card.hoverT += ((isHovered ? 1 : 0) - card.hoverT) * dt * 10;
    }
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────

  /** @param {CanvasRenderingContext2D} ctx @param {number} W @param {number} H */
  draw(ctx, W, H) {
    const globalAlpha = this._exiting
      ? easeIn(1 - this._exitT)
      : 1;

    ctx.save();
    ctx.globalAlpha = globalAlpha;

    // Overlay escuro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, W, H);

    // Título
    this._drawTitle(ctx, W, H);

    // Cartas
    this._layout(W, H);
    for (const card of this._cards) {
      this._drawCard(ctx, card, W, H);
    }

    // Dica de teclado
    if (this._entranceT >= 1) {
      this._drawHint(ctx, W, H);
    }

    ctx.restore();
  }

  // ── Título ─────────────────────────────────────────────────────────────────

  _drawTitle(ctx, W, H) {
    const progress = clamp(this._entranceT * 2, 0, 1);
    const y = H * 0.13 + (1 - easeOutElastic(progress)) * -40;

    ctx.save();
    ctx.globalAlpha = clamp(this._entranceT * 3, 0, 1);
    ctx.textAlign = 'center';

    ctx.font = '500 13px monospace';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('VIAGEM NO TEMPO', W / 2, y - 28);

    ctx.font = '500 28px serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Escolha seu Poder Inicial', W / 2, y);

    ctx.font = '400 14px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Este poder define sua estratégia para a partida', W / 2, y + 26);

    ctx.restore();
  }

  // ── Layout das cartas ──────────────────────────────────────────────────────

  _layout(W, H) {
    const CARD_W  = Math.min(200, (W - 80) / 3);
    const CARD_H  = CARD_W * 1.55;
    const GAP     = Math.min(24, (W - CARD_W * 3) / 4);
    const totalW  = CARD_W * 3 + GAP * 2;
    const startX  = (W - totalW) / 2;
    const centerY = H * 0.52;

    for (let i = 0; i < this._cards.length; i++) {
      const card = this._cards[i];
      card.w = CARD_W;
      card.h = CARD_H;
      card.x = startX + i * (CARD_W + GAP);
      card.y = centerY - CARD_H / 2;
    }
  }

  // ── Carta individual ───────────────────────────────────────────────────────

  _drawCard(ctx, card, W, H) {
    if (card.flipT <= 0) return;

    const { x, y, w, h, visual, power, hoverT, flipT } = card;
    const eased   = easeOutElastic(flipT);
    const offsetY = (1 - eased) * 60;
    const alpha   = Math.min(flipT * 3, 1);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + w / 2, y + h / 2 + offsetY);

    const hoverLift = hoverT * 12;
    ctx.translate(0, -hoverLift);

    if (hoverT > 0.05) {
      ctx.shadowColor   = visual.glowColor;
      ctx.shadowBlur    = 30 * hoverT;
      ctx.shadowOffsetY = 8 * hoverT;
    }

    this._drawCardBg(ctx, w, h, visual, hoverT);

    ctx.shadowBlur    = 0;
    ctx.shadowOffsetY = 0;
    this._drawCardContent(ctx, w, h, visual, power, hoverT);

    ctx.restore();
  }

  _drawCardBg(ctx, w, h, visual, hoverT) {
    const hw = w / 2, hh = h / 2;
    const r  = 14;

    const grad = ctx.createLinearGradient(-hw, -hh, hw, hh);
    grad.addColorStop(0, visual.gradient[0]);
    grad.addColorStop(1, visual.gradient[1]);

    this._roundRect(ctx, -hw, -hh, w, h, r);
    ctx.fillStyle = grad;
    ctx.fill();

    const borderAlpha = 0.25 + hoverT * 0.55;
    ctx.strokeStyle = visual.color + Math.round(borderAlpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, -hw, -hh, w, h, r);
    ctx.stroke();

    const shine = ctx.createLinearGradient(-hw, -hh, -hw, -hh + h * 0.4);
    shine.addColorStop(0, `rgba(255,255,255,${0.06 + hoverT * 0.06})`);
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    this._roundRect(ctx, -hw, -hh, w, h, r);
    ctx.fillStyle = shine;
    ctx.fill();
  }

  _drawCardContent(ctx, w, h, visual, power, hoverT) {
    const hw  = w / 2;
    const Cls = power.constructor;
    const cfg = {
      name:      Cls.displayName ?? Cls.id ?? Cls.name,
      description: Cls.getDescription ? Cls.getDescription(power.level) : '',
      maxChains: Cls.maxChains,
      maxLevel:  Cls.maxLevel,
    };

    // ── Ícone central ────────────────────────────────────────────────────
    const iconY = -h * 0.22;
    ctx.beginPath();
    ctx.arc(0, iconY, 30 + hoverT * 4, 0, Math.PI * 2);
    ctx.fillStyle = visual.glowColor;
    ctx.fill();

    ctx.font = `${28 + hoverT * 4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.icon, 0, iconY);

    // ── Tag de tipo ───────────────────────────────────────────────────────
    const tagY = -h * 0.03;
    ctx.font = '500 10px monospace';
    ctx.fillStyle = visual.tagColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(visual.tag.toUpperCase(), 0, tagY);

    // ── Nome do poder ─────────────────────────────────────────────────────
    ctx.font = '500 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cfg.name, 0, tagY + 22);

    // ── Descrição ─────────────────────────────────────────────────────────
    ctx.font = '400 11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    this._wrapText(ctx, cfg.description, 0, tagY + 44, w - 28, 16);

    // ── Stats ─────────────────────────────────────────────────────────────
    const statsY = h * 0.28;
    if (cfg.maxChains) {
      this._drawStat(ctx, -hw + 16, statsY, '⚡', `${cfg.maxChains} saltos`, 'Especial', visual.color);
    }
    if (cfg.maxLevel) {
      this._drawStat(ctx, cfg.maxChains ? 0 : -hw + 16, statsY, '✦', `Lv ${cfg.maxLevel}`, 'Máx', visual.color);
    }

    // ── Botão de seleção (no hover) ───────────────────────────────────────
    if (hoverT > 0.1) {
      const btnY = h * 0.43;
      ctx.globalAlpha = hoverT;
      ctx.fillStyle = visual.color + Math.round(hoverT * 230).toString(16).padStart(2, '0');
      this._roundRect(ctx, -50, btnY - 14, 100, 28, 8);
      ctx.fill();
      ctx.font = '500 12px sans-serif';
      ctx.fillStyle = '#000000';
      ctx.textBaseline = 'middle';
      ctx.fillText('Escolher', 0, btnY);
      ctx.globalAlpha = 1;
    }
  }

  _drawStat(ctx, x, y, icon, value, label, color) {
    ctx.textAlign = x < -10 ? 'left' : x > 10 ? 'right' : 'center';
    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(`${icon} ${value}`, x, y);
    ctx.font = '400 10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(label, x, y + 14);
    ctx.textAlign = 'center';
  }

  // ── Dica no rodapé ─────────────────────────────────────────────────────────

  _drawHint(ctx, W, H) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '400 12px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('Clique na carta ou pressione 1 · 2 · 3 para escolher', W / 2, H * 0.88);
    ctx.restore();
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  _bindInput(canvas) {
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width  / rect.width);
      const my = (e.clientY - rect.top)  * (canvas.height / rect.height);
      this._selected = null;
      for (let i = 0; i < this._cards.length; i++) {
        const c = this._cards[i];
        if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
          this._selected = i;
        }
      }
    };

    const onClick = () => {
      if (this._confirmed) return;
      if (this._entranceT < 0.5) return;
      if (this._selected !== null) this._confirmChoice(this._selected);
    };

    const onKey = (e) => {
      if (this._confirmed) return;
      if (this._entranceT < 0.8) return;
      const map = { '1': 0, '2': 1, '3': 2 };
      if (map[e.key] !== undefined) this._confirmChoice(map[e.key]);
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);

    this._unbindInput = () => {
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }

  _confirmChoice(index) {
    if (this._confirmed) return;
    this._confirmed = true;
    this._exiting   = true;
    this._selected  = index;

    setTimeout(() => {
      this._onSelect(this._cards[index].power);
      this.destroy();
    }, 420);
  }

  // ─── Helpers de canvas ────────────────────────────────────────────────────

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  _wrapText(ctx, text, cx, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, currentY);
        line = word;
        currentY += lineH;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, cx, currentY);
  }

  get isFinished() { return this._confirmed && this._exitT >= 1; }
}
