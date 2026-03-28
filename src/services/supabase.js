import { createClient } from '@supabase/supabase-js';

// ─── CLIENT SETUP ────────────────────────────────────────────────────────────

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Missing env vars — falling back to localStorage');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isCloudAvailable = () => supabase !== null;

// ─── USER MANAGEMENT ─────────────────────────────────────────────────────────

const getOrCreateUser = async (username) => {
  if (!supabase) return null;
  const clean = username.toLowerCase().trim();

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', clean)
      .single();

    if (existing) return existing.id;

    const { data: created, error } = await supabase
      .from('users')
      .insert({ username: clean })
      .select('id')
      .single();

    if (error) throw error;
    return created?.id || null;
  } catch (err) {
    console.error('[Supabase] getOrCreateUser:', err);
    return null;
  }
};

// ─── LOAD PROGRESS ───────────────────────────────────────────────────────────

export const loadProgress = async (username) => {
  if (!supabase) {
    // localStorage fallback
    try {
      const raw = localStorage.getItem(`jedi_${username.toLowerCase().trim()}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  const clean = username.toLowerCase().trim();

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        username,
        game_progress (
          level,
          total_score,
          jedi_rank,
          lightsaber_color,
          kyber_crystals,
          planets_completed,
          word_progress
        )
      `)
      .eq('username', clean)
      .single();

    if (error || !data) return null;

    const gp = Array.isArray(data.game_progress)
      ? data.game_progress[0]
      : data.game_progress;

    if (!gp) return null;

    return {
      username: data.username,
      level: gp.level,
      totalScore: gp.total_score,
      jediRank: gp.jedi_rank,
      lightsaberColor: gp.lightsaber_color,
      kyberCrystals: gp.kyber_crystals,
      planetsCompleted: gp.planets_completed || [],
      wordProgress: gp.word_progress || {},
    };
  } catch (err) {
    console.error('[Supabase] loadProgress:', err);
    // fallback to localStorage
    try {
      const raw = localStorage.getItem(`jedi_${clean}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
};

// ─── SAVE PROGRESS ───────────────────────────────────────────────────────────

export const saveProgress = async (profile) => {
  // Always save to localStorage as backup
  try {
    localStorage.setItem(
      `jedi_${profile.username.toLowerCase().trim()}`,
      JSON.stringify(profile)
    );
  } catch {}

  if (!supabase) return false;

  try {
    const userId = await getOrCreateUser(profile.username);
    if (!userId) throw new Error('Failed to get/create user');

    const { error } = await supabase
      .from('game_progress')
      .upsert({
        user_id: userId,
        level: profile.level,
        total_score: profile.totalScore,
        jedi_rank: profile.jediRank,
        lightsaber_color: profile.lightsaberColor,
        kyber_crystals: profile.kyberCrystals,
        planets_completed: profile.planetsCompleted || [],
        word_progress: profile.wordProgress || {},
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] saveProgress:', err);
    return false;
  }
};

// ─── SPELLING ANALYTICS ──────────────────────────────────────────────────────

export const logSpellingAttempt = async (username, word, correct, opts = {}) => {
  if (!supabase) return false;

  try {
    const userId = await getOrCreateUser(username);
    if (!userId) return false;

    const { error } = await supabase
      .from('spelling_sessions')
      .insert({
        user_id: userId,
        word: word.toLowerCase(),
        correct,
        attempts: opts.attempts || 1,
        time_taken_ms: opts.timeTakenMs || null,
        level: opts.level || null,
        is_boss_battle: opts.isBossBattle || false,
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Supabase] logSpellingAttempt:', err);
    return false;
  }
};
