"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  TheHatPhase,
  TheHatTeam,
  TheHatGameState,
  TheHatEvent,
} from "@/data/gameContent/theHat";
import {
  WORD_DECK_FALLBACK,
  GAME_INSTRUCTIONS,
  HOST_INTRO_LINES,
  CORRECT_LINES,
  SKIP_LINES,
  EXPLAINER_LINES,
  AI_GUESS_LINES,
} from "@/data/gameContent/theHat";

interface TheHatProps {
  playerCount?: number;
  onBack?: () => void;
  onEvent?: (event: TheHatEvent) => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createDeck(): string[] {
  const deck = [...WORD_DECK_FALLBACK];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function createInitialState(playerCount: number): TheHatGameState {
  const teamCount = playerCount >= 4 ? 2 : 2;
  const teams: TheHatTeam[] = Array.from({ length: teamCount }, (_, i) => ({
    id: `team${i}`,
    name: i === 0 ? "Team A" : "Team B",
    score: 0,
  }));

  const deck = createDeck();

  return {
    phase: "intro",
    teams,
    turn: {
      turnNumber: 1,
      totalTurns: 6,
      currentWord: null,
      wordIndex: 0,
      correctCount: 0,
      skipCount: 0,
      explainerTeamId: teams[0].id,
      guesserTeamId: teams[1 % teamCount].id,
    },
    deck,
  };
}

const TURN_TIME = 60;

export default function TheHat({ playerCount = 4, onBack, onEvent }: TheHatProps) {
  const [game, setGame] = useState<TheHatGameState>(() =>
    createInitialState(playerCount)
  );
  const [timeLeft, setTimeLeft] = useState(TURN_TIME);
  const [hostLine, setHostLine] = useState(pick(HOST_INTRO_LINES));
  const [aiGuess, setAiGuess] = useState<string | null>(null);
  const [events, setEvents] = useState<TheHatEvent[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const emit = useCallback(
    (event: TheHatEvent) => {
      setEvents((prev) => [...prev, event]);
      onEvent?.(event);
    },
    [onEvent]
  );

  const getNextTeams = (
    teams: TheHatTeam[],
    currentExplainer: string,
    currentGuesser: string
  ) => {
    const teamIds = teams.map((t) => t.id);
    const explainerIdx = teamIds.indexOf(currentExplainer);
    const nextExplainerIdx = (explainerIdx + 1) % teamIds.length;
    const nextGuesserIdx = (nextExplainerIdx + 1) % teamIds.length;
    return {
      explainerId: teamIds[nextExplainerIdx],
      guesserId: teamIds[nextGuesserIdx],
    };
  };

  const startGame = useCallback(() => {
    setGame((prev) => {
      const deck = createDeck();
      const next = getNextTeams(prev.teams, prev.turn.explainerTeamId, prev.turn.guesserTeamId);
      return {
        ...prev,
        phase: "turn-explain",
        deck,
        turn: {
          ...prev.turn,
          turnNumber: 1,
          currentWord: deck[0] ?? null,
          wordIndex: 0,
          correctCount: 0,
          skipCount: 0,
          explainerTeamId: next.explainerId,
          guesserTeamId: next.guesserId,
        },
      };
    });
    setTimeLeft(TURN_TIME);
    startTimeRef.current = Date.now();
    setAiGuess(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return next;
      });
    }, 1000);

    setHostLine(pick(EXPLAINER_LINES));
    const firstTeam = game.turn.explainerTeamId;
    emit({ kind: "turn-start", turn: 1, explainerTeam: firstTeam, guesserTeam: game.turn.guesserTeamId });
  }, [game.turn.explainerTeamId, game.turn.guesserTeamId, emit]);

  const handleCorrect = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const word = game.turn.currentWord ?? "";
    const teamId = game.turn.explainerTeamId;

    setGame((prev) => {
      const updatedTeams = prev.teams.map((t) =>
        t.id === teamId ? { ...t, score: t.score + 1 } : t
      );
      const nextWordIdx = prev.turn.wordIndex + 1;
      const isLastTurn = prev.turn.turnNumber >= prev.turn.totalTurns;

      if (isLastTurn) {
        const maxScore = Math.max(...updatedTeams.map((t) => t.score));
        const winners = updatedTeams.filter((t) => t.score === maxScore);
        emit({
          kind: "game-over",
          winner: winners.length > 1 ? "Tie" : winners[0].name,
          scores: Object.fromEntries(updatedTeams.map((t) => [t.id, t.score])),
        });
        return { ...prev, phase: "game-over", teams: updatedTeams };
      }

      const { explainerId, guesserId } = getNextTeams(
        updatedTeams,
        prev.turn.explainerTeamId,
        prev.turn.guesserTeamId
      );
      return {
        ...prev,
        phase: "scoring",
        teams: updatedTeams,
        turn: {
          ...prev.turn,
          correctCount: prev.turn.correctCount + 1,
        },
      };
    });

    setHostLine(pick(CORRECT_LINES));
    setAiGuess(null);
    emit({ kind: "correct", word, teamId });
  }, [game.turn.currentWord, game.turn.explainerTeamId, emit]);

  const handleSkip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const word = game.turn.currentWord ?? "";
    const teamId = game.turn.explainerTeamId;

    setGame((prev) => {
      const nextWordIdx = prev.turn.wordIndex + 1;
      const isLastTurn = prev.turn.turnNumber >= prev.turn.totalTurns;

      if (isLastTurn) {
        emit({
          kind: "game-over",
          winner: "",
          scores: Object.fromEntries(prev.teams.map((t) => [t.id, t.score])),
        });
        return { ...prev, phase: "game-over" };
      }

      const { explainerId, guesserId } = getNextTeams(
        prev.teams,
        prev.turn.explainerTeamId,
        prev.turn.guesserTeamId
      );
      return {
        ...prev,
        phase: "scoring",
        turn: {
          ...prev.turn,
          skipCount: prev.turn.skipCount + 1,
        },
      };
    });

    setHostLine(pick(SKIP_LINES));
    setAiGuess(null);
    emit({ kind: "skip", word, teamId });
  }, [game.turn.currentWord, game.turn.explainerTeamId, emit]);

  const nextTurn = useCallback(() => {
    setGame((prev) => {
      const nextWordIdx = prev.turn.wordIndex + 1;
      const nextWord = prev.deck[nextWordIdx] ?? prev.deck[0] ?? null;
      const { explainerId, guesserId } = getNextTeams(
        prev.teams,
        prev.turn.explainerTeamId,
        prev.turn.guesserTeamId
      );

      return {
        ...prev,
        phase: "turn-explain",
        deck: prev.deck,
        turn: {
          ...prev.turn,
          turnNumber: prev.turn.turnNumber + 1,
          currentWord: nextWord,
          wordIndex: nextWordIdx,
          correctCount: 0,
          skipCount: 0,
          explainerTeamId: explainerId,
          guesserTeamId: guesserId,
        },
      };
    });
    setTimeLeft(TURN_TIME);
    setHostLine(pick(EXPLAINER_LINES));
    setAiGuess(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return next;
      });
    }, 1000);

    emit({
      kind: "turn-start",
      turn: game.turn.turnNumber + 1,
      explainerTeam: game.turn.explainerTeamId,
      guesserTeam: game.turn.guesserTeamId,
    });
  }, [game.turn, emit]);

  const showAiGuess = useCallback(() => {
    setAiGuess(pick(AI_GUESS_LINES));
  }, []);

  const replay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGame(createInitialState(playerCount));
    setEvents([]);
    setAiGuess(null);
    setTimeLeft(TURN_TIME);
    setHostLine(pick(HOST_INTRO_LINES));
  }, [playerCount]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const explainerTeam = game.teams.find(
    (t) => t.id === game.turn.explainerTeamId
  );
  const guesserTeam = game.teams.find(
    (t) => t.id === game.turn.guesserTeamId
  );

  const sortedTeams = [...game.teams].sort((a, b) => b.score - a.score);
  const topScore = sortedTeams[0]?.score ?? 0;
  const winners = sortedTeams.filter((t) => t.score === topScore);

  const isTimeUp = timeLeft <= 0;

  return (
    <div className="the-hat-container">
      <header className="the-hat-header">
        <div className="the-hat-title-row">
          {onBack && (
            <button className="the-hat-back" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="the-hat-title-area">
            <h1 className="the-hat-title">The Hat</h1>
            <span className="the-hat-origin">Global Party Table · Describe & Guess</span>
          </div>
        </div>
        {game.phase !== "intro" && (
          <div className="the-hat-turn-pill">
            Turn {game.turn.turnNumber} / {game.turn.totalTurns}
          </div>
        )}
      </header>

      <main className="the-hat-main">
        {/* ── Intro ─────────────────────────────────────────── */}
        {game.phase === "intro" && (
          <section className="the-hat-intro">
            <div className="the-hat-ai-card">
              <div className="the-hat-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="the-hat-ai-kicker">AI Host</div>
                <div className="the-hat-ai-row">
                  <strong>Simulation Mode</strong>
                  <span>Word Generator</span>
                </div>
                <p>{hostLine}</p>
              </div>
            </div>
            <h2>Describe It, Guess It!</h2>
            <p className="the-hat-subtitle">
              One player describes a secret word — no saying the word itself!
              The guessing team calls out guesses. Be fast and creative!
            </p>
            <div className="the-hat-rules-box">
              <h3>How to Play</h3>
              <ol className="the-hat-rules-list">
                {GAME_INSTRUCTIONS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
            <button
              className="the-hat-primary-btn"
              type="button"
              onClick={startGame}
            >
              Start Game
            </button>
          </section>
        )}

        {/* ── Turn: Explain phase ──────────────────────────── */}
        {game.phase === "turn-explain" && (
          <section className="the-hat-turn">
            {/* Timer */}
            <div className={`the-hat-timer ${isTimeUp ? "the-hat-timer-out" : ""}`}>
              <span className="the-hat-timer-label">Time</span>
              <span className="the-hat-timer-value">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Team roles */}
            <div className="the-hat-team-roles">
              <div className="the-hat-explainer-box">
                <span className="the-hat-role-label">Explainer</span>
                <strong className="the-hat-team-name">
                  {explainerTeam?.name ?? "Team A"}
                </strong>
                <p className="the-hat-role-hint">Describe the word — never say it!</p>
              </div>
              <div className="the-hat-vs">vs</div>
              <div className="the-hat-guesser-box">
                <span className="the-hat-role-label">Guesser</span>
                <strong className="the-hat-team-name">
                  {guesserTeam?.name ?? "Team B"}
                </strong>
                <p className="the-hat-role-hint">Listen and call out guesses!</p>
              </div>
            </div>

            {/* Secret word */}
            <div className="the-hat-word-block" aria-label={`Secret word: ${game.turn.currentWord}`}>
              <div className="the-hat-word-label">Your Word</div>
              <div className="the-hat-word">{game.turn.currentWord}</div>
              <p className="the-hat-word-hint">
                Describe this word without saying it!
              </p>
            </div>

            {/* Host line */}
            <div className="the-hat-host-line">
              <span className="the-hat-host-label">Host:</span>
              <p>{hostLine}</p>
            </div>

            {/* Action buttons */}
            <div className="the-hat-actions">
              <button
                className="the-hat-correct-btn"
                type="button"
                onClick={handleCorrect}
              >
                Correct! +1
              </button>
              <button
                className="the-hat-skip-btn"
                type="button"
                onClick={handleSkip}
              >
                Skip
              </button>
            </div>

            {/* AI player mode */}
            <div className="the-hat-ai-guess-section">
              <p className="the-hat-ai-hint">
                The guessing team is stuck? Let the AI guess:
              </p>
              <button
                className="the-hat-ai-guess-btn"
                type="button"
                onClick={showAiGuess}
              >
                AI Guesses
              </button>
              {aiGuess && (
                <div className="the-hat-ai-guess-result">
                  <span className="the-hat-ai-guess-label">AI Guess:</span>
                  <strong>{aiGuess}</strong>
                  <span
                    className={`the-hat-ai-guess-accuracy ${
                      aiGuess.toLowerCase().includes(
                        (game.turn.currentWord ?? "").toLowerCase()
                      )
                        ? "the-hat-ai-correct"
                        : "the-hat-ai-wrong"
                    }`}
                  >
                    {aiGuess.toLowerCase().includes(
                      (game.turn.currentWord ?? "").toLowerCase()
                    )
                      ? "✓ Correct!"
                      : "✗ Wrong guess"}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Scoring ──────────────────────────────────────── */}
        {game.phase === "scoring" && (
          <section className="the-hat-scoring">
            <div className="the-hat-scoring-icon">📋</div>
            <h2>Turn Results</h2>

            <div className="the-hat-turn-summary">
              <div className="the-hat-turn-stat">
                <span>Correct</span>
                <strong className="the-hat-stat-correct">
                  {game.turn.correctCount}
                </strong>
              </div>
              <div className="the-hat-turn-stat">
                <span>Skipped</span>
                <strong className="the-hat-stat-skip">
                  {game.turn.skipCount}
                </strong>
              </div>
            </div>

            <div className="the-hat-scoreboard">
              <h3>Scoreboard</h3>
              {sortedTeams.map((t) => (
                <div key={t.id} className="the-hat-score-row">
                  <span className="the-hat-score-name">{t.name}</span>
                  <span className="the-hat-score-val">{t.score}</span>
                </div>
              ))}
            </div>

            <button
              className="the-hat-primary-btn"
              type="button"
              onClick={nextTurn}
            >
              Next Turn
            </button>
          </section>
        )}

        {/* ── Game Over ────────────────────────────────────── */}
        {game.phase === "game-over" && (
          <section className="the-hat-gameover">
            <div className="the-hat-trophy">🏆</div>
            <h2>
              {winners.length > 1
                ? "It's a Tie!"
                : `${winners[0].name} Wins!`}
            </h2>
            <p className="the-hat-final-tagline">
              {winners.length > 1
                ? "Both teams tied for the top spot!"
                : `With ${topScore} points — well played!`}
            </p>

            <div className="the-hat-final-scores">
              {sortedTeams.map((t, i) => (
                <div key={t.id} className="the-hat-final-row">
                  <span className="the-hat-final-rank">#{i + 1}</span>
                  <span className="the-hat-final-name">
                    {t.name}
                    {t.id === winners[0]?.id ? " 👑" : ""}
                  </span>
                  <span className="the-hat-final-score">{t.score}</span>
                </div>
              ))}
            </div>

            <div className="the-hat-gameover-btns">
              <button
                className="the-hat-primary-btn"
                type="button"
                onClick={replay}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="the-hat-secondary-btn"
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
        /* ── Container ────────────────────────────────────── */
        .the-hat-container {
          min-height: auto;
          padding: 8px 0 0;
          display: flex;
          flex-direction: column;
          color: var(--ink);
        }

        /* ── Header ───────────────────────────────────────── */
        .the-hat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .the-hat-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .the-hat-back {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-weight: 800;
          cursor: pointer;
        }

        .the-hat-back:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        .the-hat-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .the-hat-title {
          margin: 0;
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
        }

        .the-hat-origin {
          color: var(--muted-dark);
          font-size: 0.85rem;
        }

        .the-hat-turn-pill {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border: 1px solid var(--accent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--accent) 14%, var(--paper));
          color: color-mix(in oklch, var(--ink) 74%, var(--stamp));
          font-weight: 850;
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
        }

        /* ── Main ─────────────────────────────────────────── */
        .the-hat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 380px;
        }

        /* ── Intro ────────────────────────────────────────── */
        .the-hat-intro {
          max-width: 480px;
          width: 100%;
        }

        .the-hat-ai-card {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          color: var(--ink);
          margin-bottom: 20px;
          padding: 14px;
          text-align: left;
        }

        .the-hat-ai-orb {
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

        .the-hat-ai-kicker {
          color: var(--muted-dark);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .the-hat-ai-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .the-hat-ai-row strong {
          font-size: 0.95rem;
        }

        .the-hat-ai-row span {
          border: 1px solid color-mix(in oklch, var(--stamp) 44%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--stamp) 12%, var(--surface));
          color: color-mix(in oklch, var(--stamp) 70%, white);
          font-size: 0.72rem;
          font-weight: 850;
          padding: 4px 10px;
          text-transform: uppercase;
        }

        .the-hat-ai-card p {
          color: var(--muted-dark);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-top: 6px;
        }

        .the-hat-intro h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .the-hat-subtitle {
          color: var(--muted-dark);
          font-size: 1.05rem;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .the-hat-rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 18px 20px;
          margin-bottom: 20px;
          text-align: left;
        }

        .the-hat-rules-box h3 {
          margin: 0 0 10px;
          font-size: 1.05rem;
        }

        .the-hat-rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.65;
        }

        .the-hat-rules-list li {
          margin-bottom: 3px;
        }

        /* ── Turn ─────────────────────────────────────────── */
        .the-hat-turn {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: stretch;
        }

        /* Timer */
        .the-hat-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          transition: background 0.3s, border-color 0.3s;
        }

        .the-hat-timer-out {
          border-color: color-mix(in oklch, var(--stamp) 50%, transparent);
          background: color-mix(in oklch, var(--stamp) 10%, var(--paper));
        }

        .the-hat-timer-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .the-hat-timer-value {
          font-size: 1.8rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 78%, var(--accent));
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          letter-spacing: -0.02em;
        }

        .the-hat-timer-out .the-hat-timer-value {
          color: var(--stamp);
        }

        /* Team roles */
        .the-hat-team-roles {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 10px;
          align-items: center;
        }

        .the-hat-explainer-box,
        .the-hat-guesser-box {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid var(--paper-line);
          background: var(--panel-strong);
        }

        .the-hat-explainer-box {
          border-color: color-mix(in oklch, var(--accent) 40%, transparent);
          background: color-mix(in oklch, var(--accent) 8%, var(--paper));
        }

        .the-hat-guesser-box {
          border-color: color-mix(in oklch, var(--teal) 40%, transparent);
          background: color-mix(in oklch, var(--teal) 8%, var(--paper));
        }

        .the-hat-role-label {
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
          color: var(--muted-dark);
        }

        .the-hat-team-name {
          font-size: 1rem;
          font-weight: 900;
          color: var(--ink);
        }

        .the-hat-role-hint {
          font-size: 0.8rem;
          color: var(--muted-dark);
          margin: 0;
          line-height: 1.4;
        }

        .the-hat-vs {
          font-size: 0.85rem;
          font-weight: 900;
          color: var(--muted-dark);
        }

        /* Word block */
        .the-hat-word-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          border: 2px solid var(--stamp);
          border-radius: 8px;
          background: color-mix(in oklch, var(--stamp) 8%, var(--paper));
        }

        .the-hat-word-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 4px;
        }

        .the-hat-word {
          font-size: 2.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 900;
          color: var(--stamp);
          line-height: 1;
          letter-spacing: -0.02em;
          text-transform: capitalize;
        }

        .the-hat-word-hint {
          font-size: 0.85rem;
          color: var(--muted-dark);
          font-style: italic;
          margin: 8px 0 0;
        }

        /* Host line */
        .the-hat-host-line {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          border: 1px solid color-mix(in oklch, var(--teal) 30%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 7%, var(--paper));
          text-align: left;
        }

        .the-hat-host-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: color-mix(in oklch, var(--ink) 60%, var(--teal));
          text-transform: uppercase;
          letter-spacing: 0;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .the-hat-host-line p {
          margin: 0;
          font-size: 0.95rem;
          font-style: italic;
          color: var(--muted-dark);
          line-height: 1.5;
        }

        /* Action buttons */
        .the-hat-actions {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 10px;
        }

        .the-hat-correct-btn {
          min-height: 56px;
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, oklch(62% 0.18 145), oklch(55% 0.15 155));
          color: #0a2010;
          font-size: 1.1rem;
          font-weight: 950;
          cursor: pointer;
          transition: filter 0.15s, transform 0.1s;
        }

        .the-hat-correct-btn:hover {
          filter: saturate(1.08) brightness(1.02);
        }

        .the-hat-correct-btn:active {
          transform: scale(0.97);
        }

        .the-hat-skip-btn {
          min-height: 56px;
          padding: 16px 24px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .the-hat-skip-btn:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        /* AI guess section */
        .the-hat-ai-guess-section {
          border: 1px dashed color-mix(in oklch, var(--teal) 40%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 5%, var(--paper));
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .the-hat-ai-hint {
          font-size: 0.85rem;
          color: var(--muted-dark);
          margin: 0;
          font-style: italic;
        }

        .the-hat-ai-guess-btn {
          min-height: 44px;
          padding: 10px 20px;
          border: 1px solid color-mix(in oklch, var(--teal) 50%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 12%, var(--paper));
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
          font-size: 0.95rem;
          font-weight: 850;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .the-hat-ai-guess-btn:hover {
          filter: saturate(1.08);
        }

        .the-hat-ai-guess-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          border-radius: 8px;
          background: var(--paper-2);
          border: 1px solid var(--paper-line);
          width: 100%;
        }

        .the-hat-ai-guess-label {
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .the-hat-ai-guess-result strong {
          font-size: 1.1rem;
          color: var(--ink);
          font-style: italic;
        }

        .the-hat-ai-guess-accuracy {
          font-size: 0.85rem;
          font-weight: 850;
        }

        .the-hat-ai-correct {
          color: oklch(52% 0.16 145);
        }

        .the-hat-ai-wrong {
          color: var(--coral);
        }

        /* ── Scoring ──────────────────────────────────────── */
        .the-hat-scoring {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .the-hat-scoring-icon {
          font-size: 3rem;
        }

        .the-hat-scoring h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .the-hat-turn-summary {
          display: flex;
          gap: 20px;
        }

        .the-hat-turn-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 14px 20px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
        }

        .the-hat-turn-stat span {
          font-size: 0.85rem;
          color: var(--muted-dark);
          font-weight: 800;
        }

        .the-hat-stat-correct {
          font-size: 1.8rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: oklch(52% 0.16 145);
        }

        .the-hat-stat-skip {
          font-size: 1.8rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: var(--muted-dark);
        }

        .the-hat-scoreboard {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          text-align: left;
        }

        .the-hat-scoreboard h3 {
          margin: 0 0 12px;
          font-size: 1rem;
          font-weight: 900;
          color: var(--muted-dark);
        }

        .the-hat-score-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--paper-line);
          font-size: 1rem;
        }

        .the-hat-score-row:last-child {
          border-bottom: none;
        }

        .the-hat-score-name {
          font-weight: 600;
        }

        .the-hat-score-val {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        /* ── Game over ─────────────────────────────────────── */
        .the-hat-gameover {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .the-hat-trophy {
          font-size: 4rem;
          margin-bottom: 8px;
        }

        .the-hat-gameover h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .the-hat-final-tagline {
          color: var(--muted-dark);
          font-size: 1rem;
          margin: 0;
        }

        .the-hat-final-scores {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          text-align: left;
        }

        .the-hat-final-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 0;
          border-bottom: 1px solid var(--paper-line);
        }

        .the-hat-final-row:last-child {
          border-bottom: none;
        }

        .the-hat-final-rank {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
          width: 28px;
        }

        .the-hat-final-name {
          flex: 1;
          font-weight: 600;
        }

        .the-hat-final-score {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
          font-size: 1.1rem;
        }

        .the-hat-gameover-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* ── Buttons ──────────────────────────────────────── */
        .the-hat-primary-btn {
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
        }

        .the-hat-primary-btn:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        .the-hat-secondary-btn {
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

        .the-hat-secondary-btn:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        /* ── Mobile responsive ─────────────────────────────── */
        @media (max-width: 680px) {
          .the-hat-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .the-hat-title {
            font-size: 1.5rem;
          }

          .the-hat-main {
            min-height: 360px;
          }

          .the-hat-team-roles {
            grid-template-columns: 1fr 1fr;
          }

          .the-hat-vs {
            display: none;
          }

          .the-hat-word {
            font-size: 2.2rem;
          }

          .the-hat-timer-value {
            font-size: 1.5rem;
          }

          .the-hat-actions {
            grid-template-columns: 1fr;
          }

          .the-hat-correct-btn,
          .the-hat-skip-btn {
            min-height: 52px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}