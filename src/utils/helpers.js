import { JEDI_RANKS, SABERS, PLANETS, BOSSES } from "../data/constants.js";
import { WS } from "../data/words.js";

export const getRank = (l) => {
  let r = JEDI_RANKS[0];
  for (const x of JEDI_RANKS) if (l >= x.min) r = x;
  return r;
};

export const getSaber = (i) => SABERS[i] || SABERS[0];

export const sent = (w) => {
  const s = WS[w.toLowerCase()];
  if (s) return { full: s, masked: s.replace(new RegExp(w, "gi"), "_______") };
  return { full: `The word is ${w}.`, masked: "The word is _______." };
};

// ─── SCORING ────────────────────────────────────────────────────────────────

export const calcScore = (word, combo) => {
  const base = 100;
  const lengthBonus = word.length * 10;
  const newCombo = combo + 1;
  const comboBonus = newCombo >= 5 ? 200 : newCombo >= 3 ? 100 : newCombo >= 2 ? 50 : 0;
  return { base, lengthBonus, comboBonus, total: base + lengthBonus + comboBonus, newCombo };
};

// ─── MAP GENERATION ─────────────────────────────────────────────────────────

export const GS = 8;

export const canReach = (grid, sx, sy, tx, ty) => {
  const v = new Set();
  const q = [[sx, sy]];
  v.add(`${sx},${sy}`);
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === tx && cy === ty) return true;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < GS && ny < GS && !v.has(`${nx},${ny}`) && grid[ny][nx] !== 1) {
        v.add(`${nx},${ny}`);
        q.push([nx, ny]);
      }
    }
  }
  return false;
};

export const genMap = (pi, words) => {
  const pl = PLANETS[pi];
  const ROOM_SIZES = [[2, 2], [3, 2], [2, 3], [3, 3], [4, 3]];

  for (let attempt = 0; attempt < 8; attempt++) {
    const g = Array.from({ length: GS }, () => Array(GS).fill(1)); // all walls
    const rooms = [];
    const target = 3 + Math.floor(Math.random() * 2); // 3-4 rooms

    // Try to place rooms with 1-tile padding between them
    for (let t = 0; t < target * 8 && rooms.length < target; t++) {
      const [w, h] = ROOM_SIZES[Math.floor(Math.random() * ROOM_SIZES.length)];
      const x = 1 + Math.floor(Math.random() * (GS - w - 2));
      const y = 1 + Math.floor(Math.random() * (GS - h - 2));
      const overlaps = rooms.some((rm) =>
        x < rm.x + rm.w + 1 && x + w + 1 > rm.x &&
        y < rm.y + rm.h + 1 && y + h + 1 > rm.y
      );
      if (!overlaps) rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }
    if (rooms.length < 2) continue;

    // Carve rooms
    for (const rm of rooms) {
      for (let dy = 0; dy < rm.h; dy++)
        for (let dx = 0; dx < rm.w; dx++)
          g[rm.y + dy][rm.x + dx] = 0;
    }

    // Sort rooms: spawn near bottom-left, boss near top-right
    rooms.sort((a, b) => {
      const da = a.cx + (GS - 1 - a.cy);
      const db = b.cx + (GS - 1 - b.cy);
      return da - db;
    });

    // Connect adjacent rooms with L-shaped corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const a = rooms[i], b = rooms[i + 1];
      // Horizontal then vertical
      for (let x = Math.min(a.cx, b.cx); x <= Math.max(a.cx, b.cx); x++)
        if (g[a.cy][x] === 1) g[a.cy][x] = 0;
      for (let y = Math.min(a.cy, b.cy); y <= Math.max(a.cy, b.cy); y++)
        if (g[y][b.cx] === 1) g[y][b.cx] = 0;
    }

    const spawnRoom = rooms[0];
    const bossRoom = rooms[rooms.length - 1];
    const spawn = { x: spawnRoom.cx, y: spawnRoom.cy };
    const bossPos = { x: bossRoom.cx, y: bossRoom.cy };

    if (!canReach(g, spawn.x, spawn.y, bossPos.x, bossPos.y)) continue;

    // Place 1-2 hazards along corridors (not in rooms)
    const inRoom = (x, y) => rooms.some((rm) => x >= rm.x && x < rm.x + rm.w && y >= rm.y && y < rm.y + rm.h);
    let hc = 0;
    for (let t = 0; t < 60 && hc < 2; t++) {
      const x = Math.floor(Math.random() * GS), y = Math.floor(Math.random() * GS);
      if (g[y][x] === 0 && !inRoom(x, y) && !(x === spawn.x && y === spawn.y) && !(x === bossPos.x && y === bossPos.y)) {
        g[y][x] = 2; hc++;
      }
    }

    // Re-validate after hazards (hazards block movement)
    if (!canReach(g, spawn.x, spawn.y, bossPos.x, bossPos.y)) continue;

    // Place entities
    const ents = [];
    const occ = new Set([`${spawn.x},${spawn.y}`, `${bossPos.x},${bossPos.y}`]);
    const placeIn = (type, emoji, word, preferRoom) => {
      for (let a = 0; a < 50; a++) {
        const rm = preferRoom || rooms[Math.floor(Math.random() * rooms.length)];
        const x = rm.x + Math.floor(Math.random() * rm.w);
        const y = rm.y + Math.floor(Math.random() * rm.h);
        const k = `${x},${y}`;
        if (!occ.has(k) && g[y][x] === 0) {
          occ.add(k);
          ents.push({ id: `${type}-${ents.length}`, type, x, y, emoji, word });
          return true;
        }
      }
      return false;
    };

    // Enemies distributed across rooms
    words.forEach((w, i) => {
      const rm = rooms[(i + 1) % rooms.length]; // skip spawn room for first enemies
      placeIn("enemy", pl.ee[i % pl.ee.length], w, rm);
    });
    // Pickups spread across rooms
    placeIn("kyber", "💎", null, rooms[Math.min(1, rooms.length - 1)]);
    placeIn("kyber", "💎", null, rooms[Math.min(2, rooms.length - 1)]);
    placeIn("holocron", "📦", null, rooms[Math.floor(rooms.length / 2)]);
    placeIn("ration", "🍖", null, rooms[0]);
    // Decorations
    pl.fe.forEach((e) => placeIn("decor", e, null));
    // Boss in boss room
    ents.push({ id: "boss", type: "boss", x: bossPos.x, y: bossPos.y, emoji: BOSSES[pi].icon, word: null });

    return { grid: g, entities: ents, spawn };
  }

  // Fallback: simple two-room layout
  const g = Array.from({ length: GS }, () => Array(GS).fill(1));
  // Room 1: bottom-left 3x3
  for (let y = 5; y < 8; y++) for (let x = 0; x < 3; x++) g[y][x] = 0;
  // Room 2: top-right 3x3
  for (let y = 0; y < 3; y++) for (let x = 5; x < 8; x++) g[y][x] = 0;
  // Corridor connecting them
  for (let x = 2; x < 6; x++) g[4][x] = 0;
  for (let y = 1; y < 5; y++) g[y][5] = 0;

  const spawn = { x: 1, y: 6 };
  const bossPos = { x: 6, y: 1 };
  const ents = [];
  const occ = new Set([`${spawn.x},${spawn.y}`, `${bossPos.x},${bossPos.y}`]);
  words.forEach((w, i) => {
    const x = 5 + (i % 3), y = (i < 3) ? 0 + i : 5 + (i - 3);
    if (g[y]?.[x] === 0 && !occ.has(`${x},${y}`)) {
      occ.add(`${x},${y}`);
      ents.push({ id: `enemy-${i}`, type: "enemy", x, y, emoji: pl.ee[i % pl.ee.length], word: w });
    }
  });
  ents.push({ id: "boss", type: "boss", x: bossPos.x, y: bossPos.y, emoji: BOSSES[pi].icon, word: null });
  return { grid: g, entities: ents, spawn };
};
