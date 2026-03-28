// ─── CORE GAME CONSTANTS ─────────────────────────────────────────────────────

export const JEDI_RANKS = [
  { name: "Youngling", min: 1, icon: "✦" },
  { name: "Padawan", min: 3, icon: "✧" },
  { name: "Jedi Knight", min: 5, icon: "⚔" },
  { name: "Jedi Master", min: 8, icon: "★" },
  { name: "Grand Master", min: 10, icon: "✶" },
];

export const SABERS = [
  { name: "Blue", c: "#4A9EEA", g: "#4A9EEA60" },
  { name: "Green", c: "#44CC44", g: "#44CC4460" },
  { name: "Purple", c: "#9944CC", g: "#9944CC60" },
  { name: "Yellow", c: "#CCCC22", g: "#CCCC2260" },
  { name: "White", c: "#EEEEFF", g: "#EEEEFF60" },
];
export const SABER_COSTS = [0, 5, 10, 15, 20];

export const PLANETS = [
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

export const BOSSES = [
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

export const LORE = [
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

export const DEFP = {
  username: "",
  level: 1,
  totalScore: 0,
  jediRank: "Youngling",
  lightsaberColor: 0,
  kyberCrystals: 0,
  unlockedSabers: [0],
  wordProgress: {},
  wordFails: {},
  planetsCompleted: [],
  unlockedAchievements: [],
  dailyStreak: 0,
  lastDailyDate: "",
};
