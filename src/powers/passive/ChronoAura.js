export class ChronoAura {
  static id = 'ChronoAura';
  static displayName = 'Aura Crono';
  static icon = '💚';
  static maxLevel = 5;

  static getDescription(level) {
    return `Regenera ${level * 2} HP/s. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
  }

  onAcquire(player) {
    player.regenRate = this.level * 2;
  }

  upgrade(newLevel) {
    this.level = newLevel;
  }

  update(dt, player) {
    player.regenRate = this.level * 2;
  }
}
