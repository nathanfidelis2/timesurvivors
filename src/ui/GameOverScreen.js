import { formatTime } from '../utils/MathUtils.js';

export class GameOverScreen {
  constructor() {
    this._animTime = 0;
    this._restartBtn = { x: 0, y: 0, w: 220, h: 56 };
    this._menuBtn    = { x: 0, y: 0, w: 160, h: 44 };
  }

  update(dt) {
    this._animTime += dt;
  }

  _calcLayout(w, h) {
    this._restartBtn.x = w / 2 - this._restartBtn.w / 2;
    this._restartBtn.y = h / 2 + 80;
    this._menuBtn.x = w / 2 - this._menuBtn.w / 2;
    this._menuBtn.y = this._restartBtn.y + this._restartBtn.h + 16;
  }

  handleClick(screenX, screenY, canvasW, canvasH, onRestart, onMenu) {
    this._calcLayout(canvasW, canvasH);
    const rb = this._restartBtn;
    if (screenX >= rb.x && screenX <= rb.x + rb.w &&
        screenY >= rb.y && screenY <= rb.y + rb.h) {
      onRestart();
      return;
    }
    const mb = this._menuBtn;
    if (screenX >= mb.x && screenX <= mb.x + mb.w &&
        screenY >= mb.y && screenY <= mb.y + mb.h) {
      onMenu();
    }
  }

  draw(ctx, canvas, survivedTime, levelReached) {
    const w = canvas.width;
    const h = canvas.height;
    const t = this._animTime;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, w, h);

    // GAME OVER text with shake
    const shake = t < 0.5 ? Math.sin(t * 40) * 6 : 0;
    ctx.save();
    ctx.translate(w / 2 + shake, h / 2 - 120);
    ctx.font = 'bold 64px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#f44336';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#f44336';
    ctx.fillText('GAME OVER', 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();

    // Stats
    const fadeIn = Math.min(1, (t - 0.4) / 0.6);
    ctx.globalAlpha = Math.max(0, fadeIn);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⏱️  Tempo: ${formatTime(survivedTime)}`, w / 2, h / 2 - 30);
    ctx.fillText(`⬆️  Nível alcançado: ${levelReached}`, w / 2, h / 2 + 0);
    ctx.fillText(`🏆  Parabéns pela sua jornada!`, w / 2, h / 2 + 36);

    // Restart button
    this._calcLayout(w, h);
    const rb = this._restartBtn;
    const btnGrad = ctx.createLinearGradient(rb.x, rb.y, rb.x, rb.y + rb.h);
    btnGrad.addColorStop(0, '#1565c0');
    btnGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(rb.x, rb.y, rb.w, rb.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#64b5f6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔄  REINICIAR', rb.x + rb.w / 2, rb.y + rb.h / 2);

    // Menu button
    const mb = this._menuBtn;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(mb.x, mb.y, mb.w, mb.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '18px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('🏠  Menu Principal', mb.x + mb.w / 2, mb.y + mb.h / 2);

    ctx.globalAlpha = 1;
  }
}
