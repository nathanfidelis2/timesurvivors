export class InputManager {
  constructor(canvas) {
    this._canvas = canvas;
    this._keys = new Set();
    this._joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, touchId: null };
    this._clickCallbacks = [];

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchMove = this._onTouchMove.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
    this._onClick = this._onClick.bind(this);

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    canvas.addEventListener('click', this._onClick);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this._canvas.removeEventListener('touchstart', this._onTouchStart);
    this._canvas.removeEventListener('touchmove', this._onTouchMove);
    this._canvas.removeEventListener('touchend', this._onTouchEnd);
    this._canvas.removeEventListener('touchcancel', this._onTouchEnd);
    this._canvas.removeEventListener('click', this._onClick);
  }

  _onKeyDown(e) { this._keys.add(e.code); }
  _onKeyUp(e)   { this._keys.delete(e.code); }

  _onTouchStart(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (!this._joystick.active && touch.clientY > window.innerHeight * 0.5) {
        this._joystick.active = true;
        this._joystick.touchId = touch.identifier;
        this._joystick.startX = touch.clientX;
        this._joystick.startY = touch.clientY;
        this._joystick.dx = 0;
        this._joystick.dy = 0;
      }
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._joystick.touchId) {
        const dx = touch.clientX - this._joystick.startX;
        const dy = touch.clientY - this._joystick.startY;
        const maxRadius = 60;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxRadius) {
          this._joystick.dx = (dx / dist) * maxRadius;
          this._joystick.dy = (dy / dist) * maxRadius;
        } else {
          this._joystick.dx = dx;
          this._joystick.dy = dy;
        }
      }
    }
  }

  _onTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (touch.identifier === this._joystick.touchId) {
        this._joystick.active = false;
        this._joystick.touchId = null;
        this._joystick.dx = 0;
        this._joystick.dy = 0;

        // Fire click callbacks for UI taps
        this._clickCallbacks.forEach(cb => cb(touch.clientX, touch.clientY));
      }
    }
  }

  _onClick(e) {
    this._clickCallbacks.forEach(cb => cb(e.clientX, e.clientY));
  }

  onClickOrTap(callback) {
    this._clickCallbacks.push(callback);
    return () => {
      this._clickCallbacks = this._clickCallbacks.filter(c => c !== callback);
    };
  }

  getMoveDirection() {
    let x = 0, y = 0;

    if (this._keys.has('KeyW') || this._keys.has('ArrowUp'))    y -= 1;
    if (this._keys.has('KeyS') || this._keys.has('ArrowDown'))  y += 1;
    if (this._keys.has('KeyA') || this._keys.has('ArrowLeft'))  x -= 1;
    if (this._keys.has('KeyD') || this._keys.has('ArrowRight')) x += 1;

    if (this._joystick.active) {
      const maxRadius = 60;
      x += this._joystick.dx / maxRadius;
      y += this._joystick.dy / maxRadius;
    }

    const len = Math.sqrt(x * x + y * y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  }

  getJoystickState() {
    return { ...this._joystick };
  }

  isKeyDown(code) {
    return this._keys.has(code);
  }
}
