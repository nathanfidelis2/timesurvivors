import { randomRange, weightedRandom } from '../utils/MathUtils.js';
import { Dinosaur }       from '../enemies/prehistoric/Dinosaur.js';
import { CavemanBrute }   from '../enemies/prehistoric/CavemanBrute.js';
import { KnightZombie }   from '../enemies/medieval/KnightZombie.js';
import { DragonHatchling } from '../enemies/medieval/DragonHatchling.js';
import { RobotDrone }     from '../enemies/future/RobotDrone.js';
import { CyberMutant }    from '../enemies/future/CyberMutant.js';

const ENEMY_MAP = {
  Dinosaur, CavemanBrute, KnightZombie, DragonHatchling, RobotDrone, CyberMutant,
};

const ERA_ORDER = ['prehistoric', 'medieval', 'future'];

export class WaveManager {
  constructor(wavesData, erasData) {
    this._waves = wavesData;
    this._eras = erasData;
    this._currentEraIndex = 0;
    this._eraOverride = null;
    this._timers = {};
    this._spawnRadius = 820;
    this._elapsed = 0;
    this._eraElapsed = 0;
    this._activeWaveIndex = 0;
    this._spawnTimers = {};
    this._initSpawnTimers();
  }

  _initSpawnTimers() {
    this._spawnTimers = {};
    const era = this._getCurrentEraId();
    const waveGroups = this._waves[era] || [];
    this._activeWaveIndex = 0;
    for (const group of waveGroups) {
      for (const entry of group.enemies) {
        const key = `${group.time}_${entry.type}`;
        this._spawnTimers[key] = { timer: entry.interval, entry, groupTime: group.time, active: false };
      }
    }
  }

  _getCurrentEraId() {
    if (this._eraOverride !== null) return this._eraOverride;
    return ERA_ORDER[this._currentEraIndex] || 'prehistoric';
  }

  getCurrentEra() {
    const id = this._getCurrentEraId();
    return this._eras.find(e => e.id === id) || this._eras[0];
  }

  forceEra(eraId) {
    this._eraOverride = eraId;
    this._eraElapsed = 0;
    this._initSpawnTimers();
  }

  clearEraOverride() {
    this._eraOverride = null;
  }

  update(dt, player) {
    this._elapsed += dt;
    this._eraElapsed += dt;

    // Natural era progression
    if (this._eraOverride === null) {
      const era = this._eras[this._currentEraIndex];
      if (era && this._elapsed >= era.endTime && this._currentEraIndex < this._eras.length - 1) {
        this._currentEraIndex++;
        this._eraElapsed = 0;
        this._initSpawnTimers();
      }
    }

    const eraId = this._getCurrentEraId();
    const waveGroups = this._waves[eraId] || [];
    const spawnedEnemies = [];

    for (const group of waveGroups) {
      if (this._eraElapsed < group.time) continue;
      for (const entry of group.enemies) {
        const key = `${group.time}_${entry.type}`;
        if (!this._spawnTimers[key]) {
          this._spawnTimers[key] = { timer: 0, entry, groupTime: group.time };
        }
        const timerObj = this._spawnTimers[key];
        timerObj.timer -= dt;
        if (timerObj.timer <= 0) {
          timerObj.timer = entry.interval;
          const enemy = this.spawnEnemy(entry.type, player);
          if (enemy) spawnedEnemies.push(enemy);
        }
      }
    }

    return spawnedEnemies;
  }

  spawnEnemy(type, player) {
    const EnemyClass = ENEMY_MAP[type];
    if (!EnemyClass) return null;
    const angle = randomRange(0, Math.PI * 2);
    const dist = this._spawnRadius + randomRange(-50, 50);
    const x = player.x + Math.cos(angle) * dist;
    const y = player.y + Math.sin(angle) * dist;
    return new EnemyClass(x, y);
  }

  spawnRandomEraEnemy(eraId, player) {
    const eraEnemies = Object.entries(ENEMY_MAP).filter(([name, Cls]) => {
      return Cls.config && Cls.config.era === eraId;
    });
    if (eraEnemies.length === 0) return null;
    const weighted = eraEnemies.map(([name, Cls]) => ({ type: name, spawnWeight: Cls.config.spawnWeight || 1 }));
    const chosen = weightedRandom(weighted);
    return this.spawnEnemy(chosen.type, player);
  }

  get elapsed() { return this._elapsed; }
  get eraElapsed() { return this._eraElapsed; }
}
