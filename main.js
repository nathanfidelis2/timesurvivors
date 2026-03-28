import { GameLoop }       from './src/core/GameLoop.js';
import { InputManager }   from './src/core/InputManager.js';
import { Renderer }       from './src/core/Renderer.js';
import { CollisionSystem } from './src/core/CollisionSystem.js';
import { WaveManager }    from './src/core/WaveManager.js';
import { UpgradeSystem }  from './src/core/UpgradeSystem.js';

import { Player }         from './src/entities/Player.js';

import { HUD }            from './src/ui/HUD.js';
import { LevelUpScreen }  from './src/ui/LevelUpScreen.js';
import { MainMenu }       from './src/ui/MainMenu.js';
import { GameOverScreen } from './src/ui/GameOverScreen.js';

import { randomRange, randomFrom } from './src/utils/MathUtils.js';
import { EraShift }       from './src/powers/active/EraShift.js';
import { TemporalClone }  from './src/powers/active/TemporalClone.js';

// ─── XP Orb ──────────────────────────────────────────────────────────────────
class XPOrb {
  constructor(x, y, value) {
    this.x = x; this.y = y;
    this.value = value;
    this.radius = 6 + value / 10;
    this.collected = false;
    this._pulse = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this._pulse += dt * 3;
  }

  draw(ctx, camera) {
    if (this.collected) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    const r = this.radius + Math.sin(this._pulse) * 2;
    ctx.save();
    ctx.fillStyle = '#ffd600';
    ctx.shadowColor = '#ffab00';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── Particle ────────────────────────────────────────────────────────────────
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y;
    this.color = color;
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(60, 200);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = randomRange(3, 8);
    this.life = 1.0;
    this.decay = randomRange(1.0, 2.5);
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.life -= this.decay * dt;
  }

  draw(ctx, camera) {
    if (this.life <= 0) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.radius * this.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  get dead() { return this.life <= 0; }
}

// ─── Game ─────────────────────────────────────────────────────────────────────
class Game {
  constructor() {
    this._canvas = document.getElementById('gameCanvas');
    this._renderer = new Renderer(this._canvas);
    this._input = new InputManager(this._canvas);
    this._hud = new HUD();
    this._levelUpScreen = new LevelUpScreen();
    this._mainMenu = new MainMenu();
    this._gameOverScreen = new GameOverScreen();

    this._state = 'menu'; // menu | playing | levelup | gameover

    this._player = null;
    this._enemies = [];
    this._particles = [];
    this._xpOrbs = [];
    this._elapsedTime = 0;

    this._waveManager = null;
    this._upgradeSystem = null;

    this._wavesData = null;
    this._erasData = null;

    this._loop = new GameLoop(
      (dt) => this._update(dt),
      ()   => this._render(),
    );

    // Input handler
    this._removeClickHandler = this._input.onClickOrTap((x, y) => this._handleClick(x, y));

    window.addEventListener('resize', () => this._renderer.resize());
    this._renderer.resize();
  }

  async init() {
    const [wavesRes, erasRes] = await Promise.all([
      fetch('./data/waves.json'),
      fetch('./data/eras.json'),
    ]);
    this._wavesData = await wavesRes.json();
    this._erasData  = await erasRes.json();
    this._loop.start();
  }

  // ── State machine ──────────────────────────────────────────────────────────
  _startGame() {
    this._enemies = [];
    this._particles = [];
    this._xpOrbs = [];
    this._elapsedTime = 0;

    this._player = new Player(0, 0);
    this._upgradeSystem = new UpgradeSystem();
    this._waveManager = new WaveManager(this._wavesData, this._erasData);

    const era = this._waveManager.getCurrentEra();
    this._renderer.setEra(era);

    this._state = 'playing';
  }

  _triggerLevelUp() {
    this._state = 'levelup';
    const options = this._upgradeSystem.getRandomUpgradeOptions(3);
    if (options.length === 0) {
      // No more upgrades – just continue
      this._state = 'playing';
      return;
    }
    this._levelUpScreen.show(options, (option) => {
      this._upgradeSystem.applyUpgrade(option, this._player);
      this._levelUpScreen.hide();
      this._state = 'playing';
    });
  }

  _triggerGameOver() {
    this._state = 'gameover';
    this._gameOverScreen._animTime = 0;
  }

  // ── Click handling ─────────────────────────────────────────────────────────
  _handleClick(x, y) {
    const w = this._canvas.width;
    const h = this._canvas.height;

    switch (this._state) {
      case 'menu':
        this._mainMenu.handleClick(x, y, w, h, () => this._startGame());
        break;
      case 'levelup':
        this._levelUpScreen.handleClick(x, y, w, h);
        break;
      case 'gameover':
        this._gameOverScreen.handleClick(x, y, w, h,
          () => this._startGame(),
          () => { this._state = 'menu'; }
        );
        break;
    }
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  _update(dt) {
    this._renderer.update(dt);

    switch (this._state) {
      case 'menu':
        this._mainMenu.update(dt);
        break;
      case 'playing':
        this._updatePlaying(dt);
        break;
      case 'levelup':
        this._levelUpScreen.update(dt);
        break;
      case 'gameover':
        this._gameOverScreen.update(dt);
        break;
    }
  }

  _updatePlaying(dt) {
    const player = this._player;
    if (!player) return;

    this._elapsedTime += dt;

    // Wave & era management
    const newEnemies = this._waveManager.update(dt, player);
    this._enemies.push(...newEnemies);

    // Era transition
    const era = this._waveManager.getCurrentEra();
    this._renderer.setEra(era);

    // Player update
    player.update(dt, this._input, this._enemies);

    // Check EraShift power
    for (const power of player.powers) {
      if (power instanceof EraShift && power.hasPendingShift) {
        power.consumeShift();
        this._applyEraShift();
      }
      if (power instanceof TemporalClone) {
        power.getCloneEnemyDamage(this._enemies, dt);
      }
    }

    // Enemy updates
    for (const enemy of this._enemies) {
      enemy.update(dt, player, this._enemies);
    }

    // DragonHatchling projectile collision with player
    for (const enemy of this._enemies) {
      if (enemy.dead || !enemy.projectiles) continue;
      for (const proj of enemy.projectiles) {
        if (proj.dead) continue;
        if (CollisionSystem.checkCircleCollision(proj, player)) {
          player.takeDamage(proj.damage);
          proj.dead = true;
        }
      }
    }

    // Projectile hits
    const playerProjectiles = player.getProjectiles();
    const hits = CollisionSystem.checkProjectileHits(playerProjectiles, this._enemies);
    for (const { projectile, enemy } of hits) {
      if (projectile.hasHit && projectile.hasHit(enemy)) continue;
      enemy.takeDamage(projectile.damage);
      if (projectile.onHit) projectile.onHit(enemy);
    }

    // Enemy-player contact
    const contacts = CollisionSystem.getEnemyPlayerContacts(player, this._enemies);
    for (const enemy of contacts) {
      CollisionSystem.resolvePlayerEnemyCollision(player, enemy);
      enemy.tryContactDamage(player);
    }

    // Dead enemies → particles + XP orbs
    const living = [];
    for (const enemy of this._enemies) {
      if (enemy.dead) {
        this._spawnParticles(enemy.x, enemy.y, enemy.color, 8);
        this._xpOrbs.push(new XPOrb(enemy.x, enemy.y, enemy.xpDrop));
      } else {
        living.push(enemy);
      }
    }
    this._enemies = living;

    // XP orb collection
    const collected = CollisionSystem.checkOrbCollection(player, this._xpOrbs);
    let leveled = false;
    for (const orb of collected) {
      orb.collected = true;
      if (player.gainXP(orb.value)) leveled = true;
    }
    this._xpOrbs = this._xpOrbs.filter(o => !o.collected);
    for (const orb of this._xpOrbs) orb.update(dt);

    // Particles
    for (const p of this._particles) p.update(dt);
    this._particles = this._particles.filter(p => !p.dead);

    // Check player death
    if (player.dead) {
      this._triggerGameOver();
      return;
    }

    // Level-up
    if (leveled) {
      this._triggerLevelUp();
    }

    // Follow player with camera
    this._renderer.followPlayer(player);
  }

  _applyEraShift() {
    const eras = this._erasData;
    const currentEraId = this._waveManager.getCurrentEra().id;
    const others = eras.filter(e => e.id !== currentEraId);
    const newEra = randomFrom(others);
    // Clear enemies
    this._enemies.forEach(e => {
      this._spawnParticles(e.x, e.y, e.color, 4);
    });
    this._enemies = [];
    this._waveManager.forceEra(newEra.id);
    this._renderer.setEra(newEra);
    // Spawn a small wave of the new era
    for (let i = 0; i < 5; i++) {
      const enemy = this._waveManager.spawnRandomEraEnemy(newEra.id, this._player);
      if (enemy) this._enemies.push(enemy);
    }
  }

  _spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this._particles.push(new Particle(x, y, color));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    const renderer = this._renderer;
    const ctx = this._canvas.getContext('2d');
    const camera = renderer.camera;

    renderer.clear();

    switch (this._state) {
      case 'menu':
        this._mainMenu.draw(ctx, this._canvas);
        break;

      case 'playing':
      case 'levelup': {
        // World entities
        for (const orb of this._xpOrbs) orb.draw(ctx, camera);
        for (const enemy of this._enemies) enemy.draw(ctx, camera);
        for (const p of this._particles) p.draw(ctx, camera);
        if (this._player) this._player.draw(ctx, camera);

        // HUD
        const era = this._waveManager ? this._waveManager.getCurrentEra() : null;
        this._hud.draw(ctx, this._canvas, this._player, era, this._elapsedTime);

        // Virtual joystick
        this._drawJoystick(ctx);

        // Level-up overlay (rendered on top)
        if (this._state === 'levelup') {
          this._levelUpScreen.draw(ctx, this._canvas);
        }
        break;
      }

      case 'gameover':
        this._gameOverScreen.draw(ctx, this._canvas,
          this._elapsedTime, this._player ? this._player.level : 1);
        break;
    }
  }

  _drawJoystick(ctx) {
    const js = this._input.getJoystickState();
    const baseX = 90;
    const baseY = this._canvas.height - 90;
    const baseRadius = 55;
    const knobRadius = 24;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(baseX, baseY, baseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffffaa';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = js.active ? 0.75 : 0.4;
    const knobX = baseX + (js.active ? js.dx : 0);
    const knobY = baseY + (js.active ? js.dy : 0);
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(knobX, knobY, knobRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Bootstrap
const game = new Game();
game.init().catch(console.error);

export { game };
