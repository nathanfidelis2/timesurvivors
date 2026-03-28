export class SpriteSheet {
  constructor(width = 32, height = 32, color = '#ffffff') {
    this.width = width;
    this.height = height;
    this.color = color;
    this.loaded = false;
    this.image = null;
  }

  /** Draw a placeholder colored rectangle in lieu of a real sprite. */
  draw(ctx, x, y, w = this.width, h = this.height) {
    ctx.fillStyle = this.color;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
  }

  /** Load an actual image URL when assets are available. */
  load(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.image = img;
        this.loaded = true;
        resolve(this);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  drawFrame(ctx, frameX, frameY, frameW, frameH, destX, destY) {
    if (!this.loaded || !this.image) {
      this.draw(ctx, destX, destY, frameW, frameH);
      return;
    }
    ctx.drawImage(this.image, frameX, frameY, frameW, frameH, destX - frameW / 2, destY - frameH / 2, frameW, frameH);
  }
}
