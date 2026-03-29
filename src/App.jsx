import { useState, useCallback } from "react";
import { saveProgress, loadProgress } from "./services/supabase";
import { PLANETS, BOSSES, DEFP } from "./data/constants";
import { LW } from "./data/words";
import { PLANET_NARRATIVE } from "./data/narratives";
import { checkAchievements, checkComboAchievement } from "./data/achievements";
import { sfx } from "./utils/audio";
import { getRank, calcScore, saberBonus, getTroubleWords } from "./utils/helpers";

import HyperspaceOverlay from "./components/HyperspaceOverlay";
import Login from "./components/Login";
import Galaxy from "./components/Galaxy";
import SaberPicker from "./components/SaberPicker";
import Briefing from "./components/Briefing";
import Explorer from "./components/Explorer";
import Encounter from "./components/Encounter";
import BossBattle from "./components/BossBattle";
import Stars from "./components/Stars";
import GrandMasterCelebration from "./components/GrandMasterCelebration";
import AchievementToast from "./components/AchievementToast";
import AchievementPanel from "./components/AchievementPanel";
import DailyChallenge from "./components/DailyChallenge";
import HomeworkScanner from "./components/HomeworkScanner";

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
  const [exForce, setExForce] = useState(5);
  const [combo, setCombo] = useState(0);
  const [troubleWordList, setTroubleWordList] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [noDamageTaken, setNoDamageTaken] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [encEntity, setEncEntity] = useState(null);

  const save = useCallback(async (p) => { await saveProgress(p); }, []);

  const upd = useCallback(async (u) => {
    setProfile((p) => {
      if (!p) return null;
      const n = { ...p, ...u };
      save(n);
      return n;
    });
  }, [save]);

  // Award achievements and queue toasts
  const awardAchievements = useCallback((ids, currentProfile) => {
    if (!ids.length) return;
    sfx("ok");
    setToastQueue((q) => [...q, ...ids]);
    const updated = [...(currentProfile.unlockedAchievements || []), ...ids];
    upd({ unlockedAchievements: updated });
  }, [upd]);

  // Run profile-based achievement checks
  const runAchievementCheck = useCallback((p) => {
    const earned = checkAchievements(p);
    if (earned.length) awardAchievements(earned, p);
  }, [awardAchievements]);

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
    setTroubleWordList(null); // clear any trouble word override
    goTo("briefing");
  };

  const startExplore = () => {
    setDefEnemies([]);
    setEncWord(null);
    setShowBoss(false);
    setExScore(practiceMode ? 0 : profile.totalScore);
    // Later levels get more starting Force; White saber adds +1
    const lvl = selPlanet || profile.level;
    const bonus = saberBonus(profile.lightsaberColor);
    const baseForce = lvl >= 7 ? 10 : lvl >= 4 ? 8 : 7;
    setExForce(baseForce + (bonus.extraMaxForce || 0));
    setCombo(0);
    setNoDamageTaken(true);
    goTo("explore");
  };

  const battleWord = (w, id, entity) => { setEncWord(w); setEncEntity(entity || null); };

  const useForce = (cost) => setExForce((f) => {
    const nf = Math.max(f - cost, 0);
    if (nf <= 0) setTimeout(() => setScreen("failed"), 800);
    return nf;
  });

  const battleResult = (won, hinted = false, audioMode = false, elapsed = null, zeroPoints = false) => {
    if (won) {
      setDefEnemies((p) => [...p, encWord]);
      const bonus = saberBonus(profile.lightsaberColor);
      const sc = calcScore(encWord, combo, !!bonus.earlyCombo, elapsed);
      let pts = zeroPoints ? 0 : (hinted ? Math.floor(sc.total / 2) : sc.total);
      if (audioMode && !zeroPoints) pts = Math.floor(pts * 1.5);
      const newCombo = zeroPoints ? 0 : combo + 1;
      setCombo(newCombo);
      if (zeroPoints) setNoDamageTaken(false);
      if (!practiceMode) {
        setExScore((s) => s + pts);
        upd({
          totalScore: (profile?.totalScore || 0) + pts,
          wordProgress: {
            ...(profile?.wordProgress || {}),
            [encWord]: ((profile?.wordProgress || {})[encWord] || 0) + (zeroPoints ? 0 : 1),
          },
          ...(zeroPoints ? { wordFails: { ...(profile?.wordFails || {}), [encWord]: ((profile?.wordFails || {})[encWord] || 0) + 1 } } : {}),
        });
      } else {
        upd({
          wordProgress: {
            ...(profile?.wordProgress || {}),
            [encWord]: ((profile?.wordProgress || {})[encWord] || 0) + (zeroPoints ? 0 : 1),
          },
        });
      }
      // Clean first-attempt correct (no hints, no zero-points): restore +1 Force
      const lvl = selPlanet || profile.level;
      const maxF = (lvl >= 7 ? 8 : lvl >= 4 ? 6 : 5) + (bonus.extraMaxForce || 0);
      if (!hinted && !zeroPoints) setExForce((f) => Math.min(f + 1, maxF));
      // Combo 5+ restores additional +1 Force
      if (newCombo >= 5) setExForce((f) => Math.min(f + 1, maxF));
      // Elite enemy kill: +1 Kyber crystal
      if (encEntity?.isElite && !practiceMode) {
        upd({ kyberCrystals: (profile?.kyberCrystals || 0) + 1 });
      }
      // Check combo achievements
      if (!zeroPoints) {
        const comboEarned = checkComboAchievement(newCombo, profile.unlockedAchievements || []);
        if (comboEarned.length) awardAchievements(comboEarned, profile);
        // Check profile-based achievements after a short delay (profile updates async)
        setTimeout(() => { if (profile) runAchievementCheck({ ...profile, totalScore: (profile.totalScore || 0) + pts, wordProgress: { ...(profile.wordProgress || {}), [encWord]: ((profile.wordProgress || {})[encWord] || 0) + 1 } }); }, 100);
      }
    } else {
      // This branch is now only hit if we add a forced fail path in the future
      setCombo(0);
      setNoDamageTaken(false);
      upd({
        wordFails: {
          ...(profile?.wordFails || {}),
          [encWord]: ((profile?.wordFails || {})[encWord] || 0) + 1,
        },
      });
    }
    setEncWord(null);
    setEncEntity(null);
  };

  const collect = (t, a) => {
    if (t === "ration") {
      // Ration packs always restore Force, even in practice
      // Green saber: rations restore +1 extra
      const bonus = saberBonus(profile.lightsaberColor);
      const restore = 1 + (bonus.extraRation || 0);
      setExForce((f) => Math.min(f + restore, 10));
      return;
    }
    if (practiceMode) return;
    if (t === "kyber") {
      const newCrystals = (profile?.kyberCrystals || 0) + a;
      upd({ kyberCrystals: newCrystals });
      if (newCrystals >= 25) runAchievementCheck({ ...profile, kyberCrystals: newCrystals });
    } else if (t === "score") {
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
    // Check achievements after boss win
    const maxF = (selPlanet >= 7 ? 8 : selPlanet >= 4 ? 6 : 5) + (saberBonus(profile.lightsaberColor).extraMaxForce || 0);
    const postProfile = { ...profile, level: nl, planetsCompleted: comp, kyberCrystals: (profile.kyberCrystals || 0) + 5, totalScore: (profile.totalScore || 0) + 500, unlockedAchievements: profile.unlockedAchievements || [] };
    const earned = checkAchievements(postProfile);
    // Force-based achievements
    if (exForce >= maxF && !(postProfile.unlockedAchievements || []).includes("force_full")) earned.push("force_full");
    if (noDamageTaken && !(postProfile.unlockedAchievements || []).includes("no_damage")) earned.push("no_damage");
    if (earned.length) {
      sfx("ok");
      setToastQueue((q) => [...q, ...earned]);
      upd({ unlockedAchievements: [...(postProfile.unlockedAchievements || []), ...earned] });
    }
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
      const newOwned = [...owned, idx];
      upd({
        lightsaberColor: idx,
        unlockedSabers: newOwned,
        kyberCrystals: profile.kyberCrystals - cost,
      });
      // Check for Rainbow Blade
      if (newOwned.length >= 5) {
        const rbEarned = checkAchievements({ ...profile, unlockedSabers: newOwned, unlockedAchievements: profile.unlockedAchievements || [] });
        if (rbEarned.length) awardAchievements(rbEarned, profile);
      }
    }
  };

  // Daily challenge
  const startDaily = () => goTo("daily");

  const onDailyComplete = (correct, date) => {
    if (!profile) return;
    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    const wasYesterday = profile.lastDailyDate === yStr;
    const wasToday = profile.lastDailyDate === date;
    const newStreak = wasToday ? profile.dailyStreak : (wasYesterday ? (profile.dailyStreak || 0) + 1 : 1);
    const crystals = correct >= 5 ? 5 : correct >= 3 ? 3 : 1;
    const streakBonus = newStreak >= 3 ? 2 : 0;
    upd({
      kyberCrystals: (profile.kyberCrystals || 0) + crystals + streakBonus,
      dailyStreak: newStreak,
      lastDailyDate: date,
    });
    setScreen("galaxy");
  };

  // Homework scanner: launch special mission with scanned words
  const onScannerWords = (words) => {
    setShowScanner(false);
    // Pick a random planet for visuals
    const completed = profile.planetsCompleted || [];
    const pool = completed.length > 0 ? completed : [profile.level];
    const pi = pool[Math.floor(Math.random() * pool.length)];
    setSelPlanet(pi);
    setPracticeMode(true);
    setTroubleWordList(words);
    goTo("briefing");
  };

  // Trouble words: launch practice session with trouble words
  const startTroubleWords = () => {
    const allWords = LW.flat();
    const trouble = getTroubleWords(profile, allWords);
    if (trouble.length === 0) return;
    // Pick a random planet from completed ones (or current)
    const pi = profile.level;
    setSelPlanet(pi);
    setPracticeMode(true);
    // Store trouble words to use instead of level words
    setTroubleWordList(trouble.slice(0, 10));
    goTo("briefing");
  };

  return (
    <>
      <HyperspaceOverlay active={hyperspace} onDone={onHyperspaceDone} />

      {screen === "login" && <Login onLogin={login} loading={loading} />}

      {screen === "galaxy" && profile && (
        <>
          <Galaxy profile={profile} onSelect={selPl} onLogout={() => { setProfile(null); setScreen("login"); }} onSaberPick={() => setShowSaberPicker(true)} onTroubleWords={getTroubleWords(profile, LW.flat()).length > 0 ? startTroubleWords : null} onAchievements={() => setShowAchievements(true)} onDaily={startDaily} onScanner={() => setShowScanner(true)} />
          {showSaberPicker && <SaberPicker profile={profile} onSelect={(i, c) => { handleSaberSelect(i, c); }} onClose={() => setShowSaberPicker(false)} />}
        </>
      )}

      {screen === "briefing" && profile && selPlanet && (() => {
        const p = PLANETS[selPlanet - 1], b = BOSSES[selPlanet - 1], w = troubleWordList || LW[selPlanet - 1] || LW[0];
        return <Briefing planet={p} pi={selPlanet - 1} boss={b} words={w} profile={profile} isPractice={practiceMode} onStart={startExplore} onBack={() => setScreen("galaxy")} />;
      })()}

      {screen === "explore" && profile && selPlanet && (() => {
        const pl = PLANETS[selPlanet - 1], b = BOSSES[selPlanet - 1], w = troubleWordList || LW[selPlanet - 1] || LW[0];
        return (
          <>
            <Explorer planet={pl} pi={selPlanet - 1} words={w} boss={b} profile={profile} score={exScore} force={exForce} maxForce={(selPlanet >= 7 ? 8 : selPlanet >= 4 ? 6 : 5) + (saberBonus(profile.lightsaberColor).extraMaxForce || 0)} combo={combo} defeated={defEnemies} onBattle={battleWord} onBoss={bossStart} onCollect={collect} onForceUse={useForce} onExit={() => setScreen("galaxy")} />
            {encWord && <Encounter word={encWord} planet={pl} pi={selPlanet - 1} profile={profile} combo={combo} force={exForce} enemyHp={encEntity?.isElite ? (encEntity.hp || 2) : 1} onResult={battleResult} onForceUse={useForce} />}
            {showBoss && <BossBattle boss={b} pi={selPlanet - 1} words={w} planet={pl} profile={profile} force={exForce} onWin={bossWin} onLose={bossLose} />}
          </>
        );
      })()}

      {screen === "daily" && profile && (
        <DailyChallenge profile={profile} onComplete={onDailyComplete} onExit={() => setScreen("galaxy")} />
      )}

      {screen === "victory" && selPlanet && (() => {
        const pl = PLANETS[selPlanet - 1];
        return (
          <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Stars n={100} />
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16, animation: "planetFloat 2s infinite" }}>✦</div>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: "#FFE066", letterSpacing: 4, textShadow: "0 0 40px #FFE06644" }}>{practiceMode ? "PRACTICE COMPLETE" : "MISSION COMPLETE"}</h1>
              <p style={{ fontSize: 13, color: "#AABB", marginTop: 10, maxWidth: 380, lineHeight: 1.6, fontStyle: "italic" }}>{PLANET_NARRATIVE[selPlanet - 1]?.victoryLine}</p>
              {!practiceMode && <p style={{ fontSize: 20, color: "#FFE066", fontFamily: "monospace", marginTop: 16 }}>Score: {profile?.totalScore?.toLocaleString()}</p>}
              {!practiceMode && <p style={{ fontSize: 13, color: "#66CCFF", marginTop: 6 }}>+5 Kyber Crystals earned!</p>}
              {practiceMode && <p style={{ fontSize: 13, color: "#44AA44", marginTop: 12 }}>Great practice session!</p>}
              <button onClick={() => setScreen("galaxy")} style={{ marginTop: 24, padding: "12px 32px", fontSize: 15, fontWeight: 700, letterSpacing: 3, background: "#FFE06615", border: "1px solid #FFE06644", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>▸ CONTINUE</button>
            </div>
          </div>
        );
      })()}

      {screen === "failed" && selPlanet && (() => {
        const pl = PLANETS[selPlanet - 1];
        return (
          <div style={{ minHeight: "100vh", background: "#05050F", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <Stars n={40} />
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: 20 }}>
              <div style={{ fontSize: 56, marginBottom: 16, animation: "bossPulse 1.5s infinite", filter: "drop-shadow(0 0 20px #EE444466)" }}>💀</div>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: "#EE4444", letterSpacing: 4, textShadow: "0 0 30px #EE444444" }}>MISSION FAILED</h1>
              <p style={{ fontSize: 14, color: "#AA6666", marginTop: 10 }}>Your Force was depleted on {pl.name}...</p>
              <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>Study the words and try again, young Jedi.</p>
              <button onClick={() => setScreen("galaxy")} style={{ marginTop: 24, padding: "12px 32px", fontSize: 14, fontWeight: 700, letterSpacing: 2, background: "#EE444422", border: "1px solid #EE444466", borderRadius: 8, color: "#FFE066", cursor: "pointer" }}>RETURN TO GALAXY MAP</button>
            </div>
          </div>
        );
      })()}

      {screen === "grandmaster" && profile && (
        <GrandMasterCelebration profile={profile} onContinue={() => setScreen("galaxy")} />
      )}

      {toastQueue.length > 0 && (
        <AchievementToast
          key={toastQueue[0]}
          achievementId={toastQueue[0]}
          onDone={() => setToastQueue((q) => q.slice(1))}
        />
      )}

      {showAchievements && profile && (
        <AchievementPanel profile={profile} onClose={() => setShowAchievements(false)} />
      )}

      {showScanner && (
        <HomeworkScanner onWords={onScannerWords} onClose={() => setShowScanner(false)} />
      )}
    </>
  );
}
