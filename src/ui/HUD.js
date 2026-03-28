import { formatTime } from '../utils/MathUtils.js';

export class HUD {
  constructor() {
    this._powerIcons = {
      TimeFreezeBlast: '❄️',
      ParadoxBullets:  '🔄',
      EraShift:        '🌀',
      TemporalClone:   '👥',
      TemporalShield:  '🛡️',
      ChronoAura:      '💚',
    };
  }

  draw(ctx, canvas, player, era, elapsedTime) {
    const w = canvas.width;

    // ── Health Bar ──────────────────────────────────────────
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    const barW = 200, barH = 18;
    const barX = 16, barY = 16;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#f44336';
    ctx.fillRect(barX, barY, barW * hpRatio, barH);

    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`❤️  ${Math.ceil(player.hp)} / ${player.maxHp}`, barX + 4, barY + barH / 2);

    // ── XP Bar ──────────────────────────────────────────────
    const xpRatio = player.xp / player.xpToNextLevel;
    const xpBarY = barY + barH + 6;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(barX - 2, xpBarY - 2, barW + 4, 14);
    ctx.fillStyle = '#1a237e';
    ctx.fillRect(barX, xpBarY, barW, 10);
    ctx.fillStyle = '#3f51b5';
    ctx.fillRect(barX, xpBarY, barW * xpRatio, 10);

    ctx.font = '11px Arial';
    ctx.fillStyle = '#e8eaf6';
    ctx.textAlign = 'center';
    ctx.fillText(`LVL ${player.level}  •  ${player.xp} / ${player.xpToNextLevel} XP`, barX + barW / 2, xpBarY + 5);

    // ── Timer & Era ─────────────────────────────────────────
    const timeStr = formatTime(elapsedTime);
    const eraIcon = era ? era.icon : '⏳';
    const eraName = era ? era.name : '';

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(`${eraIcon}  ${timeStr}`, w / 2, 14);
    ctx.shadowBlur = 0;

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffffcc';
    ctx.fillText(eraName, w / 2, 42);

    // ── Active Power Cooldowns ───────────────────────────────
    const activePowers = player.powers.filter(p => p.cooldownRatio !== undefined);
    const iconSize = 44;
    const iconPad = 8;
    const startX = 16;
    const startY = xpBarY + 20;

    activePowers.forEach((power, i) => {
      const ix = startX + i * (iconSize + iconPad);
      const iy = startY;
      const ratio = power.cooldownRatio || 0;
      const icon = this._powerIcons[power.constructor.id] || '⚡';

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(ix, iy, iconSize, iconSize);

      // Cooldown fill
      if (ratio > 0) {
        ctx.fillStyle = 'rgba(0,0,80,0.7)';
        ctx.fillRect(ix, iy + iconSize * (1 - ratio), iconSize, iconSize * ratio);
      }

      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon, ix + iconSize / 2, iy + iconSize / 2);

      ctx.strokeStyle = ratio > 0 ? '#546e7a' : '#4fc3f7';
      ctx.lineWidth = 2;
      ctx.strokeRect(ix, iy, iconSize, iconSize);
    });
  }
}
