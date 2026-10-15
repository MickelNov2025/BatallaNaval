export const SIZE = 60;
export const LENGTHS = [45, 36, 27, 18];
export const WIDTH = 9;
export function makeFleet(random = Math.random) {
  // Four separate lanes guarantee valid placement, even with an unlucky RNG.
  const lanes = [0, 15, 30, 45];
  for (let i = lanes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
  }
  const transpose = random() < .5;
  return LENGTHS.map((length, i) => {
    const x = Math.floor(random() * (SIZE - length + 1));
    const y = lanes[i] + Math.floor(random() * 7);
    return { name: ['Portaaviones', 'Acorazado', 'Crucero', 'Destructor'][i], length,
      x: transpose ? y : x, y: transpose ? x : y,
      w: transpose ? WIDTH : length, h: transpose ? length : WIDTH, hits: 0 };
  });
}
export const makeBoard = (random = Math.random) => ({ ships: makeFleet(random), shots: new Map() });
export function shipAt(board, x, y) {
  return board.ships.find(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h);
}
export const RULES = {
  quick: { threshold: .25, salvo: 3, rounds: 20 },
  classic: { threshold: 1, salvo: 1, rounds: Infinity }
};
export const damageLimit = (ship, threshold = 1) => Math.ceil(ship.w * ship.h * threshold);
export const isSunk = (ship, threshold = 1) => ship.hits >= damageLimit(ship, threshold);
export function score(board, threshold) {
  return { sunk: board.ships.filter(s => isSunk(s, threshold)).length,
    damage: board.ships.reduce((n,s) => n + s.hits, 0) };
}
// Return the attacking player's index; null is an exact draw.
export function roundWinner(boards, threshold) {
  const a = score(boards[1], threshold), b = score(boards[0], threshold);
  return a.sunk !== b.sunk ? (a.sunk > b.sunk ? 0 : 1) : a.damage !== b.damage ? (a.damage > b.damage ? 0 : 1) : null;
}
export function shoot(board, x, y, random = Math.random, threshold = 1) {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= SIZE || y >= SIZE) throw Error('Coordenada inválida');
  const drift = random() >= .65;
  let dx = 0, dy = 0;
  if (drift) {
    const offsets = [];
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a || b) offsets.push([a,b]);
    [dx, dy] = offsets[Math.floor(random() * offsets.length)];
  }
  const cx = Math.max(1, Math.min(SIZE - 2, x + dx));
  const cy = Math.max(1, Math.min(SIZE - 2, y + dy));
  let hits = 0, fresh = 0;
  const cells = [], sunk = [];
  for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
    const key = yy * SIZE + xx;
    cells.push([xx, yy]);
    if (board.shots.has(key)) continue;
    fresh++;
    const ship = shipAt(board, xx, yy);
    board.shots.set(key, !!ship);
    if (ship && !isSunk(ship, threshold)) {
      hits++; ship.hits++;
      if (isSunk(ship, threshold)) sunk.push(ship.name);
    }
  }
  return { x, y, cx, cy, cells, hits, fresh, sunk, shifted: cx !== x || cy !== y,
    won: board.ships.every(s => isSunk(s, threshold)) };
}
export function aiTarget(board, random = Math.random) {
  // Only inspect public impact information, never hidden ship coordinates.
  const candidates = [];
  for (const [key, hit] of board.shots) if (hit) {
    const x = key % SIZE, y = Math.floor(key / SIZE);
    for (const [dx,dy] of [[3,0],[-3,0],[0,3],[0,-3]]) {
      const xx = x + dx, yy = y + dy;
      if (xx > 0 && yy > 0 && xx < SIZE - 1 && yy < SIZE - 1 && !board.shots.has(yy * SIZE + xx)) candidates.push([xx, yy]);
    }
  }
  if (candidates.length) return candidates[Math.floor(random() * candidates.length)];
  const unknown = [];
  for (let y = 1; y < SIZE - 1; y += 3) for (let x = 1; x < SIZE - 1; x += 3) if (!board.shots.has(y * SIZE + x)) unknown.push([x,y]);
  if (!unknown.length) for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (!board.shots.has(y * SIZE + x)) unknown.push([x,y]);
  return unknown.length ? unknown[Math.floor(random() * unknown.length)] : [30,30];
}
