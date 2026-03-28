export class CollisionSystem {
  /** Returns true if two circular bodies overlap */
  static checkCircleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distSq = dx * dx + dy * dy;
    const radSum = (a.radius || 0) + (b.radius || 0);
    return distSq < radSum * radSum;
  }

  /** Checks projectile hits against a list of enemies.
   *  Returns an array of { projectile, enemy } hit pairs. */
  static checkProjectileHits(projectiles, enemies) {
    const hits = [];
    for (const proj of projectiles) {
      if (proj.dead) continue;
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (this.checkCircleCollision(proj, enemy)) {
          hits.push({ projectile: proj, enemy });
        }
      }
    }
    return hits;
  }

  /** Check whether the player is hit by any living enemy.
   *  Returns list of enemies that are touching the player. */
  static getEnemyPlayerContacts(player, enemies) {
    const contacts = [];
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (this.checkCircleCollision(player, enemy)) {
        contacts.push(enemy);
      }
    }
    return contacts;
  }

  /** Resolve overlap between player and enemy (push player away). */
  static resolvePlayerEnemyCollision(player, enemy) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const overlap = (player.radius + enemy.radius) - dist;
    if (overlap > 0) {
      player.x += (dx / dist) * overlap * 0.5;
      player.y += (dy / dist) * overlap * 0.5;
    }
  }

  /** Check XP orb collection */
  static checkOrbCollection(player, orbs) {
    const collected = [];
    const collectRadius = 60;
    for (const orb of orbs) {
      if (orb.collected) continue;
      const dx = player.x - orb.x;
      const dy = player.y - orb.y;
      if (dx * dx + dy * dy < collectRadius * collectRadius) {
        collected.push(orb);
      }
    }
    return collected;
  }
}
