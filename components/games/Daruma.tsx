"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { DarumaPhase, DarumaGameState } from "@/data/gameContent/daruma";
import { useGameAIHost } from "@/lib/ai/gameAIClient";
import {
  ONI_CHANTS,
  ONI_CAUGHT_LINES,
  ONI_SAFE_LINES,
  ONI_WIN_LINES,
  ONI_MOODS,
  GAME_INSTRUCTIONS,
} from "@/data/gameContent/daruma";

interface DarumaProps {
  playerCount?: number;
  onBack?: () => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSpeedForRound(round: number): "slow" | "medium" | "fast" {
  if (round <= 2) return "slow";
  if (round <= 4) return "medium";
  return "fast";
}

/** Move-phase duration in ms by speed tier. */
const MOVE_DURATIONS: Record<string, number> = {
  slow: 3800,
  medium: 2600,
  fast: 1600,
};

/** Freeze-phase duration in ms. */
const FREEZE_DURATION = 2200;

/** How much progress each Move tap gives. */
const PROGRESS_PER_TAP = 8;
const DARUMA_RULES_FALLBACK = GAME_INSTRUCTIONS.join(" ");

function createInitialState(): DarumaGameState {
  const speed = getSpeedForRound(1);
  const mood = ONI_MOODS.find((m) => m.speed === speed) ?? ONI_MOODS[0];
  return {
    phase: "intro",
    progress: 0,
    round: 1,
    totalRounds: 5,
    score: 0,
    caughtCount: 0,
    survivedCount: 0,
    currentChant: pick(ONI_CHANTS),
    chantSpeed: speed,
    oniMood: `${mood.emoji} ${mood.label}`,
  };
}

export default function Daruma({ onBack }: DarumaProps) {
  const [game, setGame] = useState<DarumaGameState>(createInitialState);
  const [timeLeft, setTimeLeft] = useState(0);
  const [feedbackLine, setFeedbackLine] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiCommentKeyRef = useRef("");
  const { rules, comment, rulesStatus, commentStatus, hostComment } = useGameAIHost({
    gameId: "daruma",
    cultureId: "japan",
    rulesPrompt:
      "Explain Daruma-san ga Koronda for a same-device demo. Mention moving during the chant, freezing, and getting caught.",
    initialRules: DARUMA_RULES_FALLBACK,
    initialComment: "The Oni is watching for the smallest movement."
  });

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  /* ── Phase transitions ────────────────────────────────── */

  const startGame = useCallback(() => {
    setGame(createInitialState());
    setFeedbackLine("");
  }, []);

  const startRound = useCallback(() => {
    const speed = getSpeedForRound(game.round);
    const mood = ONI_MOODS.find((m) => m.speed === speed) ?? ONI_MOODS[0];
    const moveDuration = MOVE_DURATIONS[speed];
    const chant = pick(ONI_CHANTS);

    setGame((prev) => ({
      ...prev,
      phase: "move",
      currentChant: chant,
      chantSpeed: speed,
      oniMood: `${mood.emoji} ${mood.label}`,
    }));
    setTimeLeft(moveDuration);
    setFeedbackLine("");

    // Countdown ticker
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 100));
    }, 100);

    // Auto-transition to freeze after moveDuration
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setGame((prev) => {
        if (prev.phase !== "move") return prev;
        return { ...prev, phase: "freeze", currentChant: "止まれ！ FREEZE!" };
      });
      setTimeLeft(FREEZE_DURATION);

      // Countdown for freeze
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => Math.max(0, t - 100));
      }, 100);

      // After freeze, if not caught => survived this cycle
      timerRef.current = setTimeout(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setGame((prev) => {
          if (prev.phase !== "freeze") return prev;
          // Check if player reached the finish
          if (prev.progress >= 100) {
            setFeedbackLine(pick(ONI_WIN_LINES));
            return {
              ...prev,
              phase: "survived",
              score: prev.score + 10 + prev.progress,
              survivedCount: prev.survivedCount + 1,
            };
          }
          setFeedbackLine(pick(ONI_SAFE_LINES));
          return { ...prev, phase: "survived" };
        });
      }, FREEZE_DURATION);
    }, moveDuration);
  }, [game.round]);

  const handleMove = useCallback(() => {
    setGame((prev) => {
      if (prev.phase === "move") {
        const newProgress = Math.min(100, prev.progress + PROGRESS_PER_TAP);
        return { ...prev, progress: newProgress };
      }
      if (prev.phase === "freeze") {
        // Caught!
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setFeedbackLine(pick(ONI_CAUGHT_LINES));
        return {
          ...prev,
          phase: "caught",
          caughtCount: prev.caughtCount + 1,
          progress: Math.max(0, prev.progress - 20), // penalty: lose progress
        };
      }
      return prev;
    });
  }, []);

  const nextRound = useCallback(() => {
    setGame((prev) => {
      if (prev.round >= prev.totalRounds) {
        return { ...prev, phase: "game-over" };
      }
      const nextRoundNum = prev.round + 1;
      const speed = getSpeedForRound(nextRoundNum);
      const mood = ONI_MOODS.find((m) => m.speed === speed) ?? ONI_MOODS[0];
      return {
        ...prev,
        phase: "ready",
        round: nextRoundNum,
        progress: prev.phase === "caught" ? prev.progress : 0, // carry penalty progress, or reset on success
        currentChant: pick(ONI_CHANTS),
        chantSpeed: speed,
        oniMood: `${mood.emoji} ${mood.label}`,
      };
    });
    setFeedbackLine("");
  }, []);

  const replay = useCallback(() => {
    setGame(createInitialState());
    setFeedbackLine("");
  }, []);

  /* ── Derived values ───────────────────────────────────── */

  const progressPercent = Math.round(game.progress);
  const isMoveSafe = game.phase === "move";
  const isFrozen = game.phase === "freeze";
  const totalScore = game.score + game.survivedCount * 5;

  useEffect(() => {
    let prompt = "";
    let key = "";
    const state = {
      phase: game.phase,
      round: game.round,
      progress: progressPercent,
      caughtCount: game.caughtCount,
      survivedCount: game.survivedCount,
      chantSpeed: game.chantSpeed
    };

    if (game.phase === "ready") {
      key = `ready:${game.round}`;
      prompt = `Daruma round ${game.round} is ready. Give one short Oni line before the chant.`;
    } else if (game.phase === "move") {
      key = `move:${game.round}`;
      prompt = `The player is moving during the Daruma chant at ${progressPercent}% progress. Encourage them briefly.`;
    } else if (game.phase === "freeze") {
      key = `freeze:${game.round}`;
      prompt = "The Daruma player must freeze right now. Give a tense short warning.";
    } else if (game.phase === "caught") {
      key = `caught:${game.round}:${game.caughtCount}:${progressPercent}`;
      prompt = `The player moved during freeze and got caught at ${progressPercent}% progress. React as the Oni.`;
    } else if (game.phase === "survived") {
      key = `survived:${game.round}:${game.survivedCount}:${progressPercent}`;
      prompt = `The player survived the freeze with ${progressPercent}% progress. React as the Oni.`;
    } else if (game.phase === "game-over") {
      key = `game-over:${totalScore}:${game.caughtCount}:${game.survivedCount}`;
      prompt = `Daruma ended with final score ${totalScore}. Close the game in one short line.`;
    }

    if (!prompt || key === aiCommentKeyRef.current) {
      return;
    }

    aiCommentKeyRef.current = key;
    void hostComment(prompt, state, feedbackLine || game.currentChant);
  }, [
    feedbackLine,
    game.caughtCount,
    game.chantSpeed,
    game.currentChant,
    game.phase,
    game.progress,
    game.round,
    game.survivedCount,
    hostComment,
    progressPercent,
    totalScore
  ]);

  return (
    <div className="daruma-container">
      <header className="daruma-header">
        <div className="daruma-title-row">
          {onBack && (
            <button className="daruma-back" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="daruma-title-area">
            <h1 className="daruma-title">だるまさんがころんだ</h1>
            <span className="daruma-origin">Japan · Reaction</span>
          </div>
        </div>
        <div className="daruma-round-pill">
          Round {game.round} of {game.totalRounds}
        </div>
      </header>

      <main className="daruma-main">
        {/* ── Intro ────────────────────────────────────── */}
        {game.phase === "intro" && (
          <section className="daruma-intro">
            <div className="daruma-ai-card">
              <div className="daruma-ai-orb" aria-hidden="true">
                ONI
              </div>
              <div>
                <div className="daruma-ai-kicker">AI Oni</div>
                <div className="daruma-ai-row">
                  <strong>{rulesStatus}</strong>
                  <span>Caller</span>
                </div>
                <p>{rules.text}</p>
              </div>
            </div>
            <h2>Daruma-san ga Koronda</h2>
            <p className="daruma-subtitle">
              Move during the chant. Freeze when the Oni turns around.
            </p>
            <div className="daruma-rules-box">
              <h3>How to Play</h3>
              <ol className="daruma-rules-list">
                {GAME_INSTRUCTIONS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
            <button
              className="daruma-primary-btn"
              type="button"
              onClick={() =>
                setGame((prev) => ({ ...prev, phase: "ready" }))
              }
            >
              Start Game
            </button>
          </section>
        )}

        {/* ── Ready ───────────────────────────────────── */}
        {game.phase === "ready" && (
          <section className="daruma-ready">
            <div className="daruma-ai-card daruma-ai-card-compact">
              <div className="daruma-ai-orb" aria-hidden="true">
                ONI
              </div>
              <div>
                <div className="daruma-ai-kicker">AI Oni</div>
                <div className="daruma-ai-row">
                  <strong>{commentStatus}</strong>
                  <span>Round {game.round}</span>
                </div>
                <p>{comment.text}</p>
              </div>
            </div>
            <h2>Get Ready!</h2>
            <p className="daruma-chant-preview">&ldquo;{game.currentChant}&rdquo;</p>
            <p className="daruma-instruction">
              Tap <strong>Move</strong> during the chant. Stop on{" "}
              <strong>FREEZE</strong>.
            </p>
            <button
              className="daruma-primary-btn"
              type="button"
              onClick={startRound}
            >
              Begin Round {game.round}
            </button>
          </section>
        )}

        {/* ── Move / Freeze active play ───────────────── */}
        {(game.phase === "move" || game.phase === "freeze") && (
          <section className="daruma-play">
            <div className="daruma-ai-card daruma-ai-card-compact daruma-ai-live">
              <div className="daruma-ai-orb" aria-hidden="true">
                ONI
              </div>
              <div>
                <div className="daruma-ai-kicker">AI Oni</div>
                <div className="daruma-ai-row">
                  <strong>{commentStatus}</strong>
                  <span>{isMoveSafe ? "Chanting" : "Watching"}</span>
                </div>
                <p>{comment.text}</p>
              </div>
            </div>
            <div
              className={`daruma-phase-banner ${
                isMoveSafe ? "daruma-safe" : "daruma-danger"
              }`}
            >
              {isMoveSafe ? "🟢 MOVE!" : "🔴 FREEZE!"}
            </div>

            <div className="daruma-chant-live">
              &ldquo;{game.currentChant}&rdquo;
            </div>

            <div className="daruma-oni-mood-row">
              <span className="daruma-oni-label">Oni Mood:</span>
              <span>{game.oniMood}</span>
            </div>

            {/* Progress bar */}
            <div className="daruma-progress-wrapper">
              <div className="daruma-progress-labels">
                <span>Start</span>
                <span>🏁 Oni</span>
              </div>
              <div className="daruma-progress-track">
                <div
                  className="daruma-progress-fill"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="daruma-progress-player"
                  style={{ left: `${Math.min(progressPercent, 97)}%` }}
                >
                  🏃
                </div>
              </div>
              <div className="daruma-progress-pct">{progressPercent}%</div>
            </div>

            {/* Timer */}
            <div className="daruma-timer">
              {(timeLeft / 1000).toFixed(1)}s
            </div>

            {/* Move button */}
            <button
              className={`daruma-move-btn ${
                isFrozen ? "daruma-move-frozen" : ""
              }`}
              type="button"
              onClick={handleMove}
            >
              {isMoveSafe ? "👣 Move Forward" : "⚠️ DON'T MOVE!"}
            </button>
          </section>
        )}

        {/* ── Caught ──────────────────────────────────── */}
        {game.phase === "caught" && (
          <section className="daruma-result-screen">
            <div className="daruma-result-icon">🚫</div>
            <h2>Caught!</h2>
            <div className="daruma-verdict-card">
              <span>AI Oni verdict · {commentStatus}</span>
              <p className="daruma-feedback">{feedbackLine}</p>
              <p className="daruma-live-comment">{comment.text}</p>
            </div>
            <div className="daruma-stats-box">
              <div className="daruma-stat-row">
                <span>Progress</span>
                <span className="daruma-stat-val">{progressPercent}%</span>
              </div>
              <div className="daruma-stat-row">
                <span>Times Caught</span>
                <span className="daruma-stat-val">{game.caughtCount}</span>
              </div>
              <div className="daruma-stat-row">
                <span>Times Survived</span>
                <span className="daruma-stat-val">{game.survivedCount}</span>
              </div>
            </div>
            <button
              className="daruma-primary-btn"
              type="button"
              onClick={nextRound}
            >
              {game.round >= game.totalRounds ? "See Results" : "Next Round"}
            </button>
          </section>
        )}

        {/* ── Survived ────────────────────────────────── */}
        {game.phase === "survived" && (
          <section className="daruma-result-screen">
            <div className="daruma-result-icon">
              {game.progress >= 100 ? "🏆" : "✅"}
            </div>
            <h2>{game.progress >= 100 ? "You Win!" : "Survived!"}</h2>
            <div className="daruma-verdict-card">
              <span>AI Oni verdict · {commentStatus}</span>
              <p className="daruma-feedback">{feedbackLine}</p>
              <p className="daruma-live-comment">{comment.text}</p>
            </div>
            <div className="daruma-stats-box">
              <div className="daruma-stat-row">
                <span>Progress</span>
                <span className="daruma-stat-val">{progressPercent}%</span>
              </div>
              <div className="daruma-stat-row">
                <span>Times Caught</span>
                <span className="daruma-stat-val">{game.caughtCount}</span>
              </div>
              <div className="daruma-stat-row">
                <span>Times Survived</span>
                <span className="daruma-stat-val">{game.survivedCount}</span>
              </div>
            </div>
            <button
              className="daruma-primary-btn"
              type="button"
              onClick={nextRound}
            >
              {game.round >= game.totalRounds ? "See Results" : "Next Round"}
            </button>
          </section>
        )}

        {/* ── Game Over ───────────────────────────────── */}
        {game.phase === "game-over" && (
          <section className="daruma-gameover">
            <div className="daruma-result-icon">🎎</div>
            <h2>
              {game.survivedCount > game.caughtCount
                ? "Well Played!"
                : game.survivedCount === game.caughtCount
                  ? "Close Game!"
                  : "The Oni Wins!"}
            </h2>
            <div className="daruma-stats-box daruma-final-stats">
              <div className="daruma-stat-row">
                <span>Final Score</span>
                <span className="daruma-stat-val daruma-stat-big">
                  {totalScore}
                </span>
              </div>
              <div className="daruma-stat-row">
                <span>Rounds Survived</span>
                <span className="daruma-stat-val">
                  {game.survivedCount} / {game.totalRounds}
                </span>
              </div>
              <div className="daruma-stat-row">
                <span>Times Caught</span>
                <span className="daruma-stat-val">{game.caughtCount}</span>
              </div>
            </div>
            <div className="daruma-gameover-btns">
              <button
                className="daruma-primary-btn"
                type="button"
                onClick={replay}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="daruma-secondary-btn"
                  type="button"
                  onClick={onBack}
                >
                  Back to Discovery
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        /* ── Container ────────────────────────────────── */
        .daruma-container {
          min-height: auto;
          padding: 18px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 8px;
          background:
            linear-gradient(rgba(255, 244, 214, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 244, 214, 0.034) 1px, transparent 1px),
            radial-gradient(ellipse at 50% 0%, color-mix(in oklch, var(--bg-2) 86%, black), transparent 66%),
            color-mix(in oklch, var(--bg) 86%, black);
          background-size: 36px 36px, 36px 36px, auto, auto;
          box-shadow: var(--deep-shadow);
          color: var(--fg);
        }

        /* ── Header ───────────────────────────────────── */
        .daruma-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .daruma-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .daruma-back {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 78%, transparent);
          color: var(--fg);
          font-weight: 800;
          cursor: pointer;
        }

        .daruma-back:hover {
          filter: brightness(1.08);
        }

        .daruma-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .daruma-title {
          margin: 0;
          font-size: 1.6rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
          color: var(--fg);
        }

        .daruma-origin {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .daruma-round-pill {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border: 1px solid var(--accent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--accent) 14%, var(--surface));
          color: color-mix(in oklch, var(--accent) 78%, white);
          font-weight: 850;
          font-size: 0.9rem;
        }

        /* ── Main stage ───────────────────────────────── */
        .daruma-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 390px;
        }

        /* ── Intro ────────────────────────────────────── */
        .daruma-intro,
        .daruma-ready,
        .daruma-play,
        .daruma-result-screen,
        .daruma-gameover {
          width: 100%;
          max-width: 520px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.34), transparent 38%),
            var(--panel);
          box-shadow: var(--card-shadow);
          color: var(--ink);
          padding: 20px;
        }

        .daruma-ai-card {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 88%, black);
          color: var(--fg);
          margin-bottom: 18px;
          padding: 14px;
          text-align: left;
        }

        .daruma-ai-card-compact {
          margin-bottom: 16px;
        }

        .daruma-ai-live {
          width: 100%;
        }

        .daruma-ai-orb {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border: 1px solid color-mix(in oklch, var(--stamp) 56%, white);
          border-radius: 999px;
          background:
            radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.92), transparent 22%),
            linear-gradient(145deg, var(--stamp), var(--violet));
          box-shadow: 0 14px 32px color-mix(in oklch, var(--stamp) 28%, transparent);
          color: white;
          font-size: 0.78rem;
          font-weight: 950;
        }

        .daruma-ai-kicker {
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .daruma-ai-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .daruma-ai-row strong {
          color: var(--fg);
          font-size: 1rem;
        }

        .daruma-ai-row span {
          border: 1px solid color-mix(in oklch, var(--stamp) 44%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--stamp) 12%, var(--surface));
          color: color-mix(in oklch, var(--stamp) 70%, white);
          font-size: 0.72rem;
          font-weight: 850;
          padding: 5px 8px;
          text-transform: uppercase;
        }

        .daruma-ai-card p {
          color: color-mix(in oklch, var(--fg) 86%, var(--muted));
          line-height: 1.45;
          margin-top: 6px;
        }

        .daruma-intro h2 {
          font-size: 2.2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .daruma-subtitle {
          color: var(--muted-dark);
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .daruma-rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .daruma-rules-box h3 {
          margin: 0 0 12px;
          font-size: 1.1rem;
        }

        .daruma-rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.7;
        }

        .daruma-rules-list li {
          margin-bottom: 4px;
        }

        /* ── Ready ────────────────────────────────────── */
        .daruma-ready {
          max-width: 500px;
        }

        .daruma-ready h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .daruma-chant-preview {
          font-style: italic;
          font-size: 1.15rem;
          color: var(--muted-dark);
          margin-bottom: 16px;
        }

        .daruma-instruction {
          color: var(--muted-dark);
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 28px;
        }

        /* ── Active play ──────────────────────────────── */
        .daruma-play {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          max-width: 540px;
        }

        .daruma-phase-banner {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 1.8rem;
          font-weight: 950;
          letter-spacing: 0;
          min-height: 68px;
          width: 100%;
          transition: background 0.15s;
        }

        .daruma-safe {
          background: color-mix(in oklch, oklch(62% 0.18 145) 22%, var(--paper));
          border: 2px solid color-mix(in oklch, oklch(62% 0.18 145) 48%, transparent);
          color: oklch(30% 0.12 145);
        }

        .daruma-danger {
          background: color-mix(in oklch, var(--stamp) 22%, var(--paper));
          border: 2px solid color-mix(in oklch, var(--stamp) 48%, transparent);
          color: oklch(30% 0.14 28);
          animation: daruma-pulse 0.4s ease-in-out infinite alternate;
        }

        @keyframes daruma-pulse {
          from { opacity: 1; }
          to { opacity: 0.78; }
        }

        .daruma-chant-live {
          font-style: italic;
          font-size: 1.15rem;
          color: var(--muted-dark);
          min-height: 1.6em;
          line-height: 1.45;
        }

        .daruma-oni-mood-row {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          font-size: 0.9rem;
          color: var(--muted-dark);
        }

        .daruma-oni-label {
          font-weight: 800;
        }

        /* ── Progress bar ─────────────────────────────── */
        .daruma-progress-wrapper {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 14px;
        }

        .daruma-progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--muted-dark);
          margin-bottom: 6px;
          font-weight: 600;
        }

        .daruma-progress-track {
          position: relative;
          width: 100%;
          height: 30px;
          border-radius: 999px;
          background: var(--paper-2);
          border: 1px solid var(--paper-line);
          overflow: visible;
        }

        .daruma-progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, var(--accent), oklch(65% 0.16 49));
          transition: width 0.15s ease-out;
        }

        .daruma-progress-player {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.4rem;
          transition: left 0.15s ease-out;
          z-index: 2;
          filter: drop-shadow(0 1px 3px rgba(0,0,0,0.18));
        }

        .daruma-progress-pct {
          font-size: 0.85rem;
          font-weight: 900;
          margin-top: 6px;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
          font-variant-numeric: tabular-nums;
        }

        /* ── Timer ────────────────────────────────────── */
        .daruma-timer {
          display: inline-flex;
          min-height: 44px;
          align-items: center;
          justify-content: center;
          min-width: 90px;
          border: 1px solid color-mix(in oklch, var(--accent) 36%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--accent) 12%, var(--paper));
          font-size: 1.4rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 76%, var(--stamp));
        }

        /* ── Move button ──────────────────────────────── */
        .daruma-move-btn {
          min-height: 64px;
          width: 100%;
          max-width: 280px;
          padding: 18px 32px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, oklch(62% 0.18 145), oklch(55% 0.15 155));
          color: #0a2010;
          font-size: 1.3rem;
          font-weight: 950;
          cursor: pointer;
          transition: filter 0.15s, transform 0.1s;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .daruma-move-btn:active {
          transform: scale(0.96);
        }

        .daruma-move-btn:hover {
          filter: saturate(1.12) brightness(1.02);
        }

        .daruma-move-frozen {
          background: linear-gradient(135deg, oklch(52% 0.16 25), oklch(45% 0.18 18));
          color: #ffeedd;
          animation: daruma-shake 0.12s ease-in-out infinite alternate;
        }

        @keyframes daruma-shake {
          from { transform: translateX(-1px); }
          to { transform: translateX(1px); }
        }

        /* ── Result screens (caught / survived) ──────── */
        .daruma-result-screen,
        .daruma-gameover {
          max-width: 420px;
        }

        .daruma-result-icon {
          font-size: 4rem;
          margin-bottom: 12px;
        }

        .daruma-result-screen h2,
        .daruma-gameover h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .daruma-feedback {
          font-style: italic;
          font-size: 1.1rem;
          color: var(--muted-dark);
          min-height: 1.4em;
          line-height: 1.45;
        }

        .daruma-verdict-card {
          border: 1px solid color-mix(in oklch, var(--stamp) 28%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--stamp) 7%, var(--paper));
          margin-bottom: 18px;
          padding: 14px;
          text-align: left;
        }

        .daruma-verdict-card span {
          display: block;
          color: var(--muted-dark);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        /* ── Stats box ────────────────────────────────── */
        .daruma-stats-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .daruma-final-stats {
          border-color: color-mix(in oklch, var(--accent) 40%, transparent);
        }

        .daruma-stat-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--paper-line);
          font-size: 1rem;
        }

        .daruma-stat-row:last-child {
          border-bottom: none;
        }

        .daruma-stat-val {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        .daruma-stat-big {
          font-size: 1.5rem;
        }

        /* ── Buttons ──────────────────────────────────── */
        .daruma-primary-btn {
          min-height: 48px;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), oklch(65% 0.16 49));
          color: #180f08;
          font-size: 1.1rem;
          font-weight: 900;
          cursor: pointer;
          transition: filter 0.2s;
          width: auto;
        }

        .daruma-primary-btn:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        .daruma-secondary-btn {
          min-height: 44px;
          padding: 14px 28px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
        }

        .daruma-secondary-btn:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        .daruma-gameover-btns {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Mobile responsive ────────────────────────── */
        @media (max-width: 680px) {
          .daruma-container {
            padding: 14px;
          }

          .daruma-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .daruma-title {
            font-size: 1.3rem;
          }

          .daruma-main {
            min-height: 360px;
          }

          .daruma-intro,
          .daruma-ready,
          .daruma-play,
          .daruma-result-screen,
          .daruma-gameover {
            padding: 16px;
          }

          .daruma-ai-card {
            grid-template-columns: 48px 1fr;
            padding: 12px;
          }

          .daruma-ai-orb {
            width: 48px;
            height: 48px;
          }

          .daruma-phase-banner {
            font-size: 1.4rem;
            padding: 12px 20px;
            min-height: 58px;
          }

          .daruma-move-btn {
            max-width: 100%;
            min-height: 72px;
            font-size: 1.4rem;
          }

          .daruma-primary-btn,
          .daruma-secondary-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
