export class LevelUpScreen {
  constructor() {
    this._options = [];
    this._visible = false;
    this._animTime = 0;
    this._cards = [];
    this._hovered = -1;
    this._onSelect = null;
  }

  show(options, onSelect) {
    this._options = options;
    this._visible = true;
    this._animTime = 0;
    this._onSelect = onSelect;
    this._cards = options.map((opt, i) => ({
      opt, i,
      x: 0, y: 0, w: 240, h: 140,
    }));
  }

  hide() {
    this._visible = false;
  }

  handleClick(screenX, screenY, canvasW, canvasH) {
    if (!this._visible) return false;
    const cardInfos = this._getCardRects(canvasW, canvasH);
    for (const card of cardInfos) {
      if (screenX >= card.x && screenX <= card.x + card.w &&
          screenY >= card.y && screenY <= card.y + card.h) {
        if (this._onSelect) this._onSelect(this._options[card.i]);
        return true;
      }
    }
    return true; // consume click even if not on a card
  }

  _getCardRects(canvasW, canvasH) {
    const count = this._options.length;
    const cardW = 240;
    const cardH = 150;
    const gap = 20;
    const totalW = count * cardW + (count - 1) * gap;
    const startX = (canvasW - totalW) / 2;
    const centerY = canvasH / 2;

    return this._options.map((opt, i) => ({
      x: startX + i * (cardW + gap),
      y: centerY - cardH / 2,
      w: cardW,
      h: cardH,
      i,
    }));
  }

  update(dt) {
    if (!this._visible) return;
    this._animTime += dt;
  }

  draw(ctx, canvas) {
    if (!this._visible) return;
    const w = canvas.width;
    const h = canvas.height;

    // Backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);

    // Title
    const slideIn = Math.min(1, this._animTime / 0.3);
    const titleY = h * 0.28 - (1 - slideIn) * 40;
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#ffeb3b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff6f00';
    ctx.shadowBlur = 10;
    ctx.fillText('⬆️  SUBIU DE NÍVEL!', w / 2, titleY);
    ctx.shadowBlur = 0;

    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffffffcc';
    ctx.fillText('Escolha um poder:', w / 2, titleY + 40);

    const cards = this._getCardRects(w, h);

    cards.forEach((card, i) => {
      const opt = this._options[i];
      const cardSlide = Math.min(1, Math.max(0, (this._animTime - i * 0.08) / 0.25));
      const cardY = card.y + (1 - cardSlide) * 60;

      ctx.save();
      ctx.globalAlpha = cardSlide;

      // Card background
      const grad = ctx.createLinearGradient(card.x, cardY, card.x, cardY + card.h);
      grad.addColorStop(0, '#1a237e');
      grad.addColorStop(1, '#283593');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(card.x, cardY, card.w, card.h, 12);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#5c6bc0';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon
      ctx.font = '36px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(opt.icon, card.x + card.w / 2, cardY + 14);

      // Name
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(opt.name, card.x + card.w / 2, cardY + 58);

      // Level indicator
      ctx.font = '12px Arial';
      ctx.fillStyle = '#ffeb3b';
      ctx.fillText(`Nível ${opt.nextLevel}`, card.x + card.w / 2, cardY + 78);

      // Description
      ctx.font = '12px Arial';
      ctx.fillStyle = '#b0bec5';
      this._wrapText(ctx, opt.description, card.x + 12, cardY + 98, card.w - 24, 16);

      ctx.restore();
    });
  }

  _wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    for (const word of words) {
      const testLine = line + word + ' ';
      if (ctx.measureText(testLine).width > maxWidth && line !== '') {
        ctx.fillText(line, x, lineY);
        line = word + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  }
}
