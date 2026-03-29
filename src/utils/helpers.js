import { JEDI_RANKS, SABERS, PLANETS, BOSSES } from "../data/constants.js";
import { WS } from "../data/words.js";

export const getRank = (l) => {
  let r = JEDI_RANKS[0];
  for (const x of JEDI_RANKS) if (l >= x.min) r = x;
  return r;
};

export const getSaber = (i) => SABERS[i] || SABERS[0];

// Trouble words: words where fails > correct or never attempted
export const getTroubleWords = (profile, words) => {
  const wp = profile?.wordProgress || {};
  const wf = profile?.wordFails || {};
  return words.filter((w) => {
    const correct = wp[w] || 0;
    const fails = wf[w] || 0;
    return correct === 0 || fails > correct;
  });
};

// Mastery score: 0-1 per word (correct / (correct + fails + 1))
export const wordMastery = (profile, word) => {
  const correct = (profile?.wordProgress || {})[word] || 0;
  const fails = (profile?.wordFails || {})[word] || 0;
  if (correct === 0 && fails === 0) return 0;
  return correct / (correct + fails);
};

// Planet mastery: average mastery across all words for that planet
export const planetMastery = (profile, words) => {
  if (!words || words.length === 0) return 0;
  const total = words.reduce((s, w) => s + wordMastery(profile, w), 0);
  return total / words.length;
};

// Saber passive bonuses
const SABER_BONUSES = [
  { id: "blue", desc: "Balanced — no bonus" },
  { id: "green", desc: "Rations restore +1 extra Force", extraRation: 1 },
  { id: "purple", desc: "Hint costs halved", hintDiscount: true },
  { id: "yellow", desc: "Combo kicks in 1 step earlier", earlyCombo: true },
  { id: "white", desc: "+1 max Force, combo builds faster", extraMaxForce: 1, earlyCombo: true },
];
export const saberBonus = (i) => SABER_BONUSES[i] || SABER_BONUSES[0];

export const sent = (w) => {
  const s = WS[w.toLowerCase()];
  if (s) return { full: s, masked: s.replace(new RegExp(w, "gi"), "_______") };
  return { full: `The word is ${w}.`, masked: "The word is _______." };
};

// ─── SCORING ────────────────────────────────────────────────────────────────

export const calcScore = (word, combo, earlyCombo = false, elapsed = null) => {
  const base = 100;
  const lengthBonus = word.length * 10;
  const newCombo = combo + 1;
  // Yellow/White saber: combo thresholds shift down by 1
  const comboBonus = earlyCombo
    ? (newCombo >= 4 ? 200 : newCombo >= 2 ? 100 : newCombo >= 1 ? 50 : 0)
    : (newCombo >= 5 ? 200 : newCombo >= 3 ? 100 : newCombo >= 2 ? 50 : 0);
  // Speed bonus: fast answers earn extra points
  const speedBonus = elapsed != null
    ? (elapsed < 5 ? 100 : elapsed < 10 ? 50 : elapsed < 15 ? 25 : 0)
    : 0;
  return { base, lengthBonus, comboBonus, speedBonus, total: base + lengthBonus + comboBonus + speedBonus, newCombo };
};

// ─── MAP GENERATION ─────────────────────────────────────────────────────────

export const MAP_W = 14;
export const MAP_H = 12;

export const canReach = (grid, sx, sy, tx, ty) => {
  const h = grid.length, w = grid[0].length;
  const v = new Set();
  const q = [[sx, sy]];
  v.add(`${sx},${sy}`);
  while (q.length) {
    const [cx, cy] = q.shift();
    if (cx === tx && cy === ty) return true;
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !v.has(`${nx},${ny}`) && grid[ny][nx] !== 1) {
        v.add(`${nx},${ny}`);
        q.push([nx, ny]);
      }
    }
  }
  return false;
};

export const genMap = (pi, words) => {
  const pl = PLANETS[pi];
  const W = MAP_W, H = MAP_H;
  const ROOM_SIZES = [[3, 2], [3, 3], [4, 2], [4, 3], [5, 3], [5, 4], [3, 4]];

  for (let attempt = 0; attempt < 12; attempt++) {
    const g = Array.from({ length: H }, () => Array(W).fill(1)); // all walls
    const rooms = [];
    const target = 5 + Math.floor(Math.random() * 3); // 5-7 rooms

    // Try to place rooms with 1-tile padding between them
    for (let t = 0; t < target * 12 && rooms.length < target; t++) {
      const [rw, rh] = ROOM_SIZES[Math.floor(Math.random() * ROOM_SIZES.length)];
      const x = 1 + Math.floor(Math.random() * (W - rw - 2));
      const y = 1 + Math.floor(Math.random() * (H - rh - 2));
      const overlaps = rooms.some((rm) =>
        x < rm.x + rm.w + 1 && x + rw + 1 > rm.x &&
        y < rm.y + rm.h + 1 && y + rh + 1 > rm.y
      );
      if (!overlaps) rooms.push({ x, y, w: rw, h: rh, cx: Math.floor(x + rw / 2), cy: Math.floor(y + rh / 2) });
    }
    if (rooms.length < 3) continue;

    // Carve rooms
    for (const rm of rooms) {
      for (let dy = 0; dy < rm.h; dy++)
        for (let dx = 0; dx < rm.w; dx++)
          g[rm.y + dy][rm.x + dx] = 0;
    }

    // Sort rooms left-to-right by centre X for spawn→boss flow
    rooms.sort((a, b) => a.cx - b.cx || a.cy - b.cy);

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

    // Place 2-3 hazards along corridors (not in rooms)
    const inRoom = (x, y) => rooms.some((rm) => x >= rm.x && x < rm.x + rm.w && y >= rm.y && y < rm.y + rm.h);
    let hc = 0;
    const hazardTarget = 2 + Math.floor(Math.random() * 2);
    for (let t = 0; t < 80 && hc < hazardTarget; t++) {
      const x = Math.floor(Math.random() * W), y = Math.floor(Math.random() * H);
      if (g[y][x] === 0 && !inRoom(x, y) && !(x === spawn.x && y === spawn.y) && !(x === bossPos.x && y === bossPos.y)) {
        g[y][x] = 2; hc++;
      }
    }

    // Re-validate after hazards
    if (!canReach(g, spawn.x, spawn.y, bossPos.x, bossPos.y)) continue;

    // Interactive terrain: soft walls (3) — wall tiles between two floor areas
    let sw = 0;
    for (let t = 0; t < 80 && sw < 3; t++) {
      const x = 1 + Math.floor(Math.random() * (W - 2));
      const y = 1 + Math.floor(Math.random() * (H - 2));
      if (g[y][x] !== 1) continue;
      const hPath = g[y][x - 1] === 0 && g[y][x + 1] === 0;
      const vPath = g[y - 1]?.[x] === 0 && g[y + 1]?.[x] === 0;
      if (hPath || vPath) { g[y][x] = 3; sw++; }
    }

    // Interactive terrain: jumpable hazards (4) — convert 1 hazard to jumpable
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (g[y][x] === 2) { g[y][x] = 4; y = H; break; }

    // Interactive terrain: locked door (5) — place 1 on non-main-path floor
    for (let t = 0; t < 60; t++) {
      const x = Math.floor(Math.random() * W), y = Math.floor(Math.random() * H);
      if (g[y][x] !== 0 || inRoom(x, y)) continue;
      if (x === spawn.x && y === spawn.y) continue;
      if (x === bossPos.x && y === bossPos.y) continue;
      // Test: if we block this tile, can we still reach boss?
      g[y][x] = 5;
      if (canReach(g, spawn.x, spawn.y, bossPos.x, bossPos.y)) break;
      g[y][x] = 0; // revert if it blocks main path
    }

    // Place entities
    const ents = [];
    const occ = new Set([`${spawn.x},${spawn.y}`, `${bossPos.x},${bossPos.y}`]);
    const placeIn = (type, emoji, word, preferRoom, extra = {}) => {
      for (let a = 0; a < 60; a++) {
        const rm = preferRoom || rooms[1 + Math.floor(Math.random() * (rooms.length - 1))]; // avoid spawn room
        const x = rm.x + Math.floor(Math.random() * rm.w);
        const y = rm.y + Math.floor(Math.random() * rm.h);
        const k = `${x},${y}`;
        if (!occ.has(k) && g[y][x] === 0) {
          occ.add(k);
          ents.push({ id: `${type}-${ents.length}`, type, x, y, emoji, word, ...extra });
          return true;
        }
      }
      return false;
    };

    // Enemies distributed across rooms (2-3 per room, skip spawn room)
    const enemyRooms = rooms.slice(1, -1); // intermediate rooms, not spawn or boss room
    if (enemyRooms.length === 0) enemyRooms.push(rooms[0]); // fallback
    words.forEach((w, i) => {
      const rm = enemyRooms[i % enemyRooms.length];
      placeIn("enemy", pl.ee[i % pl.ee.length], w, rm);
    });

    // Elite enemies: 1-2 carrying trouble words or random words with isElite flag
    const eliteCount = 1 + Math.floor(Math.random() * 2);
    for (let e = 0; e < eliteCount && e < words.length; e++) {
      const eWord = words[Math.floor(Math.random() * words.length)];
      const eRoom = enemyRooms[Math.floor(Math.random() * enemyRooms.length)];
      placeIn("enemy", pl.ee[e % pl.ee.length], eWord, eRoom, { isElite: true, hp: 2 });
    }

    // Pickups spread across rooms
    placeIn("kyber", "💎", null, rooms[Math.min(1, rooms.length - 1)]);
    placeIn("kyber", "💎", null, rooms[Math.min(2, rooms.length - 1)]);
    placeIn("kyber", "💎", null, rooms[Math.min(3, rooms.length - 1)]);
    placeIn("holocron", "📦", null, rooms[Math.floor(rooms.length / 2)]);

    // Rations: 3-4 placed across middle/late rooms
    const rationCount = 3 + Math.floor(Math.random() * 2);
    for (let r = 0; r < rationCount; r++) {
      const rm = rooms[Math.min(r + 1, rooms.length - 2)];
      placeIn("ration", "🍖", null, rm);
    }

    // Decorations
    pl.fe.forEach((e) => placeIn("decor", e, null));
    // Boss in boss room
    ents.push({ id: "boss", type: "boss", x: bossPos.x, y: bossPos.y, emoji: BOSSES[pi].icon, word: null });

    return { grid: g, entities: ents, spawn, rooms };
  }

  // Fallback: five-room layout for 14x12
  const g = Array.from({ length: H }, () => Array(W).fill(1));
  const fRooms = [
    { x: 1, y: 8, w: 4, h: 3 },   // Room 1: bottom-left (spawn)
    { x: 1, y: 4, w: 4, h: 3 },   // Room 2: mid-left
    { x: 5, y: 5, w: 4, h: 3 },   // Room 3: centre
    { x: 9, y: 3, w: 4, h: 3 },   // Room 4: mid-right
    { x: 9, y: 0, w: 4, h: 3 },   // Room 5: top-right (boss)
  ];
  for (const rm of fRooms) for (let dy = 0; dy < rm.h; dy++) for (let dx = 0; dx < rm.w; dx++) if (rm.y + dy < H && rm.x + dx < W) g[rm.y + dy][rm.x + dx] = 0;
  // Corridors connecting rooms
  for (let y = 7; y >= 4; y--) g[y][2] = 0; // Room1→Room2
  for (let x = 4; x <= 5; x++) g[6][x] = 0; // Room2→Room3
  for (let x = 8; x <= 9; x++) g[5][x] = 0; // Room3→Room4
  for (let y = 3; y >= 1; y--) g[y][11] = 0; // Room4→Room5

  const spawn = { x: 2, y: 9 };
  const bossPos = { x: 11, y: 1 };
  const ents = [];
  const occ = new Set([`${spawn.x},${spawn.y}`, `${bossPos.x},${bossPos.y}`]);
  words.forEach((w, i) => {
    const rm = fRooms[1 + (i % (fRooms.length - 1))]; // skip spawn room
    for (let a = 0; a < 30; a++) {
      const x = rm.x + Math.floor(Math.random() * rm.w);
      const y = rm.y + Math.floor(Math.random() * rm.h);
      const k = `${x},${y}`;
      if (g[y]?.[x] === 0 && !occ.has(k)) {
        occ.add(k);
        ents.push({ id: `enemy-${i}`, type: "enemy", x, y, emoji: pl.ee[i % pl.ee.length], word: w });
        break;
      }
    }
  });
  ents.push({ id: "boss", type: "boss", x: bossPos.x, y: bossPos.y, emoji: BOSSES[pi].icon, word: null });
  return { grid: g, entities: ents, spawn };
};
