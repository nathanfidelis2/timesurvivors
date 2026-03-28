/**
 * @file PowerPool.js
 * @folder src/core/
 *
 * Gerencia o pool de poderes disponíveis e sorteia
 * N poderes distintos para oferecer ao jogador.
 */

import { weightedRandom } from '../utils/MathUtils.js';
import { ChainLightning  } from '../powers/active/ChainLightning.js';
import { TimeFreezeBlast } from '../powers/active/TimeFreezeBlast.js';
import { EraShift        } from '../powers/active/EraShift.js';
import { ParadoxBullets  } from '../powers/active/ParadoxBullets.js';
import { TemporalClone   } from '../powers/active/TemporalClone.js';
import { ChronoAura      } from '../powers/passive/ChronoAura.js';

/**
 * Registro de todos os poderes jogáveis.
 * spawnWeight: chance relativa de aparecer na seleção.
 */
const POWER_REGISTRY = [
  { Class: ChainLightning,  spawnWeight: 3 },
  { Class: TimeFreezeBlast, spawnWeight: 3 },
  { Class: EraShift,        spawnWeight: 2 },
  { Class: ParadoxBullets,  spawnWeight: 3 },
  { Class: TemporalClone,   spawnWeight: 2 },
  { Class: ChronoAura,      spawnWeight: 2 },
];

export class PowerPool {
  /**
   * Sorteia `count` poderes distintos respeitando pesos.
   * @param {number} count  quantidade de opções (padrão: 3)
   * @returns {object[]}    instâncias de poder no nível 1
   */
  static drawOptions(count = 3) {
    const pool   = [...POWER_REGISTRY];
    const chosen = [];

    while (chosen.length < count && pool.length > 0) {
      const entry = weightedRandom(pool);
      chosen.push(new entry.Class(1));
      pool.splice(pool.indexOf(entry), 1);
    }

    return chosen;
  }

  /**
   * Sorteia opções excluindo poderes que o jogador já possui.
   * @param {Set<string>} ownedNames  Set de constructor.name já equipados
   * @param {number}      count
   */
  static drawUpgradeOptions(ownedNames, count = 3) {
    const pool   = POWER_REGISTRY.filter(e => !ownedNames.has(e.Class.name));
    const chosen = [];

    while (chosen.length < count && pool.length > 0) {
      const entry = weightedRandom(pool);
      chosen.push(new entry.Class(1));
      pool.splice(pool.indexOf(entry), 1);
    }

    return chosen;
  }
}
