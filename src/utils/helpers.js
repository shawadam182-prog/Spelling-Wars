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
  for (let attempt = 0; attempt < 10; attempt++) {
    const g = Array.from({ length: GS }, () => Array(GS).fill(0));
    let wc = 0;
    while (wc < 8 + Math.floor(Math.random() * 5)) {
      const x = Math.floor(Math.random() * GS), y = Math.floor(Math.random() * GS);
      if ((x === 0 && y === GS - 1) || (x === GS - 1 && y === 0)) continue;
      if (g[y][x] === 0) { g[y][x] = 1; wc++; }
    }
    let hc = 0;
    while (hc < 2) {
      const x = Math.floor(Math.random() * GS), y = Math.floor(Math.random() * GS);
      if (g[y][x] === 0 && !(x === 0 && y === GS - 1) && !(x === GS - 1 && y === 0)) { g[y][x] = 2; hc++; }
    }
    if (!canReach(g, 0, GS - 1, GS - 1, 0)) {
      for (let i = 0; i < GS; i++) {
        const y = GS - 1 - i;
        if (g[y][i] === 1) g[y][i] = 0;
      }
    }
    if (!canReach(g, 0, GS - 1, GS - 1, 0)) continue;
    const ents = [];
    const occ = new Set([`0,${GS - 1}`, `${GS - 1},0`]);
    const place = (type, emoji, word) => {
      let a = 0;
      while (a < 50) {
        const x = Math.floor(Math.random() * GS), y = Math.floor(Math.random() * GS);
        const k = `${x},${y}`;
        if (!occ.has(k) && g[y][x] === 0) {
          occ.add(k);
          ents.push({ id: `${type}-${ents.length}`, type, x, y, emoji, word });
          return true;
        }
        a++;
      }
      return false;
    };
    words.forEach((w, i) => place("enemy", pl.ee[i % pl.ee.length], w));
    place("kyber", "💎", null);
    place("kyber", "💎", null);
    place("holocron", "📦", null);
    place("ration", "🍖", null);
    pl.fe.forEach((e) => place("decor", e, null));
    ents.push({ id: "boss", type: "boss", x: GS - 1, y: 0, emoji: BOSSES[pi].icon, word: null });
    return { grid: g, entities: ents };
  }
  const g = Array.from({ length: GS }, () => Array(GS).fill(0));
  const ents = [];
  words.forEach((w, i) => ents.push({ id: `enemy-${i}`, type: "enemy", x: Math.min(i + 1, GS - 2), y: Math.min(i, GS - 2), emoji: PLANETS[pi].ee[i % PLANETS[pi].ee.length], word: w }));
  ents.push({ id: "boss", type: "boss", x: GS - 1, y: 0, emoji: BOSSES[pi].icon, word: null });
  return { grid: g, entities: ents };
};
