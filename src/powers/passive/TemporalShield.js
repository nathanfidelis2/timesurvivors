export class TemporalShield {
  static id = 'TemporalShield';
  static displayName = 'Escudo Temporal';
  static icon = '🛡️';
  static maxLevel = 5;

  static getDescription(level) {
    return `Reduz o dano recebido em ${level * 10}%. (Nível ${level})`;
  }

  constructor(level = 1) {
    this.level = level;
  }

  onAcquire(player) {
    player.shield = this.level * 0.1;
  }

  upgrade(newLevel) {
    this.level = newLevel;
  }

  // Called every frame on the player
  update(dt, player) {
    player.shield = this.level * 0.1;
  }
}
