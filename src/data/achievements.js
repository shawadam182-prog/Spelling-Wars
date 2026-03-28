// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  // Word milestones
  { id: "first_word", name: "Youngling's First Step", desc: "Spell your first word correctly", icon: "✦", tier: "bronze" },
  { id: "words_50", name: "Wordsmith", desc: "Spell 50 words correctly", icon: "📖", tier: "silver" },
  { id: "words_100", name: "Scholar", desc: "Spell 100 words correctly", icon: "📚", tier: "gold" },
  { id: "words_200", name: "Grand Lexicon", desc: "Spell 200 words correctly", icon: "🏛️", tier: "legendary" },

  // Combat
  { id: "first_boss", name: "Sith Slayer", desc: "Defeat your first boss", icon: "⚔️", tier: "bronze" },
  { id: "bosses_5", name: "Dark Side Destroyer", desc: "Defeat 5 different bosses", icon: "💀", tier: "gold" },
  { id: "combo_5", name: "Combo King", desc: "Reach a 5x combo streak", icon: "🔥", tier: "silver" },
  { id: "combo_10", name: "Unstoppable", desc: "Reach a 10x combo streak", icon: "⚡", tier: "gold" },

  // Force mastery
  { id: "force_full", name: "Force Master", desc: "Defeat a boss with full Force", icon: "🌟", tier: "gold" },
  { id: "no_damage", name: "Untouchable", desc: "Complete a planet without losing Force", icon: "🛡️", tier: "legendary" },

  // Score
  { id: "score_10k", name: "High Scorer", desc: "Reach 10,000 total score", icon: "🏅", tier: "silver" },
  { id: "score_50k", name: "Master Scorer", desc: "Reach 50,000 total score", icon: "🏆", tier: "gold" },
  { id: "score_100k", name: "Legendary Score", desc: "Reach 100,000 total score", icon: "👑", tier: "legendary" },

  // Collection
  { id: "crystals_25", name: "Crystal Collector", desc: "Collect 25 Kyber Crystals", icon: "💎", tier: "silver" },
  { id: "all_sabers", name: "Rainbow Blade", desc: "Unlock all 5 lightsabers", icon: "🌈", tier: "gold" },

  // Exploration
  { id: "planets_5", name: "Explorer", desc: "Complete 5 planets", icon: "🗺️", tier: "silver" },
  { id: "planets_10", name: "Galactic Hero", desc: "Complete all 10 planets", icon: "🌌", tier: "legendary" },
];

const TIER_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  legendary: "#FF44FF",
};

export const tierColor = (tier) => TIER_COLORS[tier] || TIER_COLORS.bronze;

// Check which achievements are newly earned
export const checkAchievements = (profile) => {
  const unlocked = profile.unlockedAchievements || [];
  const wp = profile.wordProgress || {};
  const totalWords = Object.values(wp).reduce((s, v) => s + v, 0);
  const completed = profile.planetsCompleted || [];
  const sabers = profile.unlockedSabers || [0];
  const newlyEarned = [];

  const check = (id, condition) => {
    if (!unlocked.includes(id) && condition) newlyEarned.push(id);
  };

  // Word milestones
  check("first_word", totalWords >= 1);
  check("words_50", totalWords >= 50);
  check("words_100", totalWords >= 100);
  check("words_200", totalWords >= 200);

  // Boss / planet milestones
  check("first_boss", completed.length >= 1);
  check("bosses_5", completed.length >= 5);
  check("planets_5", completed.length >= 5);
  check("planets_10", completed.length >= 10);

  // Score milestones
  check("score_10k", (profile.totalScore || 0) >= 10000);
  check("score_50k", (profile.totalScore || 0) >= 50000);
  check("score_100k", (profile.totalScore || 0) >= 100000);

  // Collection milestones
  check("crystals_25", (profile.kyberCrystals || 0) >= 25);
  check("all_sabers", sabers.length >= 5);

  return newlyEarned;
};

// Combo and Force achievements need to be checked in real-time (not from profile)
export const checkComboAchievement = (combo, unlocked = []) => {
  const earned = [];
  if (combo >= 5 && !unlocked.includes("combo_5")) earned.push("combo_5");
  if (combo >= 10 && !unlocked.includes("combo_10")) earned.push("combo_10");
  return earned;
};

export const getAchievement = (id) => ACHIEVEMENTS.find((a) => a.id === id);
