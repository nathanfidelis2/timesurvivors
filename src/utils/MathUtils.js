export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(randomRange(min, max + 1));
}

export function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function weightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + (item.spawnWeight || 1), 0);
  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= (item.spawnWeight || 1);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function distSq(x1, y1, x2, y2) {
  return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

export function easeOut(t) {
  return 1 - (1 - t) * (1 - t);
}

export function easeIn(t) {
  return t * t;
}

export function easeOutElastic(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}
