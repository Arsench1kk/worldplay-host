"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  AdedonhaPhase,
  AdedonhaPlayer,
  AdedonhaGameState,
} from "@/data/gameContent/adedonha";
import { useGameAIHost } from "@/lib/ai/gameAIClient";
import {
  CATEGORIES,
  GAME_INSTRUCTIONS,
  HOST_INTRO_LINES,
  STOP_LINES,
  pickRandomLetter,
  scoreAnswers,
} from "@/data/gameContent/adedonha";

interface AdedonhaProps {
  playerCount?: number;
  onBack?: () => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ADEDONHA_RULES_FALLBACK = GAME_INSTRUCTIONS.join(" ");

function createInitialState(playerCount: number): AdedonhaGameState {
  const players = Array.from({ length: Math.max(2, playerCount) }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i + 1}`,
    score: 0,
  }));
  return {
    phase: "intro",
    players,
    round: {
      roundNumber: 1,
      letter: "",
      answers: {},
      stoppedBy: null,
      stoppedAt: null,
    },
    totalRounds: 4,
    roundScores: {},
  };
}

export default function Adedonha({ playerCount = 4, onBack }: AdedonhaProps) {
  const [game, setGame] = useState<AdedonhaGameState>(() =>
    createInitialState(playerCount)
  );
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [hostLine, setHostLine] = useState(pick(HOST_INTRO_LINES));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const aiCommentKeyRef = useRef("");
  const { rules, comment, rulesStatus, commentStatus, hostComment } = useGameAIHost({
    gameId: "adedonha",
    cultureId: "brazil",
    rulesPrompt:
      "Explain Adedonha for a same-device demo. Mention the letter, categories, STOP, and unique answer scoring.",
    initialRules: ADEDONHA_RULES_FALLBACK,
    initialComment: hostLine,
  });

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = useCallback(() => {
    const letter = pickRandomLetter();
    setGame((prev) => ({
      ...prev,
      phase: "playing",
      round: {
        ...prev.round,
        letter,
        answers: {},
        stoppedBy: null,
        stoppedAt: null,
      },
    }));
    setCategoryInputs({});
    setElapsed(0);
    setHostLine(pick(HOST_INTRO_LINES));
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const handleCategoryChange = useCallback(
    (category: string, value: string) => {
      setCategoryInputs((prev) => ({ ...prev, [category]: value }));
    },
    []
  );

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsedMs = Date.now() - startTimeRef.current;
    setGame((prev) => ({
      ...prev,
      phase: "stopped",
      round: {
        ...prev.round,
        answers: { ...categoryInputs },
        stoppedBy: "player",
        stoppedAt: elapsedMs,
      },
    }));
    setHostLine(pick(STOP_LINES));
  }, [categoryInputs]);

  const showScores = useCallback(() => {
    const scores = scoreAnswers(
      { ...categoryInputs },
      game.players.map((p) => p.id)
    );

    setGame((prev) => {
      const updatedPlayers = prev.players.map((p) => ({
        ...p,
        score: p.score + (scores[p.id] ?? 0),
      }));
      return {
        ...prev,
        phase: "scoring",
        players: updatedPlayers,
        roundScores: scores,
      };
    });
    setHostLine(pick(["Let's score those answers!", "Points are being tallied..."]));
  }, [categoryInputs, game.players]);

  const nextRound = useCallback(() => {
    setGame((prev) => {
      if (prev.round.roundNumber >= prev.totalRounds) {
        return { ...prev, phase: "game-over" };
      }
      const letter = pickRandomLetter();
      return {
        ...prev,
        phase: "playing",
        round: {
          ...prev.round,
          roundNumber: prev.round.roundNumber + 1,
          letter,
          answers: {},
          stoppedBy: null,
          stoppedAt: null,
        },
      };
    });
    setCategoryInputs({});
    setElapsed(0);
    setHostLine(pick(HOST_INTRO_LINES));
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, []);

  const replay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGame(createInitialState(playerCount));
    setCategoryInputs({});
    setElapsed(0);
    setHostLine(pick(HOST_INTRO_LINES));
  }, [playerCount]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const totalRoundScore = game.roundScores
    ? Object.values(game.roundScores).reduce((a, b) => a + b, 0)
    : 0;

  const sortedPlayers = [...game.players].sort((a, b) => b.score - a.score);
  const topScore = sortedPlayers[0]?.score ?? 0;
  const winners = sortedPlayers.filter((p) => p.score === topScore);

  useEffect(() => {
    let key = "";
    let prompt = "";
    const answeredCount = Object.values(categoryInputs).filter(
      (value) => value.trim().length > 0
    ).length;
    const state = {
      phase: game.phase,
      round: game.round.roundNumber,
      letter: game.round.letter,
      answeredCount,
      elapsed,
      totalRoundScore,
    };

    if (game.phase === "playing") {
      key = `playing:${game.round.roundNumber}:${game.round.letter}`;
      prompt = `The Adedonha round started with letter ${game.round.letter}. Give a quick encouraging host line.`;
    } else if (game.phase === "stopped") {
      key = `stopped:${game.round.roundNumber}:${answeredCount}`;
      prompt = `The player hit STOP after ${elapsed} seconds with ${answeredCount} filled categories. React briefly.`;
    } else if (game.phase === "scoring") {
      key = `scoring:${game.round.roundNumber}:${totalRoundScore}`;
      prompt = `Adedonha scoring is revealed with ${totalRoundScore} total points this round. Comment briefly.`;
    } else if (game.phase === "game-over") {
      key = `game-over:${topScore}:${winners.map((winner) => winner.id).join("-")}`;
      prompt = `Adedonha ended. ${
        winners.length > 1 ? "It was a tie" : `${winners[0]?.name} won`
      } with ${topScore} points. Close the game warmly.`;
    }

    if (!key || key === aiCommentKeyRef.current) {
      return;
    }

    aiCommentKeyRef.current = key;
    void hostComment(prompt, state, hostLine);
  }, [
    categoryInputs,
    elapsed,
    game.phase,
    game.round.letter,
    game.round.roundNumber,
    hostComment,
    hostLine,
    topScore,
    totalRoundScore,
    winners,
  ]);

  return (
    <div className="adedonha-container">
      <header className="adedonha-header">
        <div className="adedonha-title-row">
          {onBack && (
            <button className="adedonha-back" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="adedonha-title-area">
            <h1 className="adedonha-title">Adedonha</h1>
            <span className="adedonha-origin">Brazil · Word Categories</span>
          </div>
        </div>
        {game.phase !== "intro" && (
          <div className="adedonha-round-pill">
            Round {game.round.roundNumber} / {game.totalRounds}
          </div>
        )}
      </header>

      <main className="adedonha-main">
        {/* ── Intro ──────────────────────────────────────── */}
        {game.phase === "intro" && (
          <section className="adedonha-intro">
            <div className="adedonha-ai-card">
              <div className="adedonha-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="adedonha-ai-kicker">AI Host</div>
                <div className="adedonha-ai-row">
                  <strong>{rulesStatus}</strong>
                  <span>Category Master</span>
                </div>
                <p>{rules.text}</p>
              </div>
            </div>
            <h2>A Letter. Categories. Race!</h2>
            <p className="adedonha-subtitle">
              Fill each category with the letter. Hit STOP when ready.
            </p>
            <div className="adedonha-rules-box">
              <h3>How to Play</h3>
              <ol className="adedonha-rules-list">
                {GAME_INSTRUCTIONS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
            <button
              className="adedonha-primary-btn"
              type="button"
              onClick={startGame}
            >
              Start Game
            </button>
          </section>
        )}

        {/* ── Playing ───────────────────────────────────── */}
        {(game.phase === "playing" || game.phase === "stopped") && (
          <section className="adedonha-play">
            {/* Timer */}
            <div className="adedonha-timer-display" aria-live="polite">
              <span className="adedonha-timer-label">Time</span>
              <span className="adedonha-timer-value">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Letter */}
            <div className="adedonha-letter-block" aria-label={`Letter: ${game.round.letter}`}>
              <div className="adedonha-letter-label">Your Letter</div>
              <div className="adedonha-letter">{game.round.letter}</div>
            </div>

            {/* Category inputs */}
            <div className="adedonha-categories">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="adedonha-category-row">
                  <label className="adedonha-category-name" htmlFor={`cat-${cat}`}>
                    {cat}
                  </label>
                  <input
                    id={`cat-${cat}`}
                    type="text"
                    className={`adedonha-category-input ${
                      game.phase === "stopped" ? "adedonha-input-locked" : ""
                    }`}
                    value={categoryInputs[cat] ?? ""}
                    onChange={(e) => handleCategoryChange(cat, e.target.value)}
                    disabled={game.phase === "stopped"}
                    placeholder={`${game.round.letter}...`}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    maxLength={40}
                  />
                </div>
              ))}
            </div>

            {/* Host speech */}
            <div className="adedonha-host-speech">
              <div className="adedonha-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="adedonha-host-label">AI Host · {commentStatus}</div>
                <p>{comment.text}</p>
              </div>
            </div>

            {/* Action button */}
            {game.phase === "playing" ? (
              <button
                className="adedonha-stop-btn"
                type="button"
                onClick={handleStop}
              >
                STOP!
              </button>
            ) : (
              <button
                className="adedonha-primary-btn"
                type="button"
                onClick={showScores}
              >
                Reveal Scores
              </button>
            )}
          </section>
        )}

        {/* ── Scoring ───────────────────────────────────── */}
        {game.phase === "scoring" && (
          <section className="adedonha-scoring">
            <div className="adedonha-scoring-letter">
              <span>Score reveal</span>
              <strong>{game.round.letter}</strong>
            </div>

            <div className="adedonha-answers-grid">
              {CATEGORIES.map((cat) => {
                const answer = categoryInputs[cat] ?? "";
                const isFilled = answer.trim().length > 0;
                const lower = answer.toLowerCase().trim();
                const isDuplicate =
                  isFilled &&
                  Object.entries(categoryInputs).filter(
                    ([, v]) => v.toLowerCase().trim() === lower
                  ).length > 1;
                return (
                  <div key={cat} className="adedonha-answer-row">
                    <span className="adedonha-answer-cat">{cat}</span>
                    <span
                      className={`adedonha-answer-val ${
                        !isFilled
                          ? "adedonha-answer-empty"
                          : isDuplicate
                            ? "adedonha-answer-duplicate"
                            : "adedonha-answer-valid"
                      }`}
                    >
                      {answer || "(empty)"}
                    </span>
                    <span className="adedonha-answer-score">
                      {isFilled
                        ? isDuplicate
                          ? "0 — duplicate"
                          : "+10"
                        : "0 — empty"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="adedonha-scoring-total">
              This round: +{totalRoundScore} points
            </div>

            <div className="adedonha-host-speech">
              <div className="adedonha-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="adedonha-host-label">AI Host · {commentStatus}</div>
                <p>{comment.text}</p>
              </div>
            </div>

            <div className="adedonha-scoreboard">
              <h3>Scoreboard</h3>
              {sortedPlayers.map((p) => (
                <div key={p.id} className="adedonha-score-row">
                  <span className="adedonha-score-name">{p.name}</span>
                  <span className="adedonha-score-val">{p.score}</span>
                </div>
              ))}
            </div>

            <div className="adedonha-scoring-btns">
              <button
                className="adedonha-primary-btn"
                type="button"
                onClick={nextRound}
              >
                {game.round.roundNumber >= game.totalRounds
                  ? "See Final Results"
                  : "Next Round"}
              </button>
            </div>
          </section>
        )}

        {/* ── Game Over ──────────────────────────────────── */}
        {game.phase === "game-over" && (
          <section className="adedonha-gameover">
            <div className="adedonha-trophy">🏆</div>
            <h2>
              {winners.length > 1
                ? "It's a Tie!"
                : `${winners[0].name} Wins!`}
            </h2>

            <div className="adedonha-final-scores">
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className="adedonha-final-row">
                  <span className="adedonha-final-rank">#{i + 1}</span>
                  <span className="adedonha-final-name">
                    {p.name}
                    {p.id === winners[0]?.id ? " 👑" : ""}
                  </span>
                  <span className="adedonha-final-score">{p.score}</span>
                </div>
              ))}
            </div>

            <div className="adedonha-host-speech">
              <div className="adedonha-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="adedonha-host-label">AI Host · {commentStatus}</div>
                <p>{comment.text}</p>
              </div>
            </div>

            <div className="adedonha-gameover-btns">
              <button
                className="adedonha-primary-btn"
                type="button"
                onClick={replay}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="adedonha-secondary-btn"
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
        .adedonha-container {
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
        .adedonha-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .adedonha-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .adedonha-back {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 78%, transparent);
          color: var(--fg);
          font-weight: 800;
          cursor: pointer;
        }

        .adedonha-back:hover {
          filter: brightness(1.08);
        }

        .adedonha-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .adedonha-title {
          margin: 0;
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
          color: var(--fg);
        }

        .adedonha-origin {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .adedonha-round-pill {
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
          font-variant-numeric: tabular-nums;
        }

        /* ── Main ─────────────────────────────────────── */
        .adedonha-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 400px;
        }

        /* ── Intro ────────────────────────────────────── */
        .adedonha-intro,
        .adedonha-play,
        .adedonha-scoring,
        .adedonha-gameover {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background:
            linear-gradient(145deg, rgba(255, 255, 255, 0.34), transparent 38%),
            var(--panel);
          box-shadow: var(--card-shadow);
          color: var(--ink);
          padding: 20px;
        }

        .adedonha-intro {
          max-width: 520px;
        }

        .adedonha-ai-card {
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

        .adedonha-ai-orb {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border: 1px solid color-mix(in oklch, var(--stamp) 56%, white);
          border-radius: 999px;
          background: radial-gradient(circle at 35% 24%, rgba(255,255,255,0.92), transparent 22%),
            linear-gradient(145deg, var(--stamp), var(--violet));
          box-shadow: 0 14px 32px color-mix(in oklch, var(--stamp) 28%, transparent);
          color: white;
          font-size: 0.78rem;
          font-weight: 950;
        }

        .adedonha-ai-kicker {
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .adedonha-ai-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .adedonha-ai-row strong {
          color: var(--fg);
          font-size: 0.95rem;
        }

        .adedonha-ai-row span {
          border: 1px solid color-mix(in oklch, var(--stamp) 44%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--stamp) 12%, var(--surface));
          color: color-mix(in oklch, var(--stamp) 70%, white);
          font-size: 0.72rem;
          font-weight: 850;
          padding: 4px 10px;
          text-transform: uppercase;
        }

        .adedonha-ai-card p {
          color: color-mix(in oklch, var(--fg) 86%, var(--muted));
          font-size: 0.95rem;
          line-height: 1.5;
          margin-top: 6px;
        }

        .adedonha-intro h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .adedonha-subtitle {
          color: var(--muted-dark);
          font-size: 1.05rem;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .adedonha-rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 18px 20px;
          margin-bottom: 20px;
          text-align: left;
        }

        .adedonha-rules-box h3 {
          margin: 0 0 10px;
          font-size: 1.05rem;
        }

        .adedonha-rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.65;
        }

        .adedonha-rules-list li {
          margin-bottom: 3px;
        }

        /* ── Play area ──────────────────────────────── */
        .adedonha-play {
          max-width: 620px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
        }

        /* Timer */
        .adedonha-timer-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 58px;
          padding: 10px 14px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
        }

        .adedonha-timer-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .adedonha-timer-value {
          font-size: 1.8rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 78%, var(--accent));
          font-family: "SF Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          letter-spacing: 0;
        }

        /* Letter block */
        .adedonha-letter-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border: 2px solid var(--stamp);
          border-radius: 8px;
          background: color-mix(in oklch, var(--stamp) 8%, var(--paper));
          box-shadow:
            inset 0 0 0 2px color-mix(in oklch, var(--stamp) 12%, transparent),
            0 16px 32px rgba(38, 28, 18, 0.12);
        }

        .adedonha-letter-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .adedonha-letter {
          font-size: 4.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 900;
          color: var(--stamp);
          line-height: 1;
          letter-spacing: -0.02em;
        }

        /* Category inputs */
        .adedonha-categories {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 12px;
        }

        .adedonha-category-row {
          display: grid;
          grid-template-columns: 104px 1fr;
          align-items: center;
          gap: 10px;
        }

        .adedonha-category-name {
          font-weight: 850;
          font-size: 0.95rem;
          text-align: right;
          color: var(--ink);
          white-space: nowrap;
        }

        .adedonha-category-input {
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1.05rem;
          font-weight: 600;
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }

        .adedonha-category-input:focus {
          border-color: var(--accent);
          background: color-mix(in oklch, var(--accent) 8%, var(--paper));
        }

        .adedonha-category-input::placeholder {
          color: var(--muted-dark);
          font-weight: 400;
          font-style: italic;
        }

        .adedonha-input-locked {
          background: color-mix(in oklch, var(--paper-line) 28%, var(--paper));
          color: var(--muted-dark);
          cursor: not-allowed;
        }

        /* Host speech */
        .adedonha-host-speech {
          display: grid;
          grid-template-columns: 54px 1fr;
          align-items: center;
          gap: 12px;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 88%, black);
          color: var(--fg);
          text-align: left;
        }

        .adedonha-host-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .adedonha-host-speech p {
          margin: 0;
          font-size: 0.95rem;
          font-style: italic;
          color: color-mix(in oklch, var(--fg) 86%, var(--muted));
          line-height: 1.5;
          margin-top: 4px;
        }

        /* Stop button */
        .adedonha-stop-btn {
          min-height: 64px;
          width: 100%;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--stamp), oklch(42% 0.2 28));
          box-shadow: 0 18px 38px color-mix(in oklch, var(--stamp) 34%, transparent);
          color: #fff8f0;
          font-size: 1.6rem;
          font-weight: 950;
          letter-spacing: 0;
          cursor: pointer;
          transition: filter 0.15s, transform 0.1s;
          text-transform: uppercase;
        }

        .adedonha-stop-btn:hover {
          filter: saturate(1.08) brightness(1.04);
        }

        .adedonha-stop-btn:active {
          transform: scale(0.97);
        }

        /* ── Scoring ─────────────────────────────────── */
        .adedonha-scoring {
          max-width: 620px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .adedonha-scoring-letter {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          color: var(--muted-dark);
          padding: 12px 14px;
          border: 1px solid color-mix(in oklch, var(--accent) 34%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--accent) 9%, var(--paper));
          text-align: left;
        }

        .adedonha-scoring-letter span {
          font-size: 0.75rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .adedonha-scoring-letter strong {
          color: var(--stamp);
          font-size: 2rem;
          font-weight: 900;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
        }

        .adedonha-answers-grid {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          overflow: hidden;
        }

        .adedonha-answer-row {
          display: grid;
          grid-template-columns: 104px 1fr 96px;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--paper-line);
        }

        .adedonha-answer-row:last-child {
          border-bottom: none;
        }

        .adedonha-answer-cat {
          font-size: 0.85rem;
          font-weight: 850;
          color: var(--muted-dark);
          text-align: right;
        }

        .adedonha-answer-val {
          font-size: 1rem;
          font-weight: 600;
          text-align: left;
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .adedonha-answer-empty {
          color: var(--muted-dark);
          font-style: italic;
        }

        .adedonha-answer-duplicate {
          color: var(--coral);
          text-decoration: line-through;
          opacity: 0.8;
        }

        .adedonha-answer-valid {
          color: color-mix(in oklch, var(--ink) 56%, var(--teal));
        }

        .adedonha-answer-score {
          font-size: 0.85rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          text-align: right;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        .adedonha-scoring-total {
          text-align: center;
          font-size: 1rem;
          font-weight: 800;
          color: color-mix(in oklch, var(--ink) 78%, var(--accent));
          padding: 12px;
          border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--accent) 8%, var(--paper));
          box-shadow: inset 0 0 0 2px color-mix(in oklch, var(--accent) 9%, transparent);
        }

        .adedonha-scoreboard {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          text-align: left;
        }

        .adedonha-scoreboard h3 {
          margin: 0 0 12px;
          font-size: 1rem;
          font-weight: 900;
          color: var(--muted-dark);
        }

        .adedonha-score-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--paper-line);
          font-size: 1rem;
        }

        .adedonha-score-row:last-child {
          border-bottom: none;
        }

        .adedonha-score-name {
          font-weight: 600;
        }

        .adedonha-score-val {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        .adedonha-scoring-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* ── Game over ────────────────────────────────── */
        .adedonha-gameover {
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .adedonha-trophy {
          font-size: 4rem;
          margin-bottom: 8px;
        }

        .adedonha-gameover h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .adedonha-final-scores {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          text-align: left;
        }

        .adedonha-final-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--paper-line);
        }

        .adedonha-final-row:last-child {
          border-bottom: none;
        }

        .adedonha-final-rank {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
          width: 28px;
        }

        .adedonha-final-name {
          flex: 1;
          font-weight: 600;
        }

        .adedonha-final-score {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
          font-size: 1.1rem;
        }

        .adedonha-gameover-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* ── Buttons ─────────────────────────────────── */
        .adedonha-primary-btn {
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

        .adedonha-primary-btn:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        .adedonha-secondary-btn {
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

        .adedonha-secondary-btn:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        /* ── Mobile responsive ────────────────────────── */
        @media (max-width: 680px) {
          .adedonha-container {
            padding: 14px;
          }

          .adedonha-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .adedonha-title {
            font-size: 1.5rem;
          }

          .adedonha-main {
            min-height: 360px;
          }

          .adedonha-intro,
          .adedonha-play,
          .adedonha-scoring,
          .adedonha-gameover {
            padding: 16px;
          }

          .adedonha-ai-card,
          .adedonha-host-speech {
            grid-template-columns: 48px 1fr;
            padding: 12px;
          }

          .adedonha-ai-orb {
            width: 48px;
            height: 48px;
          }

          .adedonha-category-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .adedonha-category-name {
            font-size: 0.88rem;
            text-align: left;
          }

          .adedonha-answer-row {
            grid-template-columns: 1fr auto;
            gap: 6px 10px;
          }

          .adedonha-answer-cat {
            text-align: left;
          }

          .adedonha-answer-val {
            grid-column: 1 / -1;
            order: 3;
          }

          .adedonha-letter {
            font-size: 3.5rem;
          }

          .adedonha-timer-value {
            font-size: 1.5rem;
          }

          .adedonha-stop-btn {
            font-size: 1.4rem;
            min-height: 66px;
          }

          .adedonha-primary-btn,
          .adedonha-secondary-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
