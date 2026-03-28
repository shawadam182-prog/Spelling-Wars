import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { saveProgress, loadProgress, logSpellingAttempt } from "./services/supabase";

// ─── DATA ───────────────────────────────────────────────────────────────────

const JEDI_RANKS = [
  { name: "Youngling", min: 1, icon: "✦" },
  { name: "Padawan", min: 3, icon: "✧" },
  { name: "Jedi Knight", min: 5, icon: "⚔" },
  { name: "Jedi Master", min: 8, icon: "★" },
  { name: "Grand Master", min: 10, icon: "✶" },
];
const getRank = (l) => {
  let r = JEDI_RANKS[0];
  for (const x of JEDI_RANKS) if (l >= x.min) r = x;
  return r;
};

const SABERS = [
  { name: "Blue", c: "#4A9EEA", g: "#4A9EEA60" },
  { name: "Green", c: "#44CC44", g: "#44CC4460" },
  { name: "Purple", c: "#9944CC", g: "#9944CC60" },
  { name: "Yellow", c: "#CCCC22", g: "#CCCC2260" },
  { name: "White", c: "#EEEEFF", g: "#EEEEFF60" },
];
const SABER_COSTS = [0, 5, 10, 15, 20];
const getSaber = (i) => SABERS[i] || SABERS[0];

const PLANETS = [
  { id: 1, name: "Tatooine", sub: "Desert world", c: "#E8A838", gc: "#E8A83830", desc: "Twin suns blaze over endless dunes", gnd: ["#C4943A", "#B8883A", "#D4A444", "#C89E40"], wc: "#8B6914", hc: "#E8A83855", we: "🪨", he: "🏜️", fe: ["🌵", "⚙️"], ee: ["👤", "🐀", "👥"], en: ["Tusken Raider", "Womp Rat", "Jawa Thief"] },
  { id: 2, name: "Dagobah", sub: "Swamp planet", c: "#4A8C3F", gc: "#4A8C3F30", desc: "Strong with the Force, this place is", gnd: ["#2D5A28", "#335E2E", "#3A6632", "#2A5424"], wc: "#1A3A15", hc: "#3A7A3044", we: "🌳", he: "🌿", fe: ["🍄", "🪺"], ee: ["🐊", "🐍", "👻"], en: ["Swamp Beast", "Bog Snake", "Dark Vision"] },
  { id: 3, name: "Hoth", sub: "Ice world", c: "#7EC8E3", gc: "#7EC8E330", desc: "Frozen wastes hide rebel secrets", gnd: ["#C8D8E8", "#D4E4F0", "#BCD0E0", "#E0ECF4"], wc: "#8AACCC", hc: "#6090B044", we: "🧊", he: "❄️", fe: ["⛰️", "🏔️"], ee: ["🐻‍❄️", "🛸", "⛷️"], en: ["Wampa", "Probe Droid", "Snowtrooper"] },
  { id: 4, name: "Endor", sub: "Forest moon", c: "#2D8B46", gc: "#2D8B4630", desc: "Ancient forests shelter brave Ewoks", gnd: ["#3A6B32", "#447738", "#4D8040", "#3B7234"], wc: "#2A4A22", hc: "#55774444", we: "🌲", he: "🌿", fe: ["🏕️", "🪵"], ee: ["💂", "🛡️", "🤖"], en: ["Scout Trooper", "Imperial Guard", "AT-ST"] },
  { id: 5, name: "Bespin", sub: "Cloud city", c: "#E89040", gc: "#E8904030", desc: "Cities float among golden clouds", gnd: ["#C0A888", "#CCBB99", "#B8A080", "#D4C4A8"], wc: "#887058", hc: "#E8C88844", we: "🏗️", he: "☁️", fe: ["🏛️", "⚡"], ee: ["🔫", "🔧", "👮"], en: ["Bounty Hunter", "Ugnaught", "Wing Guard"] },
  { id: 6, name: "Mustafar", sub: "Lava world", c: "#E84430", gc: "#E8443030", desc: "Rivers of fire forge dark destinies", gnd: ["#3A2020", "#442828", "#4A2E2E", "#382020"], wc: "#2A1515", hc: "#E8443055", we: "🪨", he: "🌋", fe: ["⛏️", "🔥"], ee: ["🦟", "🤖", "🧛"], en: ["Lava Flea", "Mining Droid", "Sith Acolyte"] },
  { id: 7, name: "Kashyyyk", sub: "Wookiee homeworld", c: "#3B7A2E", gc: "#3B7A2E30", desc: "Wroshyr trees touch the sky", gnd: ["#2E5E24", "#36692C", "#3E7434", "#2C5A22"], wc: "#1E4018", hc: "#44883344", we: "🌳", he: "🌴", fe: ["🦜", "🪻"], ee: ["🦎", "🤖", "🐆"], en: ["Trandoshan", "Sep Droid", "Jungle Beast"] },
  { id: 8, name: "Kamino", sub: "Ocean world", c: "#4A7CB8", gc: "#4A7CB830", desc: "Endless storms hide clone armies", gnd: ["#344860", "#3C5068", "#445870", "#3A4E64"], wc: "#283848", hc: "#2868A844", we: "🏢", he: "🌊", fe: ["⚗️", "🧬"], ee: ["👽", "💂", "🐙"], en: ["Kaminoan Sentry", "Clone Defector", "Sea Beast"] },
  { id: 9, name: "Coruscant", sub: "Capital world", c: "#C8A848", gc: "#C8A84830", desc: "The galaxy's beating heart", gnd: ["#484040", "#504848", "#585050", "#464040"], wc: "#2E2828", hc: "#88783044", we: "🏛️", he: "🏙️", fe: ["🚀", "⚜️"], ee: ["💂", "🕵️", "🤖"], en: ["Senate Guard", "Sith Spy", "Bounty Droid"] },
  { id: 10, name: "Death Star", sub: "Ultimate weapon", c: "#888888", gc: "#88888830", desc: "Destroy it, or be destroyed", gnd: ["#383838", "#404040", "#484848", "#3C3C3C"], wc: "#222222", hc: "#66666644", we: "⬜", he: "⬛", fe: ["💡", "🖥️"], ee: ["⚪", "🦾", "🔴"], en: ["Stormtrooper", "Dark Trooper", "Royal Guard"] },
];

const BOSSES = [
  { id: 1, name: "Darth Maul", icon: "👹", hp: 3, q: "At last we will reveal ourselves..." },
  { id: 2, name: "Count Dooku", icon: "⚡", hp: 3, q: "I've become more powerful than any Jedi" },
  { id: 3, name: "General Grievous", icon: "🤖", hp: 3, q: "Your lightsabers will make a fine addition" },
  { id: 4, name: "Boba Fett", icon: "🪖", hp: 3, q: "He's no good to me dead" },
  { id: 5, name: "Jabba's Rancor", icon: "👾", hp: 4, q: "RAAAWWRR!" },
  { id: 6, name: "The Inquisitor", icon: "🔴", hp: 4, q: "There are things more frightening than death" },
  { id: 7, name: "Asajj Ventress", icon: "⚔️", hp: 4, q: "I am fear. I am the queen." },
  { id: 8, name: "Darth Vader", icon: "🖤", hp: 5, q: "I find your lack of faith disturbing" },
  { id: 9, name: "Emperor Palpatine", icon: "⚡", hp: 5, q: "Everything is proceeding as I have foreseen" },
  { id: 10, name: "Kylo Ren", icon: "🔥", hp: 5, q: "I will finish what you started" },
];

const LORE = [
  "The Millennium Falcon made the Kessel Run in less than 12 parsecs!",
  "Yoda trained Jedi for over 800 years before Luke arrived.",
  "R2-D2 and C-3PO appear in every single Star Wars film.",
  "Chewbacca is over 200 years old!",
  "A lightsaber crystal is called a Kyber crystal — it chooses its Jedi.",
  "Darth Vader's breathing sound is made with a scuba regulator.",
  "Baby Yoda's real name is Grogu!",
  "The word 'Jedi' comes from Japanese 'Jidaigeki'.",
  "Ewoks were inspired by George Lucas's dog.",
  "In the original script, Yoda was called 'Buffy'!",
  "Han Solo was frozen in carbonite because Harrison Ford wasn't sure he'd return.",
  "The Force has a light side and dark side — balance is key.",
];

const LW = [
  ["learn", "group", "heard", "early", "earth", "fruit", "heart", "guide", "guard", "build"],
  ["answer", "appear", "arrive", "breath", "caught", "centre", "circle", "decide", "enough", "famous"],
  ["breathe", "century", "certain", "history", "grammar", "island", "length", "library", "minute", "notice"],
  ["believe", "bicycle", "complete", "continue", "describe", "exercise", "february", "medicine", "opposite", "potatoes"],
  ["accidentally", "actually", "address", "business", "calendar", "consider", "different", "difficult", "disappear", "experience"],
  ["experiment", "extreme", "favourite", "forward", "height", "imagine", "increase", "important", "interest", "knowledge"],
  ["material", "mention", "natural", "naughty", "occasion", "often", "ordinary", "particular", "peculiar", "perhaps"],
  ["popular", "position", "possess", "possession", "possible", "pressure", "probably", "promise", "purpose", "quarter"],
  ["question", "recent", "regular", "reign", "remember", "sentence", "separate", "special", "straight", "strange"],
  ["strength", "suppose", "surprise", "therefore", "though", "thought", "through", "various", "weight", "woman", "women"],
];

const WS = {
  accidentally: "Daddy accidentally dropped a pancake, but he is still the best.",
  actually: "Daddy actually makes the best roast potatoes in the world.",
  address: "Daddy said the new address smells like pancakes already.",
  answer: "Arthur always knows the answer when Daddy asks about potatoes.",
  appear: "Evvie will appear suddenly like a cheeky monkey.",
  arrive: "When Daddy arrives home, everyone wants potatoes.",
  believe: "Arthur believes his daddy is the coolest.",
  bicycle: "Daddy pushed Arthur's bicycle because he is very strong.",
  breath: "Mummy took a deep breath before sitting on the sofa.",
  breathe: "Daddy told Evvie to breathe slowly after her cheeky dance.",
  build: "Arthur wants to build a potato tower with Daddy.",
  business: "Daddy was busy, but he still made amazing pancakes.",
  calendar: "Mummy checked the calendar while drinking tea.",
  caught: "Daddy caught Evvie being cheeky again.",
  centre: "Daddy put the pancake in the centre of Arthur's plate.",
  century: "Daddy said his potatoes are the best of the century.",
  certain: "Arthur is certain Daddy is the strongest.",
  circle: "Evvie drew a circle around Daddy's pancake.",
  complete: "Daddy will complete any task because he always completes everything.",
  consider: "Arthur will consider sharing his potatoes with Evvie.",
  continue: "Daddy will continue being the coolest forever.",
  decide: "Mummy decided to sit on the sofa with a big cup of tea.",
  describe: "Arthur can describe Daddy in one word: best.",
  different: "Daddy makes pancakes in different shapes for Evvie.",
  difficult: "It's difficult to beat Daddy at anything.",
  disappear: "The roast potatoes disappear when Arthur and Evvie see them.",
  early: "Daddy wakes up early to make pancakes.",
  earth: "Daddy says potatoes come from the earth, so they must be magical.",
  enough: "There is never enough potato for Arthur and Evvie.",
  exercise: "Daddy does lots of exercise, which is why he is strong.",
  experience: "Daddy has experience in making perfect roast potatoes.",
  experiment: "Evvie tried a pancake experiment and made a mess.",
  extreme: "Daddy makes pancakes with extreme skill.",
  famous: "Daddy is famous in the house for his potatoes.",
  favourite: "Daddy's pancakes are Arthur's favourite food.",
  february: "In February, Daddy promised extra pancakes.",
  forward: "Arthur looked forwards to Daddy's pancake day.",
  fruit: "Mummy said fruit is healthy, but Arthur wanted potatoes instead.",
  grammar: "Daddy helps Arthur with grammar because he completes everything.",
  group: "The whole group agreed Daddy is cool.",
  guard: "Daddy will guard the potatoes from cheeky Evvie.",
  guide: "Daddy will guide Arthur through the pancake recipe.",
  heard: "Evvie heard Daddy say he was making potatoes and ran in.",
  heart: "Daddy makes heart-shaped pancakes for Mummy.",
  height: "Arthur's love for Daddy is taller than any height.",
  history: "Daddy's potatoes are the best in the history of potatoes.",
  imagine: "Imagine Daddy without pancakes—impossible!",
  increase: "Daddy will increase the number of pancakes for Arthur.",
  important: "It is important that Daddy tastes the potatoes first.",
  interest: "Arthur showed great interest in Daddy's pancake flipping.",
  island: "Daddy said he could live on a potato island.",
  knowledge: "Daddy has great knowledge of crispy potatoes.",
  learn: "Arthur wants to learn Daddy's pancake secrets.",
  length: "The length of Evvie's cheekiness is endless.",
  library: "Arthur borrowed a book about potatoes from the library.",
  material: "Mummy used soft material for the sofa blanket.",
  medicine: "Daddy said laughter is the best medicine.",
  mention: "Please don't mention pancakes to Evvie or she'll go wild.",
  minute: "Evvie can steal a potato in one minute.",
  natural: "It's natural for Daddy to be cool and strong.",
  naughty: "Evvie was cheeky but not naughty—just a monkey.",
  notice: "Mummy didn't notice Evvie climbing the sofa.",
  occasion: "Occasionally Daddy lets Arthur flip a pancake.",
  often: "Daddy often makes roast potatoes because everyone loves them.",
  opposite: "The opposite of weak is Daddy.",
  ordinary: "Daddy is not ordinary; he is the best.",
  particular: "Evvie is very particular about her potatoes.",
  peculiar: "Daddy found it peculiar that the potatoes disappeared again.",
  perhaps: "Perhaps Daddy will make pancakes today.",
  popular: "Daddy's potatoes are the most popular food in the house.",
  position: "Arthur took his favourite position next to Daddy.",
  possess: "Evvie treats potatoes as her special possession.",
  possession: "Evvie treats potatoes as her special possession.",
  possible: "It is possible Daddy makes the best food ever.",
  potatoes: "Arthur and Evvie love potatoes more than anything.",
  pressure: "Daddy handles pressure well when flipping pancakes.",
  probably: "Mummy probably wants another cup of tea.",
  promise: "Daddy made a promise to cook pancakes tomorrow.",
  purpose: "The purpose of breakfast is to enjoy Daddy's cooking.",
  quarter: "Daddy ate a quarter of the potatoes before anyone saw.",
  question: "Arthur asked an important question: More potatoes?",
  recent: "Recent events show that Daddy is the coolest.",
  regular: "Daddy is the regular champion of pancake making.",
  reign: "Daddy will reign forever as the potato king.",
  remember: "Remember to thank Daddy for the pancakes.",
  sentence: "Arthur wrote a sentence saying Daddy is the best.",
  separate: "Daddy had to separate Arthur and Evvie when they fought over potatoes.",
  special: "Daddy makes a special pancake just for Mummy.",
  straight: "Evvie ran straight to the kitchen when she smelled potatoes.",
  strange: "Daddy thought it strange how fast the potatoes vanished.",
  strength: "Daddy uses his strength to lift Arthur high.",
  suppose: "I suppose Daddy could make even more pancakes.",
  surprise: "Daddy made a surprise plate of roast potatoes.",
  therefore: "Arthur loves potatoes; therefore, he loves Daddy's cooking.",
  though: "Although she is cheeky, Evvie loves Daddy lots.",
  although: "Although she is cheeky, Evvie loves Daddy lots.",
  thought: "Arthur thought Daddy's pancakes were magical.",
  through: "Daddy walked through the kitchen carrying potatoes like a hero.",
  various: "Daddy cooks various brilliant things, but potatoes are the best.",
  weight: "Daddy is strong enough to lift Arthur's weight easily.",
  woman: "Mummy is the woman who drinks the most tea in the house.",
  women: "Mummy is the woman who drinks the most tea in the house.",
};

const DEFP = {
  username: "",
  level: 1,
  totalScore: 0,
  jediRank: "Youngling",
  lightsaberColor: 0,
  kyberCrystals: 0,
  unlockedSabers: [0],
  wordProgress: {},
  planetsCompleted: [],
};

// ─── UTILS ──────────────────────────────────────────────────────────────────

let _audioCtx = null;
const getAudioCtx = () => {
  try {
    if (!_audioCtx) _audioCtx = new AudioContext();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    return _audioCtx;
  } catch {
    return null;
  }
};

// Persistent mute system
let _muted = false;
try { _muted = localStorage.getItem("jedi_muted") === "true"; } catch {}
const isMuted = () => _muted;
const setMutedGlobal = (v) => {
  _muted = v;
  try { localStorage.setItem("jedi_muted", v ? "true" : "false"); } catch {}
};

const sfx = (t) => {
  if (_muted) return;
  try {
    const c = getAudioCtx();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    if (t === "ok") {
      o.frequency.setValueAtTime(523, c.currentTime);
      o.frequency.setValueAtTime(659, c.currentTime + 0.1);
      o.frequency.setValueAtTime(784, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
      o.start(); o.stop(c.currentTime + 0.4);
    } else if (t === "no") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.setValueAtTime(100, c.currentTime + 0.15);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.3);
      o.start(); o.stop(c.currentTime + 0.3);
    } else if (t === "pip") {
      o.frequency.setValueAtTime(880, c.currentTime);
      o.frequency.setValueAtTime(1100, c.currentTime + 0.08);
      g.gain.setValueAtTime(0.08, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
      o.start(); o.stop(c.currentTime + 0.2);
    } else if (t === "step") {
      o.frequency.setValueAtTime(300 + Math.random() * 80, c.currentTime);
      g.gain.setValueAtTime(0.03, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
      o.start(); o.stop(c.currentTime + 0.06);
    } else if (t === "boss") {
      o.type = "square";
      o.frequency.setValueAtTime(100, c.currentTime);
      o.frequency.setValueAtTime(60, c.currentTime + 0.5);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.8);
      o.start(); o.stop(c.currentTime + 0.8);
    } else if (t === "win") {
      o.frequency.setValueAtTime(523, c.currentTime);
      o.frequency.setValueAtTime(659, c.currentTime + 0.15);
      o.frequency.setValueAtTime(784, c.currentTime + 0.3);
      o.frequency.setValueAtTime(1047, c.currentTime + 0.45);
      g.gain.setValueAtTime(0.12, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.7);
      o.start(); o.stop(c.currentTime + 0.7);
    } else if (t === "saber") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, c.currentTime);
      o.frequency.setValueAtTime(220, c.currentTime + 0.1);
      o.frequency.setValueAtTime(200, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.06, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
      o.start(); o.stop(c.currentTime + 0.4);
    } else if (t === "attack") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(120, c.currentTime);
      o.frequency.setValueAtTime(60, c.currentTime + 0.2);
      g.gain.setValueAtTime(0.18, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
      o.start(); o.stop(c.currentTime + 0.5);
    } else if (t === "lightning") {
      o.type = "square";
      o.frequency.setValueAtTime(900, c.currentTime);
      o.frequency.setValueAtTime(200, c.currentTime + 0.04);
      o.frequency.setValueAtTime(700, c.currentTime + 0.08);
      o.frequency.setValueAtTime(150, c.currentTime + 0.12);
      g.gain.setValueAtTime(0.1, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.2);
      o.start(); o.stop(c.currentTime + 0.2);
    } else if (t === "explode") {
      o.type = "sawtooth";
      o.frequency.setValueAtTime(200, c.currentTime);
      o.frequency.setValueAtTime(50, c.currentTime + 0.3);
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.6);
      o.start(); o.stop(c.currentTime + 0.6);
    }
  } catch {}
};

const say = (w) => {
  if (_muted) return;
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(w);
  u.rate = 0.85;
  speechSynthesis.speak(u);
};

const sent = (w) => {
  const s = WS[w.toLowerCase()];
  if (s) return { full: s, masked: s.replace(new RegExp(w, "gi"), "_______") };
  return { full: `The word is ${w}.`, masked: "The word is _______." };
};

// ─── STARFIELD ──────────────────────────────────────────────────────────────

const Stars = ({ n = 120 }) => {
  const stars = useMemo(
    () => Array.from({ length: n }, (_, i) => ({
      i, x: Math.random() * 100, y: Math.random() * 100,
      sz: Math.random() * 2.2 + 0.4, op: Math.random() * 0.7 + 0.3,
      d: Math.random() * 3 + 2, dl: Math.random() * 4,
    })),
    [n]
  );
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {stars.map((s) => (
        <div key={s.i} style={{
          position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
          width: s.sz, height: s.sz, borderRadius: "50%",
          backgroundColor: s.sz > 1.8 ? "#FFFDE8" : "#E8E8FF",
          opacity: s.op,
          animation: `starTwinkle ${s.d}s ease-in-out ${s.dl}s infinite`,
        }} />
      ))}
    </div>
  );
};

// ─── MUTE BUTTON ────────────────────────────────────────────────────────────

const MuteBtn = () => {
  const [m, setM] = useState(isMuted());
  return (
    <button onClick={() => { const n = !m; setM(n); setMutedGlobal(n); }} style={{
      background: "none", border: "1px solid #333", borderRadius: 6,
      color: m ? "#666" : "#FFE066", fontSize: 14, padding: "3px 8px",
      cursor: "pointer", minWidth: 32,
    }} title={m ? "Unmute" : "Mute"}>
      {m ? "🔇" : "🔊"}
    </button>
  );
};

// ─── NEBULA BACKGROUND ──────────────────────────────────────────────────────

const Nebula = ({ color = "#4A9EEA", color2, opacity = 0.07 }) => {
  const c2 = color2 || color;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: "70vw", height: "50vh", left: "5%", top: "15%", background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift 28s ease-in-out infinite", filter: "blur(50px)" }} />
      <div style={{ position: "absolute", width: "55vw", height: "45vh", right: "0", bottom: "5%", background: `radial-gradient(ellipse, ${c2}${Math.round(opacity * 0.6 * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift2 22s ease-in-out infinite", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", width: "30vw", height: "30vh", left: "40%", top: "50%", background: `radial-gradient(ellipse, ${color}${Math.round(opacity * 0.4 * 255).toString(16).padStart(2, "0")}, transparent 70%)`, animation: "nebulaDrift 35s ease-in-out 5s infinite reverse", filter: "blur(45px)" }} />
    </div>
  );
};

// ─── AMBIENT PARTICLES ──────────────────────────────────────────────────────

const ForceParticles = ({ count = 15, color = "#FFE066" }) => {
  const pts = useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, x: Math.random() * 100, y: Math.random() * 100,
    sz: Math.random() * 3 + 1, dur: Math.random() * 6 + 4, dl: Math.random() * 6,
  })), [count]);
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
      {pts.map((p) => (
        <div key={p.i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, width: p.sz, height: p.sz, borderRadius: "50%", background: color, boxShadow: `0 0 ${p.sz * 2}px ${color}`, animation: `particleFloat ${p.dur}s ease-in-out ${p.dl}s infinite` }} />
      ))}
    </div>
  );
};

// ─── BOSS TAUNTS ────────────────────────────────────────────────────────────

const BOSS_TAUNTS = [
  "Your spelling is as weak as your training!",
  "The dark side cannot be defeated by words!",
  "I expected more from a Jedi!",
  "Another mistake... how disappointing.",
  "The Force is WEAK with this one!",
  "Give up now, youngling!",
  "Your master would be ashamed!",
  "I sense great fear in you...",
  "You cannot win this fight!",
  "Pathetic!",
];

// ─── HYPERSPACE OVERLAY ─────────────────────────────────────────────────────

const HyperspaceOverlay = ({ active, onDone }) => {
  const lines = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    i, x: Math.random() * 100, delay: Math.random() * 0.2, w: Math.random() * 2 + 1,
  })), []);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (!active) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#05050F", overflow: "hidden", animation: "hyperspaceFade .7s forwards" }}>
      {lines.map((l) => (
        <div key={l.i} style={{
          position: "absolute", left: `${l.x}%`, top: "50%", width: l.w,
          background: "linear-gradient(to bottom, transparent, #4A9EEA88, #FFFFFFCC, #4A9EEA88, transparent)",
          animation: `hyperspaceStretch .5s ${l.delay}s ease-in forwards`,
          height: 2, opacity: 0,
        }} />
      ))}
    </div>
  );
};

// ─── FORCE METER ────────────────────────────────────────────────────────────

const ForceMeter = ({ cur, max, saberIdx }) => {
  const p = Math.max(0, (cur / max) * 100);
  const c = getSaber(saberIdx);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#FFE066", fontFamily: "monospace", letterSpacing: 1 }}>FORCE</span>
      <div style={{ flex: 1, height: 14, background: "#1a1a2e", borderRadius: 7, border: "1px solid #333355", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, borderRadius: 6, background: `linear-gradient(90deg,${c.c}88,${c.c})`, boxShadow: `0 0 12px ${c.g}`, transition: "width .5s" }} />
      </div>
      <span style={{ fontSize: 12, color: "#AAB", fontFamily: "monospace", minWidth: 36, textAlign: "right" }}>{cur}/{max}</span>
    </div>
  );
};

// ─── MAP GEN ────────────────────────────────────────────────────────────────

const GS = 8;

const canReach = (grid, sx, sy, tx, ty) => {
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

const genMap = (pi, words) => {
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

// ─── KEYBOARD ───────────────────────────────────────────────────────────────

const KB = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const Keyboard = ({ onKey, onDel, onSubmit, typed, result, saber }) => (
  <div style={{ width: "100%", maxWidth: 480, padding: "0 8px" }}>
    {KB.map((row, ri) => (
      <div key={ri} style={{ display: "flex", justifyContent: "center", gap: 3, marginBottom: 3 }}>
        {row.map((k) => (
          <button key={k} onClick={() => onKey(k.toLowerCase())} style={{
            width: 34, height: 40, fontSize: 13, fontWeight: 600,
            background: "#0E0E1E",
            border: `1px solid ${saber.c}44`,
            borderRadius: 5, color: "#CCCCEE", cursor: "pointer",
            boxShadow: `0 0 4px ${saber.g}, inset 0 0 3px ${saber.c}11`,
            transition: "box-shadow .15s, transform .1s",
          }}>{k}</button>
        ))}
      </div>
    ))}
    <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 3 }}>
      <button onClick={onDel} style={{
        flex: 1, maxWidth: 110, height: 40, fontSize: 11, fontWeight: 600,
        background: "#1a0a0a", border: "1px solid #442222", borderRadius: 5,
        color: "#AA6666", cursor: "pointer", letterSpacing: 1,
      }}>◂ DELETE</button>
      <button onClick={onSubmit} disabled={!typed || !!result} style={{
        flex: 2, maxWidth: 220, height: 40, fontSize: 13, fontWeight: 700,
        background: typed && !result ? `${saber.c}22` : "#111118",
        border: `1px solid ${typed && !result ? saber.c + "66" : "#222"}`,
        borderRadius: 5, color: typed && !result ? "#FFE066" : "#444",
        cursor: typed && !result ? "pointer" : "default", letterSpacing: 2,
        boxShadow: typed && !result ? `0 0 10px ${saber.g}` : "none",
      }}>SUBMIT ▸</button>
    </div>
  </div>
);

// ─── SABER PICKER ───────────────────────────────────────────────────────────

const SaberPicker = ({ profile, onSelect, onClose }) => {
  const owned = profile.unlockedSabers || [0];
  const current = profile.lightsaberColor;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#05050FEE", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", animation: "slideIn .3s" }}>
      <div style={{ background: "#0A0A1A", border: "1px solid #2a2a4a", borderRadius: 16, padding: 24, maxWidth: 380, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#FFE06666", letterSpacing: 3, marginBottom: 4 }}>LIGHTSABER</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#FFE066", margin: "0 0 6px", letterSpacing: 2 }}>ARMORY</h2>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 16 }}>Kyber Crystals: <b style={{ color: "#66CCFF" }}>{profile.kyberCrystals}</b></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {SABERS.map((s, i) => {
            const isOwned = owned.includes(i);
            const isCurrent = current === i;
            const cost = SABER_COSTS[i];
            const canAfford = profile.kyberCrystals >= cost;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: isCurrent ? `${s.c}15` : "#0E0E1E",
                border: `1px solid ${isCurrent ? s.c + "66" : "#1a1a3a"}`,
                borderRadius: 10, transition: "all .2s",
              }}>
                <div style={{
                  width: 6, height: 36, borderRadius: 3,
                  background: `linear-gradient(to bottom, ${s.c}, ${s.c}88)`,
                  boxShadow: `0 0 8px ${s.g}`,
                }} />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: s.c }}>{s.name}</div>
                  {!isOwned && <div style={{ fontSize: 10, color: "#888" }}>{cost} Kyber Crystals</div>}
                </div>
                {isCurrent ? (
                  <span style={{ fontSize: 10, color: s.c, letterSpacing: 1, fontWeight: 700, padding: "4px 10px", background: `${s.c}15`, borderRadius: 4 }}>EQUIPPED</span>
                ) : isOwned ? (
                  <button onClick={() => { sfx("saber"); onSelect(i); }} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", background: `${s.c}22`, border: `1px solid ${s.c}44`, borderRadius: 4, color: s.c, cursor: "pointer" }}>EQUIP</button>
                ) : (
                  <button onClick={() => canAfford && onSelect(i, cost)} disabled={!canAfford} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, padding: "4px 10px", background: canAfford ? "#FFE06615" : "#111", border: `1px solid ${canAfford ? "#FFE06644" : "#222"}`, borderRadius: 4, color: canAfford ? "#FFE066" : "#444", cursor: canAfford ? "pointer" : "default" }}>
                    UNLOCK {cost}💎
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, padding: "8px 24px", fontSize: 12, background: "none", border: "1px solid #333", borderRadius: 8, color: "#888", cursor: "pointer", letterSpacing: 1 }}>CLOSE</button>
      </div>
    </div>
  );
};

// ─── PLANET EXPLORER ────────────────────────────────────────────────────────

const Explorer = ({ planet, pi, words, boss, profile, score, defeated, onBattle, onBoss, onCollect, onExit }) => {
  const [pos, setPos] = useState({ x: 0, y: GS - 1 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [map, setMap] = useState(null);
  const [ents, setEnts] = useState([]);
  const [msg, setMsg] = useState(null);
  const saber = getSaber(profile.lightsaberColor);

  // Mobile-responsive tile size
  const [ts, setTs] = useState(Math.min(48, (window.innerWidth - 40) / GS));
  useEffect(() => {
    const onResize = () => setTs(Math.min(48, (window.innerWidth - 40) / GS));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const posRef = useRef(pos);
  const entsRef = useRef(ents);
  const msgTimerRef = useRef(null);
  posRef.current = pos;
  entsRef.current = ents;

  useEffect(() => {
    const d = genMap(pi, words);
    setMap(d);
    setEnts(d.entities);
    setPos({ x: 0, y: GS - 1 });
    posRef.current = { x: 0, y: GS - 1 };
  }, [pi, words]);

  useEffect(() => {
    if (!map) return;
    setEnts((prev) => prev.filter((e) => !(e.type === "enemy" && defeated.includes(e.word))));
  }, [defeated, map]);

  const total = words.length;
  const def = defeated.length;
  const bossOk = def >= total;

  const showMsg = useCallback((text, duration = 800) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    setMsg(text);
    msgTimerRef.current = setTimeout(() => setMsg(null), duration);
  }, []);

  useEffect(() => () => { if (msgTimerRef.current) clearTimeout(msgTimerRef.current); }, []);

  const move = useCallback((dx, dy) => {
    if (!map) return;
    setDir({ x: dx, y: dy });
    const cur = posRef.current;
    const nx = cur.x + dx, ny = cur.y + dy;
    if (nx < 0 || ny < 0 || nx >= GS || ny >= GS) return;
    if (map.grid[ny][nx] === 1) { showMsg("Blocked!"); return; }
    if (map.grid[ny][nx] === 2) { showMsg("Hazardous terrain!"); return; }

    sfx("step");
    const newPos = { x: nx, y: ny };
    posRef.current = newPos;
    setPos(newPos);

    const ent = entsRef.current.find((e) => e.x === nx && e.y === ny);
    if (ent) {
      if (ent.type === "enemy") {
        onBattle(ent.word, ent.id);
      } else if (ent.type === "kyber") {
        sfx("pip");
        onCollect("kyber", 2);
        setEnts((p) => p.filter((e) => e.id !== ent.id));
        showMsg("✦ +2 Kyber Crystals!", 1500);
      } else if (ent.type === "holocron") {
        sfx("pip");
        const l = LORE[Math.floor(Math.random() * LORE.length)];
        showMsg(`📦 ${l}`, 4000);
        setEnts((p) => p.filter((e) => e.id !== ent.id));
        onCollect("score", 50);
      } else if (ent.type === "boss") {
        if (bossOk) {
          sfx("boss");
          onBoss();
        } else {
          showMsg(`🔒 Defeat all enemies first! (${def}/${total})`, 2000);
          posRef.current = cur;
          setPos(cur);
        }
      }
    }
  }, [map, bossOk, def, total, onBattle, onBoss, onCollect, showMsg]);

  useEffect(() => {
    const h = (e) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w") { e.preventDefault(); move(0, -1); }
      if (k === "ArrowDown" || k === "s") { e.preventDefault(); move(0, 1); }
      if (k === "ArrowLeft" || k === "a") { e.preventDefault(); move(-1, 0); }
      if (k === "ArrowRight" || k === "d") { e.preventDefault(); move(1, 0); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [move]);

  if (!map) return null;
  const dp = { background: "#12122A", border: "1px solid #2a2a4a", borderRadius: 8, color: "#8888CC", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", display: "flex", flexDirection: "column" }}>
      <Stars n={30} />
      <Nebula color={planet.c} opacity={0.06} />
      <ForceParticles count={8} color={planet.c + "66"} />
      <div style={{ position: "relative", zIndex: 10, padding: "10px 14px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <button onClick={onExit} style={{ background: "none", border: "none", color: "#556", fontSize: 12, cursor: "pointer" }}>◂ RETREAT</button>
          <div style={{ fontSize: 12, color: planet.c, letterSpacing: 1.5, fontWeight: 700 }}>{planet.name.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 14, color: "#FFE066", fontFamily: "monospace", fontWeight: 700 }}>{score}</div>
            <MuteBtn />
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11, color: "#888" }}>
          <span>Enemies: <b style={{ color: def >= total ? "#44CC44" : "#FFE066" }}>{def}/{total}</b></span>
          <span>Kyber: <b style={{ color: "#66CCFF" }}>{profile.kyberCrystals}</b></span>
          {bossOk && <span style={{ color: "#EE6666", animation: "planetPulse 1.5s infinite" }}>✦ BOSS UNLOCKED</span>}
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 10, padding: 16 }}>
        {msg && <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", background: "#12122AEE", border: "1px solid #FFE06633", borderRadius: 8, padding: "10px 18px", fontSize: 13, color: "#CCCCDD", zIndex: 30, maxWidth: 320, textAlign: "center", animation: "fadeSlideUp .3s", boxShadow: "0 4px 20px rgba(0,0,0,.5)" }}>{msg}</div>}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${GS},${ts}px)`, gridTemplateRows: `repeat(${GS},${ts}px)`, gap: 1, background: "#00000066", borderRadius: 8, overflow: "hidden", border: `1px solid ${planet.c}33`, boxShadow: `0 0 30px ${planet.gc}` }}>
          {map.grid.map((row, y) => row.map((cell, x) => {
            const isP = pos.x === x && pos.y === y;
            const ent = ents.find((e) => e.x === x && e.y === y);
            const gc = planet.gnd[(x + y) % planet.gnd.length];
            let bg = gc;
            if (cell === 1) bg = planet.wc;
            if (cell === 2) bg = planet.hc;
            return (
              <div key={`${x}-${y}`} onClick={() => { const dx = x - pos.x, dy = y - pos.y; if (Math.abs(dx) + Math.abs(dy) === 1) move(dx, dy); }} style={{ width: ts, height: ts, background: bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer", fontSize: ts * 0.5 }}>
                {cell === 1 && <span style={{ fontSize: ts * 0.45, opacity: 0.6 }}>{planet.we}</span>}
                {cell === 2 && <span style={{ fontSize: ts * 0.4, opacity: 0.5 }}>{planet.he}</span>}
                {ent && !isP && ent.type !== "decor" && <span style={{ fontSize: ts * 0.5, position: "absolute", zIndex: 5, animation: ent.type === "boss" ? (bossOk ? "entityBob 1s infinite" : "none") : ent.type === "enemy" ? "entityBob 1.5s infinite" : "none", opacity: ent.type === "boss" && !bossOk ? 0.4 : 1, filter: ent.type === "boss" && bossOk ? `drop-shadow(0 0 6px ${planet.c})` : "none" }}>{ent.emoji}</span>}
                {ent && ent.type === "decor" && !isP && <span style={{ fontSize: ts * 0.35, opacity: 0.4 }}>{ent.emoji}</span>}
                {isP && <div style={{ position: "absolute", zIndex: 10, fontSize: ts * 0.55, filter: `drop-shadow(0 0 6px ${saber.c})`, transform: dir.x < 0 ? "scaleX(-1)" : "none" }}>🥷</div>}
              </div>
            );
          }))}
        </div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3,50px)", gridTemplateRows: "repeat(3,42px)", gap: 3 }}>
          <div /><button onClick={() => move(0, -1)} style={dp}>▲</button><div />
          <button onClick={() => move(-1, 0)} style={dp}>◀</button>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#444" }}>MOVE</div>
          <button onClick={() => move(1, 0)} style={dp}>▶</button>
          <div /><button onClick={() => move(0, 1)} style={dp}>▼</button><div />
        </div>
      </div>
    </div>
  );
};

// ─── SPELLING ENCOUNTER ─────────────────────────────────────────────────────

const Encounter = ({ word, planet, profile, onResult }) => {
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [sk, setSk] = useState(0);
  const [showSlash, setShowSlash] = useState(false);
  const sn = useMemo(() => sent(word), [word]);
  const saber = getSaber(profile.lightsaberColor);
  const inp = useRef(null);
  const enRef = useRef(planet.en[Math.floor(Math.random() * planet.en.length)]);
  const timerRef = useRef(null);

  useEffect(() => {
    setTyped("");
    setResult(null);
    setShowSlash(false);
    const t = setTimeout(() => { say(word); inp.current?.focus(); }, 300);
    return () => clearTimeout(t);
  }, [word]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const submit = () => {
    if (!typed.trim() || result) return;
    if (typed.trim().toLowerCase() === word.toLowerCase()) {
      setResult("ok"); sfx("ok"); setShowSlash(true);
      logSpellingAttempt(profile.username, word, true, { level: profile.level });
      timerRef.current = setTimeout(() => onResult(true), 1200);
    } else {
      setResult("no"); sfx("no"); setSk((k) => k + 1);
      logSpellingAttempt(profile.username, word, false, { level: profile.level });
      timerRef.current = setTimeout(() => { setTyped(""); setResult(null); inp.current?.focus(); }, 1500);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 40%, #0a0a2a, #05050FEE)", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "encounterAppear .4s ease-out" }}>
      <ForceParticles count={6} color={saber.c + "44"} />
      {showSlash && (
        <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 110, pointerEvents: "none" }} />
      )}
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#EE666688", letterSpacing: 2 }}>ENCOUNTER</div>
        <div style={{ fontSize: 14, color: planet.c, fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{enRef.current}</div>
      </div>
      <div style={{ fontSize: 15, color: "#AABB", textAlign: "center", maxWidth: 400, padding: "0 20px", lineHeight: 1.6, marginBottom: 14 }}>{result === "ok" ? sn.full : sn.masked}</div>
      <button onClick={() => say(word)} style={{ marginBottom: 12, padding: "6px 16px", fontSize: 12, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
      <div key={sk} style={{ fontSize: 32, fontWeight: 800, letterSpacing: 6, textAlign: "center", color: result === "ok" ? "#44CC44" : result === "no" ? "#EE4444" : "#FFE066", fontFamily: "monospace", minHeight: 44, marginBottom: 8, animation: result === "no" ? "headShake .5s" : "none" }}>
        {typed || <span style={{ color: "#333", fontSize: 13, letterSpacing: 2 }}>TYPE THE WORD...</span>}
      </div>
      {result && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 10, color: result === "ok" ? "#44CC44" : "#EE4444", animation: "fadeSlideUp .3s" }}>{result === "ok" ? "✦ CORRECT! +100" : `THE WORD WAS: ${word.toUpperCase()}`}</div>}
      <input ref={inp} type="text" value={typed} onChange={(e) => { if (!result) setTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
      <Keyboard onKey={(k) => { if (!result) { setTyped((t) => t + k); inp.current?.focus(); } }} onDel={() => { if (!result) setTyped((t) => t.slice(0, -1)); }} onSubmit={submit} typed={typed.trim()} result={result} saber={saber} />
    </div>
  );
};

// ─── BOSS BATTLE ────────────────────────────────────────────────────────────

const BossBattle = ({ boss, words, planet, profile, onWin, onLose }) => {
  const [round, setRound] = useState(0);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState(null);
  const [hp, setHp] = useState(boss.hp);
  const [force, setForce] = useState(5);
  const [sk, setSk] = useState(0);
  const [phase, setPhase] = useState("intro");
  // Visual FX states
  const [bossAnim, setBossAnim] = useState("idle"); // idle | recoil | lunge | defeat
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null); // null | "red" | "green"
  const [sparks, setSparks] = useState([]);
  const [rings, setRings] = useState([]);
  const [taunt, setTaunt] = useState(null);
  const [showSlash, setShowSlash] = useState(false);

  const saber = getSaber(profile.lightsaberColor);
  const inp = useRef(null);
  const timerRef = useRef(null);
  const timers = useRef([]);
  const bw = useMemo(() => [...words].sort(() => Math.random() - 0.5).slice(0, boss.hp), [words, boss.hp]);
  const cw = bw[round];
  const sn = useMemo(() => (cw ? sent(cw) : { masked: "", full: "" }), [cw]);

  // Rage: 0 (full hp) → 1 (dead)
  const rage = 1 - hp / boss.hp;
  const bossSize = 60 + rage * 28;
  const bgRed = Math.round(rage * 40);

  const after = (fn, ms) => { const t = setTimeout(fn, ms); timers.current.push(t); return t; };
  useEffect(() => () => { timers.current.forEach(clearTimeout); if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const triggerSparks = (count = 14, color = saber.c) => {
    const s = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i, angle: (i / count) * 360 + Math.random() * 30,
      dist: 25 + Math.random() * 55, size: 3 + Math.random() * 5, dur: 0.3 + Math.random() * 0.3, color,
    }));
    setSparks(s);
    after(() => setSparks([]), 800);
  };

  const triggerRings = (count = 3, color = saber.c) => {
    const r = Array.from({ length: count }, (_, i) => ({ id: Date.now() + i, delay: i * 0.12, color }));
    setRings(r);
    after(() => setRings([]), 1500);
  };

  const doFlash = (color, ms = 500) => { setFlash(color); after(() => setFlash(null), ms); };
  const doShake = (ms = 400) => { setShake(true); after(() => setShake(false), ms); };
  const doTaunt = () => { const t = BOSS_TAUNTS[Math.floor(Math.random() * BOSS_TAUNTS.length)]; setTaunt(t); after(() => setTaunt(null), 2200); };

  // Phase: intro
  useEffect(() => {
    if (phase === "intro") {
      sfx("boss"); sfx("lightning");
      timerRef.current = after(() => setPhase("fight"), 3000);
    }
  }, [phase]);

  // Phase: fight — say word
  useEffect(() => {
    if (phase === "fight" && cw) {
      timerRef.current = after(() => { say(cw); inp.current?.focus(); }, 400);
    }
  }, [round, phase, cw]);

  const submit = () => {
    if (!typed.trim() || result || phase !== "fight") return;
    if (typed.trim().toLowerCase() === cw.toLowerCase()) {
      // ── CORRECT HIT ──
      setResult("ok"); sfx("ok"); setShowSlash(true);
      setBossAnim("recoil"); doFlash("green"); triggerSparks(16); triggerRings(3);
      const nh = hp - 1; setHp(nh);
      logSpellingAttempt(profile.username, cw, true, { level: profile.level, isBossBattle: true });
      after(() => { setBossAnim("idle"); setShowSlash(false); }, 600);
      timerRef.current = after(() => {
        if (nh <= 0) {
          sfx("explode"); sfx("win");
          setBossAnim("defeat"); triggerSparks(24, "#FFE066"); triggerRings(4, "#FFE066"); doFlash("white", 800);
          after(() => setPhase("win"), 1500);
        } else {
          setRound((r) => r + 1); setTyped(""); setResult(null);
        }
      }, 1200);
    } else {
      // ── MISS — BOSS ATTACKS ──
      setResult("no"); sfx("attack"); setSk((k) => k + 1);
      setBossAnim("lunge"); doShake(500); doFlash("red", 600); doTaunt();
      const nf = force - 1; setForce(nf);
      logSpellingAttempt(profile.username, cw, false, { level: profile.level, isBossBattle: true });
      after(() => setBossAnim("idle"), 700);
      if (nf <= 0) timerRef.current = after(() => setPhase("lose"), 1200);
      else timerRef.current = after(() => { setTyped(""); setResult(null); inp.current?.focus(); }, 1800);
    }
  };

  // ── Spark + Ring renderers ──
  const sparkEls = sparks.map((s) => {
    const rad = (s.angle * Math.PI) / 180;
    return <div key={s.id} style={{ position: "absolute", left: `calc(50% + ${Math.cos(rad) * s.dist}px)`, top: `calc(28% + ${Math.sin(rad) * s.dist}px)`, width: s.size, height: s.size, borderRadius: "50%", background: s.color, boxShadow: `0 0 ${s.size * 2}px ${s.color}`, animation: `sparkBurst ${s.dur}s ease-out forwards`, pointerEvents: "none", zIndex: 115 }} />;
  });
  const ringEls = rings.map((r) => (
    <div key={r.id} style={{ position: "absolute", left: "50%", top: "28%", transform: "translate(-50%,-50%)", width: 60, height: 60, borderRadius: "50%", border: `3px solid ${r.color}`, boxShadow: `0 0 15px ${r.color}`, animation: `explosionRing .7s ${r.delay}s ease-out forwards`, opacity: 0, pointerEvents: "none", zIndex: 114 }} />
  ));

  // ── Boss animation style ──
  const bossAnimStyle = bossAnim === "recoil"
    ? { animation: "bossRecoil .6s ease-out" }
    : bossAnim === "lunge"
    ? { animation: "bossLunge .7s ease-out" }
    : bossAnim === "defeat"
    ? { animation: "bossDefeatSpin 1.2s ease-in forwards" }
    : { animation: `bossPulse ${2 - rage}s ease-in-out infinite` };

  // ── INTRO ──
  if (phase === "intro") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={40} />
      <Nebula color="#EE4444" opacity={0.1} />
      {/* Lightning bolts */}
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: `${15 + Math.random() * 70}%`, top: 0, width: 2, height: `${30 + Math.random() * 40}%`, background: "linear-gradient(to bottom, #8888FF, #FFFFFF, #8888FF, transparent)", opacity: 0, animation: `lightningFlicker ${0.8 + Math.random() * 1.2}s ${Math.random() * 2}s infinite`, filter: "blur(1px)", zIndex: 5 }} />
      ))}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", animation: "bossEntrance 1.2s" }}>
        <div style={{ fontSize: 90, marginBottom: 16, filter: `drop-shadow(0 0 30px ${planet.c}) drop-shadow(0 0 60px #EE444444)` }}>{boss.icon}</div>
        <div style={{ fontSize: 10, color: "#EE666688", letterSpacing: 4 }}>SITH LORD</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: "#EE4444", letterSpacing: 4, margin: "8px 0", textShadow: "0 0 30px #EE444466, 0 0 60px #EE444422" }}>{boss.name.toUpperCase()}</h1>
        <p style={{ fontSize: 15, color: "#EE666688", fontStyle: "italic", maxWidth: 320, margin: "0 auto" }}>"{boss.q}"</p>
        <div style={{ marginTop: 24, fontSize: 13, color: "#AAA", letterSpacing: 1 }}>Spell <b style={{ color: "#FFE066" }}>{boss.hp}</b> words to defeat them!</div>
        <div style={{ marginTop: 8, fontSize: 11, color: "#666" }}>You have <b style={{ color: saber.c }}>5 Force</b> — each miss drains one!</div>
      </div>
    </div>
  );

  // ── WIN ──
  if (phase === "win") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={100} />
      <Nebula color="#FFE066" opacity={0.08} />
      <ForceParticles count={30} color="#FFE066" />
      {/* Explosion rings */}
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ position: "absolute", left: "50%", top: "35%", transform: "translate(-50%,-50%)", width: 80, height: 80, borderRadius: "50%", border: `2px solid ${saber.c}`, animation: `explosionRing 1s ${i * 0.2}s ease-out forwards`, opacity: 0, pointerEvents: "none" }} />
      ))}
      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 16, animation: "planetFloat 2s infinite", filter: "drop-shadow(0 0 20px #FFE066)" }}>✦</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#FFE066", letterSpacing: 4, textShadow: "0 0 30px #FFE06644, 0 0 60px #FFE06622" }}>{boss.name.toUpperCase()}</h1>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#44CC44", letterSpacing: 3, margin: "4px 0", textShadow: "0 0 20px #44CC4444" }}>DEFEATED!</h2>
        <p style={{ fontSize: 16, color: planet.c, marginTop: 12 }}>{planet.name} is free!</p>
        <button onClick={onWin} style={{ marginTop: 28, padding: "14px 36px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ CONTINUE</button>
      </div>
    </div>
  );

  // ── LOSE ──
  if (phase === "lose") return (
    <div style={{ position: "fixed", inset: 0, background: "#05050F", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <Stars n={30} />
      <Nebula color="#EE4444" opacity={0.15} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 16, filter: "drop-shadow(0 0 30px #EE444466)", animation: "bossPulse 1.5s infinite" }}>{boss.icon}</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: "#EE4444", letterSpacing: 4, textShadow: "0 0 30px #EE444444, 0 0 60px #EE444422" }}>THE DARK SIDE PREVAILS</h1>
        <p style={{ fontSize: 14, color: "#AA6666", marginTop: 10 }}>"{boss.q}"</p>
        <p style={{ fontSize: 13, color: "#888", marginTop: 12 }}>Boss HP remaining: {hp}/{boss.hp}</p>
        <button onClick={onLose} style={{ marginTop: 24, padding: "12px 32px", fontSize: 14, fontWeight: 700, letterSpacing: 2, background: "#EE444422", border: "1px solid #EE444466", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>RETURN TO GALAXY MAP</button>
      </div>
    </div>
  );

  // ── FIGHT ──
  const dangerLow = force <= 2;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden",
      background: `radial-gradient(ellipse at 50% 30%, #${(bgRed).toString(16).padStart(2,"0")}0808 0%, #05050F 70%)`,
      animation: shake ? "screenShake .4s ease-out" : "none",
      border: dangerLow ? "2px solid #EE444444" : "none",
    }}>
      <Stars n={30} />
      <Nebula color={rage > 0.5 ? "#EE4444" : planet.c} opacity={0.05 + rage * 0.08} />
      {rage > 0.6 && <ForceParticles count={10} color="#EE444488" />}

      {/* Screen flash overlay */}
      {flash && <div style={{ position: "absolute", inset: 0, zIndex: 120, pointerEvents: "none", background: flash === "red" ? "#EE0000" : flash === "green" ? "#00EE00" : "#FFFFFF", animation: "flashOverlay .5s forwards" }} />}

      {/* Saber slash */}
      {showSlash && <div style={{ position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 220, height: 5, borderRadius: 3, background: `linear-gradient(90deg, transparent, ${saber.c}, ${saber.c}, transparent)`, boxShadow: `0 0 25px ${saber.c}, 0 0 50px ${saber.g}`, animation: "saberSlash .5s forwards", zIndex: 116, pointerEvents: "none" }} />}

      {/* Sparks + Rings */}
      {sparkEls}
      {ringEls}

      {/* Boss taunt */}
      {taunt && <div style={{ position: "absolute", top: "18%", left: "50%", transform: "translateX(-50%)", zIndex: 115, background: "#1a0a0aEE", border: "1px solid #EE444466", borderRadius: 10, padding: "8px 18px", maxWidth: 300, textAlign: "center", animation: "tauntAppear 2s forwards", pointerEvents: "none" }}><div style={{ fontSize: 12, color: "#EE6666", fontWeight: 700, fontStyle: "italic" }}>"{taunt}"</div></div>}

      {/* HUD */}
      <div style={{ position: "relative", zIndex: 10, padding: "12px 16px", borderBottom: "1px solid #2a1a1a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: "#EE6666", fontWeight: 700, letterSpacing: 1 }}>{boss.icon} {boss.name.toUpperCase()}</div>
          <div style={{ fontSize: 12, color: "#888" }}>Round {round + 1}/{boss.hp}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: "#EE6666", fontFamily: "monospace" }}>BOSS</span>
          <div style={{ flex: 1, height: 14, background: "#1a1a1a", borderRadius: 7, border: "1px solid #441111", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(hp / boss.hp) * 100}%`, borderRadius: 6, background: `linear-gradient(90deg,#EE444488,#EE4444)`, boxShadow: `0 0 ${8 + rage * 12}px #EE444466`, transition: "width .5s" }} />
          </div>
          <span style={{ fontSize: 11, color: "#AA6666", fontFamily: "monospace" }}>{hp}/{boss.hp}</span>
        </div>
        <ForceMeter cur={force} max={5} saberIdx={profile.lightsaberColor} />
        {dangerLow && <div style={{ fontSize: 10, color: "#EE4444", letterSpacing: 1, marginTop: 4, animation: "planetPulse 1s infinite", textAlign: "center" }}>⚠ FORCE CRITICALLY LOW ⚠</div>}
      </div>

      {/* Arena */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 20px", position: "relative", zIndex: 10 }}>
        {/* Boss with dynamic sizing + animation */}
        <div style={{ fontSize: bossSize, marginBottom: 12, filter: `drop-shadow(0 0 ${10 + rage * 20}px #EE4444${Math.round(50 + rage * 100).toString(16).padStart(2,"0")})`, transition: "font-size .3s, filter .3s", ...bossAnimStyle }}>{boss.icon}</div>

        <div style={{ fontSize: 15, color: "#AABB", textAlign: "center", maxWidth: 400, lineHeight: 1.6, marginBottom: 12 }}>{result === "ok" ? sn.full : sn.masked}</div>
        <button onClick={() => say(cw)} style={{ marginBottom: 10, padding: "5px 14px", fontSize: 12, background: "#4A9EEA15", border: "1px solid #4A9EEA44", borderRadius: 6, color: "#4A9EEA", cursor: "pointer" }}>🔊 HEAR WORD</button>
        <div key={sk} style={{ fontSize: 30, fontWeight: 800, letterSpacing: 6, textAlign: "center", color: result === "ok" ? "#44CC44" : result === "no" ? "#EE4444" : "#FFE066", fontFamily: "monospace", minHeight: 40, marginBottom: 8, animation: result === "no" ? "headShake .5s" : "none" }}>
          {typed || <span style={{ color: "#333", fontSize: 12, letterSpacing: 2 }}>TYPE THE WORD...</span>}
        </div>
        {result && <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, marginBottom: 8, color: result === "ok" ? "#44CC44" : "#EE4444", animation: "fadeSlideUp .3s" }}>{result === "ok" ? "✦ DIRECT HIT!" : `MISS! THE WORD WAS: ${cw.toUpperCase()}`}</div>}
        <input ref={inp} type="text" value={typed} onChange={(e) => { if (!result) setTyped(e.target.value.toLowerCase()); }} onKeyDown={(e) => e.key === "Enter" && submit()} style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} autoFocus autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" />
        <Keyboard onKey={(k) => { if (!result) { setTyped((t) => t + k); inp.current?.focus(); } }} onDel={() => { if (!result) setTyped((t) => t.slice(0, -1)); }} onSubmit={submit} typed={typed.trim()} result={result} saber={saber} />
      </div>
    </div>
  );
};

// ─── LOGIN ──────────────────────────────────────────────────────────────────

const Login = ({ onLogin, loading }) => {
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Stars n={120} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, width: "100%", maxWidth: 420, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(20px)", transition: "all .8s" }}>
        <div style={{ fontSize: 11, letterSpacing: 6, color: "#4A9EEA", marginBottom: 12, fontFamily: "monospace" }}>A LONG TIME AGO IN A CLASSROOM FAR, FAR AWAY...</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#FFE066", margin: "0 0 4px", letterSpacing: 4, textShadow: "0 0 40px #FFE06633, 0 2px 0 #B8860B" }}>JEDI SPELLING</h1>
        <h2 style={{ fontSize: 16, fontWeight: 400, color: "#FFE06688", margin: 0, letterSpacing: 6 }}>ACADEMY</h2>
        <div style={{ margin: "24px auto", width: 200, height: 3, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 2, background: "linear-gradient(90deg,transparent,#4A9EEA,transparent)", boxShadow: "0 0 10px #4A9EEA44" }} />
        </div>
        <div style={{ background: "#0A0A1A", border: "1px solid #1a1a3a", borderRadius: 12, padding: 28, marginTop: 20 }}>
          <label style={{ display: "block", fontSize: 13, color: "#6666AA", letterSpacing: 2, marginBottom: 12, textAlign: "left" }}>IDENTIFY YOURSELF, YOUNG JEDI</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && onLogin(name)} placeholder="Enter your name..." disabled={loading} autoFocus style={{ width: "100%", padding: "14px 16px", fontSize: 18, background: "#060612", border: "1px solid #2a2a4a", borderRadius: 8, color: "#EEEEFF", outline: "none", letterSpacing: 1 }} onFocus={(e) => (e.target.style.borderColor = "#4A9EEA")} onBlur={(e) => (e.target.style.borderColor = "#2a2a4a")} />
          <button onClick={() => name.trim() && onLogin(name)} disabled={!name.trim() || loading} style={{ width: "100%", marginTop: 16, padding: "14px 0", fontSize: 16, fontWeight: 700, letterSpacing: 3, background: name.trim() ? "linear-gradient(135deg,#4A9EEA22,#4A9EEA11)" : "#111122", border: name.trim() ? "1px solid #4A9EEA66" : "1px solid #222", borderRadius: 8, color: name.trim() ? "#FFE066" : "#444", cursor: name.trim() ? "pointer" : "default", transition: "all .3s" }}>{loading ? "CONNECTING TO THE FORCE..." : "BEGIN TRAINING"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── GALAXY MAP ─────────────────────────────────────────────────────────────

const Galaxy = ({ profile, onSelect, onLogout, onSaberPick }) => {
  const [hov, setHov] = useState(null);
  const [lore, setLore] = useState(null);
  const loreTimer = useRef(null);
  const rank = getRank(profile.level);
  const saber = getSaber(profile.lightsaberColor);
  const pts = [{ x: 15, y: 82 }, { x: 42, y: 72 }, { x: 72, y: 80 }, { x: 85, y: 58 }, { x: 58, y: 42 }, { x: 28, y: 48 }, { x: 12, y: 30 }, { x: 38, y: 16 }, { x: 65, y: 22 }, { x: 85, y: 8 }];

  useEffect(() => () => { if (loreTimer.current) clearTimeout(loreTimer.current); }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Stars n={160} />
      <Nebula color="#4A9EEA" color2="#9944CC" opacity={0.05} />
      <ForceParticles count={12} color="#FFE06622" />
      <div style={{ position: "relative", zIndex: 10, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle,${saber.c}33,transparent)`, border: `2px solid ${saber.c}66`, fontSize: 16 }}>{rank.icon}</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#FFE066", letterSpacing: 1.5 }}>{profile.username.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: "#8888AA" }}>{rank.name} — Level {profile.level}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "#FFE066", fontWeight: 700, fontFamily: "monospace" }}>{profile.totalScore.toLocaleString()}</div>
            <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>SCORE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, color: "#66CCFF", fontWeight: 700, fontFamily: "monospace" }}>{profile.kyberCrystals}</div>
            <div style={{ fontSize: 9, color: "#666688", letterSpacing: 1 }}>KYBER</div>
          </div>
          <MuteBtn />
          <button onClick={onLogout} style={{ background: "none", border: "1px solid #333", borderRadius: 6, color: "#666", fontSize: 10, padding: "3px 8px", cursor: "pointer" }}>LOG OUT</button>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: "16px 0 6px", position: "relative", zIndex: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: 6, color: "#FFE066", margin: 0, textShadow: "0 0 30px #FFE06644" }}>GALAXY MAP</h1>
        <p style={{ fontSize: 11, color: "#556", margin: "4px 0 0", letterSpacing: 2 }}>CHOOSE YOUR DESTINATION</p>
      </div>
      <div style={{ flex: 1, position: "relative", zIndex: 5, padding: "10px 20px 10px", minHeight: 440 }}>
        {PLANETS.map((pl, i) => {
          const p = pts[i], unlk = profile.level >= pl.id, cur = profile.level === pl.id, done = (profile.planetsCompleted || []).includes(pl.id), h = hov === pl.id, bossData = BOSSES[i], sz = cur ? 58 : done ? 48 : 44;
          return (
            <div key={pl.id} onMouseEnter={() => (unlk || done) && setHov(pl.id)} onMouseLeave={() => setHov(null)} onClick={() => (unlk || done) && onSelect(pl.id, done && !cur)} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%,-50%)", cursor: (unlk || done) ? "pointer" : "default", zIndex: h ? 20 : 10, transition: "transform .2s" }}>
              {cur && <div style={{ position: "absolute", inset: -10, borderRadius: "50%", border: `2px solid ${pl.c}44`, animation: "planetPulse 2s infinite" }} />}
              <div style={{ width: sz, height: sz, borderRadius: "50%", background: unlk ? `radial-gradient(circle at 35% 35%,${pl.c}CC,${pl.c}44,${pl.c}11)` : "radial-gradient(circle at 35% 35%,#333,#1a1a1a)", boxShadow: unlk ? `0 0 ${cur ? 28 : 12}px ${pl.gc}` : "none", transition: "all .3s", display: "flex", alignItems: "center", justifyContent: "center", transform: h ? "scale(1.15)" : "scale(1)", opacity: unlk ? 1 : 0.3 }}>
                {done && <span style={{ fontSize: 16, filter: "drop-shadow(0 0 4px #FFE066)" }}>✦</span>}
                {!unlk && !done && <span style={{ fontSize: 14, opacity: 0.5 }}>🔒</span>}
              </div>
              <div style={{ textAlign: "center", marginTop: 5, whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: unlk ? (cur ? "#FFE066" : "#CCC") : "#444" }}>{pl.name.toUpperCase()}</div>
                {cur && <div style={{ fontSize: 8, color: "#FFE06688" }}>▸ YOU ARE HERE</div>}
                {done && !cur && <div style={{ fontSize: 8, color: "#44AA44" }}>PRACTICE</div>}
              </div>
              {h && (unlk || done) && (
                <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 10, padding: "8px 12px", borderRadius: 8, background: "#12122A", border: "1px solid #2a2a4a", boxShadow: "0 4px 20px rgba(0,0,0,.6)", whiteSpace: "nowrap", minWidth: 170, textAlign: "center", zIndex: 30 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: pl.c, letterSpacing: 1 }}>{pl.name}</div>
                  <div style={{ fontSize: 10, color: "#8888AA", fontStyle: "italic", margin: "3px 0" }}>"{pl.desc}"</div>
                  <div style={{ fontSize: 9, color: "#666688" }}>{LW[i]?.length} words — Boss: {bossData.icon} {bossData.name}</div>
                  <div style={{ marginTop: 6, fontSize: 10, fontWeight: 600, color: done && !cur ? "#44AA44" : cur ? "#FFE066" : "#44AA44", padding: "2px 8px", borderRadius: 4, background: done && !cur ? "#44AA4415" : cur ? "#FFE06615" : "#44AA4415" }}>{done && !cur ? "✦ PRACTICE MODE" : done ? "✦ COMPLETED" : "▸ TAP TO LAUNCH"}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ position: "relative", zIndex: 10, padding: "10px 20px 18px", display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={() => {
          if (loreTimer.current) clearTimeout(loreTimer.current);
          setLore(LORE[Math.floor(Math.random() * LORE.length)]);
          loreTimer.current = setTimeout(() => setLore(null), 5000);
        }} style={{ background: "#12122A", border: "1px solid #2a2a4a", borderRadius: 8, color: "#8888CC", fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>✦ ARCHIVES</button>
        <button onClick={onSaberPick} style={{ background: "#12122A", border: `1px solid ${saber.c}44`, borderRadius: 8, color: saber.c, fontSize: 11, padding: "8px 14px", cursor: "pointer" }}>⚔ LIGHTSABER</button>
        <button onClick={() => onSelect(profile.level)} style={{ background: `linear-gradient(135deg,${saber.c}33,${saber.c}11)`, border: `1px solid ${saber.c}66`, borderRadius: 8, color: "#FFE066", fontSize: 13, fontWeight: 700, padding: "8px 24px", cursor: "pointer", letterSpacing: 2 }}>▸ LAUNCH MISSION</button>
      </div>
      {lore && (
        <div style={{ position: "fixed", bottom: 70, left: "50%", transform: "translateX(-50%)", background: "#12122AEE", border: "1px solid #FFE06633", borderRadius: 10, padding: "12px 18px", maxWidth: 380, textAlign: "center", zIndex: 50, animation: "fadeSlideUp .4s" }}>
          <div style={{ fontSize: 9, color: "#FFE06688", letterSpacing: 2, marginBottom: 4 }}>✦ JEDI ARCHIVES ✦</div>
          <div style={{ fontSize: 12, color: "#CCCCDD", lineHeight: 1.5 }}>{lore}</div>
        </div>
      )}
    </div>
  );
};

// ─── BRIEFING ───────────────────────────────────────────────────────────────

const Briefing = ({ planet, boss, words, profile, isPractice, onStart, onBack }) => {
  const [show, setShow] = useState(false);
  const saber = getSaber(profile.lightsaberColor);
  useEffect(() => { const t = setTimeout(() => setShow(true), 200); return () => clearTimeout(t); }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#05050F", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Stars n={80} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, width: "100%", maxWidth: 460, opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(30px)", transition: "all .6s" }}>
        <div style={{ width: 90, height: 90, borderRadius: "50%", margin: "0 auto 16px", background: `radial-gradient(circle at 35% 35%,${planet.c}CC,${planet.c}44)`, boxShadow: `0 0 40px ${planet.gc}`, animation: "planetFloat 4s infinite" }} />
        <div style={{ fontSize: 10, color: isPractice ? "#44AA4488" : "#FFE06666", letterSpacing: 4 }}>{isPractice ? "PRACTICE MISSION" : "MISSION BRIEFING"}</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: planet.c, margin: "4px 0", letterSpacing: 3, textShadow: `0 0 20px ${planet.gc}` }}>{planet.name.toUpperCase()}</h1>
        <p style={{ fontSize: 13, color: "#8888AA", fontStyle: "italic", margin: "0 0 20px" }}>"{planet.desc}"</p>
        {isPractice && <div style={{ fontSize: 11, color: "#44AA44", background: "#44AA4415", padding: "4px 12px", borderRadius: 4, display: "inline-block", marginBottom: 12 }}>Practice — no rank or score changes</div>}
        <div style={{ background: "#0A0A1A", border: "1px solid #1a1a3a", borderRadius: 12, padding: 18, textAlign: "left" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5 }}>WORDS</div><div style={{ fontSize: 20, color: "#FFE066", fontWeight: 700, fontFamily: "monospace" }}>{words.length}</div></div>
            <div><div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5 }}>BOSS</div><div style={{ fontSize: 14, color: "#EE6666", fontWeight: 600, marginTop: 2 }}>{boss.icon} {boss.name}</div></div>
          </div>
          <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 12 }}>
            <div style={{ fontSize: 9, color: "#556", letterSpacing: 1.5, marginBottom: 6 }}>TARGET WORDS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {words.map((w, i) => {
                const m = profile.wordProgress[w] || 0;
                return <span key={i} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 3, background: m >= 3 ? "#44AA4422" : m > 0 ? "#FFE06615" : "#ffffff08", color: m >= 3 ? "#44AA44" : m > 0 ? "#FFE066" : "#667", border: `1px solid ${m >= 3 ? "#44AA4433" : m > 0 ? "#FFE06622" : "#1a1a2e"}` }}>{w}</span>;
              })}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "center" }}>
          <button onClick={onBack} style={{ padding: "10px 18px", fontSize: 12, background: "none", border: "1px solid #333", borderRadius: 8, color: "#666", cursor: "pointer" }}>◂ BACK</button>
          <button onClick={onStart} style={{ padding: "10px 28px", fontSize: 14, fontWeight: 700, letterSpacing: 3, background: `linear-gradient(135deg,${saber.c}33,${saber.c}11)`, border: `1px solid ${saber.c}66`, borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ ENGAGE</button>
        </div>
        <div style={{ marginTop: 18, fontSize: 11, color: "#EE666688", fontStyle: "italic" }}>"{boss.q}"</div>
      </div>
    </div>
  );
};

// ─── GRAND MASTER CELEBRATION ───────────────────────────────────────────────

const GrandMasterCelebration = ({ profile, onContinue }) => {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 300); return () => clearTimeout(t); }, []);
  useEffect(() => { sfx("win"); }, []);

  const saberIcons = SABERS.map((s, i) => (
    <div key={i} style={{
      position: "absolute", animation: `grandMasterOrbit ${6 + i}s linear infinite`,
      animationDelay: `${i * 1.2}s`,
    }}>
      <div style={{ width: 8, height: 24, borderRadius: 4, background: s.c, boxShadow: `0 0 12px ${s.g}` }} />
    </div>
  ));

  return (
    <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <Stars n={200} />
      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20, opacity: show ? 1 : 0, transform: show ? "scale(1)" : "scale(0.8)", transition: "all 1s ease-out" }}>
        <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {saberIcons}
          <div style={{ fontSize: 64, animation: "planetFloat 3s infinite", filter: "drop-shadow(0 0 20px #FFE066)" }}>✶</div>
        </div>
        <div style={{ fontSize: 11, color: "#FFE06688", letterSpacing: 4, marginBottom: 8 }}>YOU HAVE ACHIEVED THE RANK OF</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: "#FFE066", letterSpacing: 6, margin: "0 0 8px", animation: "grandMasterGlow 3s ease-in-out infinite" }}>GRAND MASTER</h1>
        <p style={{ fontSize: 16, color: "#AABB", maxWidth: 400, margin: "0 auto 8px", lineHeight: 1.6 }}>All planets have been liberated. The galaxy is at peace.</p>
        <p style={{ fontSize: 14, color: "#FFE066", fontFamily: "monospace", marginTop: 16 }}>Final Score: {profile.totalScore.toLocaleString()}</p>
        <p style={{ fontSize: 12, color: "#66CCFF", marginTop: 4 }}>Kyber Crystals: {profile.kyberCrystals}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
          {PLANETS.map((pl) => (
            <div key={pl.id} style={{ width: 28, height: 28, borderRadius: "50%", background: `radial-gradient(circle at 35% 35%,${pl.c}CC,${pl.c}44)`, boxShadow: `0 0 8px ${pl.gc}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 10, filter: "drop-shadow(0 0 3px #FFE066)" }}>✦</span>
            </div>
          ))}
        </div>
        <button onClick={onContinue} style={{ marginTop: 28, padding: "14px 36px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ RETURN TO GALAXY</button>
        <p style={{ fontSize: 11, color: "#556", marginTop: 12 }}>You can revisit any planet in Practice Mode!</p>
      </div>
    </div>
  );
};

// ─── MAIN APP ───────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("login");
  const [profile, setProfile] = useState(null);
  const [selPlanet, setSelPlanet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [defEnemies, setDefEnemies] = useState([]);
  const [encWord, setEncWord] = useState(null);
  const [showBoss, setShowBoss] = useState(false);
  const [exScore, setExScore] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [hyperspace, setHyperspace] = useState(false);
  const [pendingScreen, setPendingScreen] = useState(null);
  const [showSaberPicker, setShowSaberPicker] = useState(false);

  const save = useCallback(async (p) => { await saveProgress(p); }, []);

  const upd = useCallback(async (u) => {
    setProfile((p) => {
      if (!p) return null;
      const n = { ...p, ...u };
      save(n);
      return n;
    });
  }, [save]);

  // Hyperspace transition helper
  const goTo = useCallback((scr) => {
    setHyperspace(true);
    setPendingScreen(scr);
  }, []);

  const onHyperspaceDone = useCallback(() => {
    setHyperspace(false);
    if (pendingScreen) {
      setScreen(pendingScreen);
      setPendingScreen(null);
    }
  }, [pendingScreen]);

  const login = async (n) => {
    const c = n.trim();
    if (!c) return;
    setLoading(true);
    let p = await loadProgress(c);
    if (!p) p = { ...DEFP, username: c };
    else p = { ...DEFP, ...p, username: p.username || c };
    await save(p);
    setProfile(p);
    setLoading(false);
    goTo("galaxy");
  };

  const selPl = (id, isPractice = false) => {
    const clamped = Math.min(Math.max(id, 1), PLANETS.length);
    setSelPlanet(clamped);
    setPracticeMode(!!isPractice);
    goTo("briefing");
  };

  const startExplore = () => {
    setDefEnemies([]);
    setEncWord(null);
    setShowBoss(false);
    setExScore(practiceMode ? 0 : profile.totalScore);
    goTo("explore");
  };

  const battleWord = (w) => setEncWord(w);

  const battleResult = (won) => {
    if (won) {
      setDefEnemies((p) => [...p, encWord]);
      if (!practiceMode) {
        setExScore((s) => s + 100);
        upd({
          totalScore: (profile?.totalScore || 0) + 100,
          wordProgress: {
            ...(profile?.wordProgress || {}),
            [encWord]: ((profile?.wordProgress || {})[encWord] || 0) + 1,
          },
        });
      } else {
        upd({
          wordProgress: {
            ...(profile?.wordProgress || {}),
            [encWord]: ((profile?.wordProgress || {})[encWord] || 0) + 1,
          },
        });
      }
    }
    setEncWord(null);
  };

  const collect = (t, a) => {
    if (practiceMode) return;
    if (t === "kyber") upd({ kyberCrystals: (profile?.kyberCrystals || 0) + a });
    else if (t === "score") {
      setExScore((s) => s + a);
      upd({ totalScore: (profile?.totalScore || 0) + a });
    }
  };

  const bossStart = () => setShowBoss(true);

  const bossWin = async () => {
    if (!profile) return;
    if (practiceMode) {
      setShowBoss(false);
      setScreen("victory");
      return;
    }
    const nl = Math.min(Math.max(profile.level, (selPlanet || profile.level) + 1), 10);
    const comp = [...(profile.planetsCompleted || [])];
    if (!comp.includes(selPlanet)) comp.push(selPlanet);
    await upd({
      level: nl,
      planetsCompleted: comp,
      kyberCrystals: (profile.kyberCrystals || 0) + 5,
      jediRank: getRank(nl).name,
      totalScore: (profile.totalScore || 0) + 500,
    });
    setShowBoss(false);
    // Check for Grand Master (all 10 planets)
    if (comp.length >= 10) {
      setScreen("grandmaster");
    } else {
      setScreen("victory");
    }
  };

  const bossLose = () => { setShowBoss(false); setScreen("galaxy"); };

  const handleSaberSelect = (idx, cost) => {
    const owned = profile.unlockedSabers || [0];
    if (owned.includes(idx)) {
      // Just equip
      upd({ lightsaberColor: idx });
    } else if (cost && profile.kyberCrystals >= cost) {
      // Unlock and equip
      sfx("saber");
      upd({
        lightsaberColor: idx,
        unlockedSabers: [...owned, idx],
        kyberCrystals: profile.kyberCrystals - cost,
      });
    }
  };

  return (
    <>
      <HyperspaceOverlay active={hyperspace} onDone={onHyperspaceDone} />

      {screen === "login" && <Login onLogin={login} loading={loading} />}

      {screen === "galaxy" && profile && (
        <>
          <Galaxy profile={profile} onSelect={selPl} onLogout={() => { setProfile(null); setScreen("login"); }} onSaberPick={() => setShowSaberPicker(true)} />
          {showSaberPicker && <SaberPicker profile={profile} onSelect={(i, c) => { handleSaberSelect(i, c); }} onClose={() => setShowSaberPicker(false)} />}
        </>
      )}

      {screen === "briefing" && profile && selPlanet && (() => {
        const p = PLANETS[selPlanet - 1], b = BOSSES[selPlanet - 1], w = LW[selPlanet - 1] || LW[0];
        return <Briefing planet={p} boss={b} words={w} profile={profile} isPractice={practiceMode} onStart={startExplore} onBack={() => setScreen("galaxy")} />;
      })()}

      {screen === "explore" && profile && selPlanet && (() => {
        const pl = PLANETS[selPlanet - 1], b = BOSSES[selPlanet - 1], w = LW[selPlanet - 1] || LW[0];
        return (
          <>
            <Explorer planet={pl} pi={selPlanet - 1} words={w} boss={b} profile={profile} score={exScore} defeated={defEnemies} onBattle={battleWord} onBoss={bossStart} onCollect={collect} onExit={() => setScreen("galaxy")} />
            {encWord && <Encounter word={encWord} planet={pl} profile={profile} onResult={battleResult} />}
            {showBoss && <BossBattle boss={b} words={w} planet={pl} profile={profile} onWin={bossWin} onLose={bossLose} />}
          </>
        );
      })()}

      {screen === "victory" && selPlanet && (() => {
        const pl = PLANETS[selPlanet - 1];
        return (
          <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Stars n={100} />
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: "planetFloat 2s infinite" }}>✦</div>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: "#FFE066", letterSpacing: 4, textShadow: "0 0 40px #FFE06644" }}>{practiceMode ? "PRACTICE COMPLETE" : "MISSION COMPLETE"}</h1>
              <p style={{ fontSize: 16, color: pl.c, marginTop: 8, textShadow: `0 0 15px ${pl.gc}` }}>{pl.name} has been liberated!</p>
              {!practiceMode && <p style={{ fontSize: 20, color: "#FFE066", fontFamily: "monospace", marginTop: 16 }}>Score: {profile?.totalScore?.toLocaleString()}</p>}
              {!practiceMode && <p style={{ fontSize: 13, color: "#66CCFF", marginTop: 6 }}>+5 Kyber Crystals earned!</p>}
              {practiceMode && <p style={{ fontSize: 13, color: "#44AA44", marginTop: 12 }}>Great practice session!</p>}
              <button onClick={() => setScreen("galaxy")} style={{ marginTop: 24, padding: "12px 32px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ CONTINUE</button>
            </div>
          </div>
        );
      })()}

      {screen === "grandmaster" && profile && (
        <GrandMasterCelebration profile={profile} onContinue={() => setScreen("galaxy")} />
      )}
    </>
  );
}
