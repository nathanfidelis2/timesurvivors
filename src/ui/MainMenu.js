export class MainMenu {
  constructor() {
    this._animTime = 0;
    this._playBtn = { x: 0, y: 0, w: 200, h: 56 };
  }

  update(dt) {
    this._animTime += dt;
  }

  handleClick(screenX, screenY, canvasW, canvasH, onPlay) {
    this._calcLayout(canvasW, canvasH);
    const btn = this._playBtn;
    if (screenX >= btn.x && screenX <= btn.x + btn.w &&
        screenY >= btn.y && screenY <= btn.y + btn.h) {
      onPlay();
    }
  }

  _calcLayout(w, h) {
    this._playBtn.x = w / 2 - this._playBtn.w / 2;
    this._playBtn.y = h / 2 + 40;
  }

  draw(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const t = this._animTime;

    // Animated background
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8);
    grad.addColorStop(0, '#1a237e');
    grad.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Floating stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 60; i++) {
      const seed = i * 1234.567;
      const sx = (Math.sin(seed) * 0.5 + 0.5) * w;
      const sy = (Math.cos(seed * 1.3) * 0.5 + 0.5) * h;
      const r = 1 + (Math.sin(seed * 2.1) * 0.5 + 0.5) * 2;
      const blink = Math.sin(t * (1 + i * 0.1) + seed) * 0.5 + 0.5;
      ctx.globalAlpha = blink * 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title
    const pulse = Math.sin(t * 1.5) * 0.04 + 1;
    ctx.save();
    ctx.translate(w / 2, h / 2 - 100);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 58px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff6f00';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffeb3b';
    ctx.fillText('⏳ TIME SURVIVORS', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Subtitle
    ctx.font = '20px Arial';
    ctx.fillStyle = '#90caf9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sobreviva através das eras do tempo!', w / 2, h / 2 - 40);

    // Description
    ctx.font = '15px Arial';
    ctx.fillStyle = '#ffffffaa';
    const lines = [
      'Use WASD ou joystick virtual para mover.',
      'Derrote inimigos, colete XP e escolha poderes.',
      'Sobreviva da era Pré-histórica até o Futuro!',
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, h / 2 - 5 + i * 22);
    });

    // Play button
    this._calcLayout(w, h);
    const btn = this._playBtn;
    const btnGrad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.h);
    const btnPulse = Math.sin(t * 2) * 0.1 + 0.9;
    btnGrad.addColorStop(0, `rgba(76,175,80,${btnPulse})`);
    btnGrad.addColorStop(1, `rgba(27,94,32,${btnPulse})`);
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btn.x, btn.y, btn.w, btn.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#81c784';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  JOGAR', btn.x + btn.w / 2, btn.y + btn.h / 2);

    // Version
    ctx.font = '12px Arial';
    ctx.fillStyle = '#ffffff44';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Time Survivors v1.0', w - 10, h - 10);
  }
}
