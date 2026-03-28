import { randomFrom } from '../utils/MathUtils.js';

import { TemporalShield }   from '../powers/passive/TemporalShield.js';
import { ChronoAura }       from '../powers/passive/ChronoAura.js';
import { TimeFreezeBlast }  from '../powers/active/TimeFreezeBlast.js';
import { ParadoxBullets }   from '../powers/active/ParadoxBullets.js';
import { EraShift }         from '../powers/active/EraShift.js';
import { TemporalClone }    from '../powers/active/TemporalClone.js';

const ALL_POWERS = [
  TemporalShield,
  ChronoAura,
  TimeFreezeBlast,
  ParadoxBullets,
  EraShift,
  TemporalClone,
];

export class UpgradeSystem {
  constructor() {
    // map of powerId -> current level (0 = not owned)
    this._levels = {};
  }

  /** Returns up to `count` upgrade options for the level-up screen. */
  getRandomUpgradeOptions(count = 3) {
    const available = ALL_POWERS.filter(PowerClass => {
      const id = PowerClass.id;
      const level = this._levels[id] || 0;
      return level < PowerClass.maxLevel;
    });

    const shuffled = available.sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, count);

    return options.map(PowerClass => {
      const currentLevel = this._levels[PowerClass.id] || 0;
      const nextLevel = currentLevel + 1;
      return {
        PowerClass,
        id: PowerClass.id,
        name: PowerClass.displayName,
        icon: PowerClass.icon,
        description: PowerClass.getDescription(nextLevel),
        currentLevel,
        nextLevel,
      };
    });
  }

  /** Apply the chosen upgrade to the player, returns the power instance. */
  applyUpgrade(option, player) {
    const { PowerClass } = option;
    const id = PowerClass.id;
    const newLevel = option.nextLevel;
    this._levels[id] = newLevel;

    // Find if player already has this power
    let powerInstance = player.powers.find(p => p.constructor.id === id);
    if (powerInstance) {
      powerInstance.upgrade(newLevel);
    } else {
      powerInstance = new PowerClass(newLevel);
      player.powers.push(powerInstance);
      powerInstance.onAcquire(player);
    }
    return powerInstance;
  }

  /** Mark a power as owned at the given level (used for initial power selection). */
  initPower(powerClass, level = 1) {
    this._levels[powerClass.id] = level;
  }

  getLevel(powerId) {
    return this._levels[powerId] || 0;
  }

  reset() {
    this._levels = {};
  }
}
