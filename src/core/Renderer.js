import { lerp } from '../utils/MathUtils.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = { x: 0, y: 0 };
    this._bgColor = '#3e2723';
    this._bgColorTarget = '#3e2723';
    this._gridColor = '#5d4037';
    this._gridColorTarget = '#5d4037';
    this._accentColor = '#ff8f00';
    this._transitionSpeed = 1.5;
    this._era = null;
    this._lerping = false;
    this._r1 = 62; this._g1 = 39; this._b1 = 35;
    this._r2 = 93; this._g2 = 64; this._b2 = 55;
    this._tr = 62; this._tg = 39; this._tb = 35;
    this._gr = 93; this._gg = 64; this._gb = 55;
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setEra(era) {
    if (this._era === era) return;
    this._era = era;
    const c1 = this._hexToRgb(era.backgroundColor);
    const c2 = this._hexToRgb(era.groundColor);
    this._tr = c1.r; this._tg = c1.g; this._tb = c1.b;
    this._gr = c2.r; this._gg = c2.g; this._gb = c2.b;
    this._accentColor = era.accentColor;
    this._lerping = true;
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  update(dt) {
    if (this._lerping) {
      const t = Math.min(dt * this._transitionSpeed, 1);
      this._r1 = lerp(this._r1, this._tr, t);
      this._g1 = lerp(this._g1, this._tg, t);
      this._b1 = lerp(this._b1, this._tb, t);
      this._r2 = lerp(this._r2, this._gr, t);
      this._g2 = lerp(this._g2, this._gg, t);
      this._b2 = lerp(this._b2, this._gb, t);
      if (Math.abs(this._r1 - this._tr) < 0.5) this._lerping = false;
    }
  }

  followPlayer(player) {
    this.camera.x = player.x - this.canvas.width / 2;
    this.camera.y = player.y - this.canvas.height / 2;
  }

  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.camera.x,
      y: worldY - this.camera.y,
    };
  }

  clear() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.fillStyle = `rgb(${Math.round(this._r1)},${Math.round(this._g1)},${Math.round(this._b1)})`;
    ctx.fillRect(0, 0, w, h);
    this._drawGrid();
  }

  _drawGrid() {
    const ctx = this.ctx;
    const gridSize = 80;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const offX = ((this.camera.x % gridSize) + gridSize) % gridSize;
    const offY = ((this.camera.y % gridSize) + gridSize) % gridSize;
    ctx.strokeStyle = `rgba(${Math.round(this._r2)},${Math.round(this._g2)},${Math.round(this._b2)},0.6)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -offX; x <= w; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = -offY; y <= h; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
  }

  drawCircle(worldX, worldY, radius, color, alpha = 1) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawRect(worldX, worldY, width, height, color, alpha = 1) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x - width / 2, y - height / 2, width, height);
    ctx.restore();
  }

  drawText(text, screenX, screenY, options = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${options.bold ? 'bold ' : ''}${options.size || 16}px ${options.font || 'Arial'}`;
    ctx.fillStyle = options.color || '#ffffff';
    ctx.textAlign = options.align || 'center';
    ctx.textBaseline = options.baseline || 'middle';
    if (options.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
    }
    ctx.fillText(text, screenX, screenY);
    ctx.restore();
  }

  drawRing(worldX, worldY, radius, color, lineWidth = 2, alpha = 1) {
    const { x, y } = this.worldToScreen(worldX, worldY);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  get accentColor() { return this._accentColor; }
}
