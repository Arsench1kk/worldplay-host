"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  SpyImpostorPhase,
  SpyPlayer,
  SpyGameState,
  SpyWordPack,
} from "@/data/gameContent/spyImpostor";
import {
  WORD_PACKS_FALLBACK,
  GAME_INSTRUCTIONS,
  HOST_INTRO_LINES,
  SPY_INTRO_LINES,
  AGENT_INTRO_LINES,
  VOTE_HINT_LINES,
  WIN_LINES,
  SPY_WIN_LINES,
  AI_QUESTION_SAMPLES,
  pickWordPack,
  pickWordFromPack,
  getRoleHint,
  tallyVotes,
  determineWinner,
} from "@/data/gameContent/spyImpostor";

interface SpyImpostorProps {
  playerCount?: number;
  onBack?: () => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const QUESTION_DURATION = 120; // seconds

function createInitialState(playerCount: number): SpyGameState {
  return {
    phase: "setup",
    players: [],
    spyIndex: -1,
    secretWord: "",
    wordPack: WORD_PACKS_FALLBACK[0],
    currentRevealIndex: 0,
    questionTimeLeft: QUESTION_DURATION,
    votes: {},
    votedPlayers: [],
    questionStartTime: 0,
  };
}

function setupGameState(
  playerNames: string[],
  wordPack: SpyWordPack
): SpyGameState {
  const word = pickWordFromPack(wordPack);
  const spyIdx = Math.floor(Math.random() * playerNames.length);

  const players: SpyPlayer[] = playerNames.map((name, i) => ({
    id: `p${i}`,
    name,
    role: i === spyIdx ? "spy" : "agent",
    word: i === spyIdx ? getRoleHint(word, wordPack) : word,
    vote: null,
  }));

  return {
    phase: "word-pack",
    players,
    spyIndex: spyIdx,
    secretWord: word,
    wordPack,
    currentRevealIndex: 0,
    questionTimeLeft: QUESTION_DURATION,
    votes: {},
    votedPlayers: [],
    questionStartTime: 0,
  };
}

const DEFAULT_NAMES = [
  "Alex", "Jordan", "Sam", "Morgan", "Taylor", "Casey",
  "Riley", "Quinn", "Avery", "Drew", "Blake", "Reese",
];

export default function SpyImpostor({ playerCount = 4, onBack }: SpyImpostorProps) {
  const [game, setGame] = useState<SpyGameState>(createInitialState(playerCount));
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [editNames, setEditNames] = useState<Record<number, string>>({});
  const [hostLine, setHostLine] = useState(pick(HOST_INTRO_LINES));
  const [revealedPlayerId, setRevealedPlayerId] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [winner, setWinner] = useState<"group" | "spy" | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const updatePlayerName = useCallback((idx: number, value: string) => {
    setEditNames((prev) => ({ ...prev, [idx]: value }));
  }, []);

  const addAiPlayer = useCallback(() => {
    const usedNames = playerNames.length > 0 ? playerNames : DEFAULT_NAMES.slice(0, playerCount);
    const baseName = pick(DEFAULT_NAMES);
    let name = `${baseName} (AI)`;
    let counter = 2;
    while (usedNames.includes(name)) {
      name = `${baseName} ${counter} (AI)`;
      counter++;
    }
    setPlayerNames((prev) => [...prev, name]);
  }, [playerNames, playerCount]);

  const removePlayer = useCallback((idx: number) => {
    setPlayerNames((prev) => prev.filter((_, i) => i !== idx));
    setEditNames((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const startSetup = useCallback(() => {
    const names = playerNames.length > 0
      ? playerNames
      : DEFAULT_NAMES.slice(0, playerCount);

    if (names.length < 3) {
      setHostLine("You need at least 3 players to play Spy!");
      return;
    }

    const pack = pickWordPack();
    const state = setupGameState(names, pack);
    setGame(state);
    setHostLine(pick(HOST_INTRO_LINES));
    setRevealedPlayerId(null);
    setAiQuestion(null);
    setWinner(null);
  }, [playerNames, playerCount]);

  const startQuestionRound = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      phase: "question",
      currentRevealIndex: 0,
      questionStartTime: Date.now(),
      questionTimeLeft: QUESTION_DURATION,
    }));
    setHostLine(pick(VOTE_HINT_LINES));
    setAiQuestion(null);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setGame((prev) => {
        if (prev.questionTimeLeft <= 1) {
          clearInterval(timerRef.current!);
          return { ...prev, questionTimeLeft: 0 };
        }
        return { ...prev, questionTimeLeft: prev.questionTimeLeft - 1 };
      });
    }, 1000);
  }, []);

  const startVote = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGame((prev) => ({
      ...prev,
      phase: "vote",
      votes: {},
      votedPlayers: [],
    }));
    setHostLine(pick(VOTE_HINT_LINES));
    setAiQuestion(null);
  }, []);

  const castVote = useCallback((voterId: string, targetId: string) => {
    setGame((prev) => {
      const newVotes = { ...prev.votes, [voterId]: targetId };
      const newVoted = [...prev.votedPlayers, voterId];
      return { ...prev, votes: newVotes, votedPlayers: newVoted };
    });
  }, []);

  const revealResult = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const result = determineWinner(
      game.votes,
      game.players[game.spyIndex]?.id ?? "",
      game.players.map((p) => p.id)
    );
    setWinner(result);
    setGame((prev) => ({ ...prev, phase: "result" }));
    setHostLine(result === "group" ? pick(WIN_LINES) : pick(SPY_WIN_LINES));
    setAiQuestion(null);
  }, [game.votes, game.spyIndex, game.players]);

  const replay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGame(createInitialState(playerCount));
    setPlayerNames([]);
    setEditNames({});
    setHostLine(pick(HOST_INTRO_LINES));
    setRevealedPlayerId(null);
    setAiQuestion(null);
    setWinner(null);
  }, [playerCount]);

  const getAiQuestion = useCallback(() => {
    setAiQuestion(pick(AI_QUESTION_SAMPLES));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const allVoted =
    game.phase === "vote" &&
    game.players.every((p) => game.votedPlayers.includes(p.id));

  const voteCounts = game.phase === "vote" || game.phase === "result"
    ? tallyVotes(game.votes, game.players.map((p) => p.id))
    : {};

  const sortedPlayers = [...game.players].sort((a, b) => (a.vote ? 1 : -1) - (b.vote ? 1 : -1));

  const spyPlayer = game.players[game.spyIndex];

  // Setup phase player count
  const playerCountForSetup = playerNames.length > 0 ? playerNames.length : playerCount;

  return (
    <div className="spy-container">
      <header className="spy-header">
        <div className="spy-title-row">
          {onBack && (
            <button className="spy-back" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="spy-title-area">
            <h1 className="spy-title">Spy / Impostor</h1>
            <span className="spy-origin">Global Party Table · Hidden Role</span>
          </div>
        </div>
        {game.phase !== "setup" && game.phase !== "word-pack" && (
          <div className="spy-phase-pill">{game.phase}</div>
        )}
      </header>

      <main className="spy-main">
        {/* ── Setup ────────────────────────────────────── */}
        {(game.phase === "setup") && (
          <section className="spy-setup">
            <div className="spy-ai-card">
              <div className="spy-ai-orb" aria-hidden="true">AI</div>
              <div>
                <div className="spy-ai-kicker">AI Host</div>
                <div className="spy-ai-row">
                  <strong>Simulation Mode</strong>
                  <span>Role Assigner</span>
                </div>
                <p>{hostLine}</p>
              </div>
            </div>

            <h2>Add Players</h2>
            <p className="spy-subtitle">
              Enter names or accept defaults. Need 3–12 players.
              The Spy role is secretly assigned by the AI.
            </p>

            <div className="spy-name-grid">
              {Array.from({ length: playerCountForSetup }, (_, i) => (
                <div key={i} className="spy-name-row">
                  <input
                    key={`input-${i}`}
                    type="text"
                    className="spy-name-input"
                    placeholder={DEFAULT_NAMES[i] ?? `Player ${i + 1}`}
                    value={editNames[i] ?? playerNames[i] ?? ""}
                    onChange={(e) => updatePlayerName(i, e.target.value)}
                    maxLength={20}
                  />
                  {playerNames.length > i && (
                    <button
                      className="spy-remove-btn"
                      type="button"
                      onClick={() => removePlayer(i)}
                      aria-label={`Remove ${playerNames[i]}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="spy-setup-actions">
              <button
                className="spy-ai-player-btn"
                type="button"
                onClick={addAiPlayer}
              >
                + Add AI Player
              </button>
              <button
                className="spy-start-btn"
                type="button"
                onClick={startSetup}
              >
                Assign Roles
              </button>
            </div>

            <div className="spy-rules-box">
              <h3>How to Play</h3>
              <ol className="spy-rules-list">
                {GAME_INSTRUCTIONS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* ── Word Pack (all roles assigned) ─────────────── */}
        {game.phase === "word-pack" && (
          <section className="spy-word-pack">
            <div className="spy-pack-icon">🎭</div>
            <h2>Roles Assigned!</h2>
            <p className="spy-pack-subtitle">
              {game.players.length} players. One is the Spy.
              Pass the device — each player secretly taps to reveal their role.
            </p>

            <div className="spy-role-list">
              {game.players.map((p, idx) => {
                const isRevealed = revealedPlayerId === p.id;
                return (
                  <div key={p.id} className="spy-role-item">
                    <span className="spy-role-name">{p.name}</span>
                    <button
                      className={`spy-reveal-btn ${isRevealed ? "spy-revealed" : ""}`}
                      type="button"
                      onClick={() =>
                        setRevealedPlayerId(isRevealed ? null : p.id)
                      }
                    >
                      {isRevealed ? "Tap to Hide" : "Tap to Reveal"}
                    </button>
                    {isRevealed && (
                      <div
                        className={`spy-role-card ${
                          p.role === "spy" ? "spy-role-spy" : "spy-role-agent"
                        }`}
                      >
                        <div className="spy-role-badge">
                          {p.role === "spy" ? "🔍 SPY" : "✅ AGENT"}
                        </div>
                        <div className="spy-role-word">
                          {p.role === "spy" ? p.word : `Word: ${p.word}`}
                        </div>
                        <p className="spy-role-hint">
                          {p.role === "spy"
                            ? pick(SPY_INTRO_LINES)
                            : pick(AGENT_INTRO_LINES)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="spy-pack-info">
              <span className="spy-pack-cat-label">Category:</span>
              <strong>{game.wordPack.category}</strong>
            </div>

            <button
              className="spy-primary-btn"
              type="button"
              onClick={startQuestionRound}
            >
              Start Question Round
            </button>
          </section>
        )}

        {/* ── Question Round ───────────────────────────── */}
        {game.phase === "question" && (
          <section className="spy-question">
            <div className={`spy-timer ${game.questionTimeLeft <= 15 ? "spy-timer-out" : ""}`}>
              <span className="spy-timer-label">Time Left</span>
              <span className="spy-timer-value">
                {formatTime(game.questionTimeLeft)}
              </span>
            </div>

            <div className="spy-question-info">
              <h2>Question Round</h2>
              <p>Ask questions to the table. Try to spot the spy — or help the spy blend in!</p>
            </div>

            <div className="spy-players-mini">
              {game.players.map((p) => (
                <div key={p.id} className="spy-player-chip">
                  {p.name}
                </div>
              ))}
            </div>

            <div className="spy-ai-question-section">
              <button
                className="spy-ai-q-btn"
                type="button"
                onClick={getAiQuestion}
              >
                AI Sample Question
              </button>
              {aiQuestion && (
                <div className="spy-ai-q-result">
                  <span className="spy-ai-q-label">AI Question:</span>
                  <p className="spy-ai-q-text">&ldquo;{aiQuestion}&rdquo;</p>
                </div>
              )}
            </div>

            <div className="spy-host-speech">
              <span className="spy-host-label">Host:</span>
              <p>{hostLine}</p>
            </div>

            <button
              className="spy-vote-btn"
              type="button"
              onClick={startVote}
            >
              Open Vote
            </button>
          </section>
        )}

        {/* ── Voting ────────────────────────────────────── */}
        {game.phase === "vote" && (
          <section className="spy-vote">
            <h2>Vote for the Spy</h2>
            <p className="spy-vote-subtitle">Tap a player to vote. Everyone votes once.</p>

            <div className="spy-vote-players">
              {game.players.map((p) => {
                const hasVoted = game.votedPlayers.length > 0;
                return (
                  <div key={p.id} className="spy-vote-player">
                    <div className="spy-vote-name">{p.name}</div>
                    {game.votes[p.id] ? (
                      <div className="spy-vote-cast">
                        ✓ Voted
                        <div className="spy-vote-target">
                          → {game.players.find((pl) => pl.id === game.votes[p.id])?.name}
                        </div>
                      </div>
                    ) : (
                      <div className="spy-vote-options">
                        {game.players
                          .filter((pl) => pl.id !== p.id)
                          .map((pl) => (
                            <button
                              key={pl.id}
                              className="spy-vote-target-btn"
                              type="button"
                              onClick={() => castVote(p.id, pl.id)}
                            >
                              Vote {pl.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {voteCounts[p.id] > 0 && (
                      <div className="spy-vote-count">{voteCounts[p.id]} vote{voteCounts[p.id] > 1 ? "s" : ""}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {allVoted ? (
              <button
                className="spy-reveal-btn-final"
                type="button"
                onClick={revealResult}
              >
                Reveal Result
              </button>
            ) : (
              <div className="spy-vote-progress">
                {game.votedPlayers.length} / {game.players.length} voted
              </div>
            )}
          </section>
        )}

        {/* ── Result ───────────────────────────────────── */}
        {game.phase === "result" && (
          <section className="spy-result">
            <div className={`spy-result-icon ${winner === "group" ? "spy-result-win" : "spy-result-lose"}`}>
              {winner === "group" ? "🎉" : "🕵️"}
            </div>
            <h2>{winner === "group" ? "Group Wins!" : "Spy Wins!"}</h2>
            <p className="spy-result-tagline">{hostLine}</p>

            <div className="spy-result-reveal">
              <div className="spy-result-word">
                <span className="spy-result-label">The Secret Word was:</span>
                <strong>{game.secretWord}</strong>
              </div>
              <div className="spy-result-spy">
                <span className="spy-result-label">The Spy was:</span>
                <strong>{spyPlayer?.name ?? "Unknown"}</strong>
              </div>
            </div>

            <div className="spy-vote-summary">
              <h3>Vote Results</h3>
              {game.players.map((p) => (
                <div key={p.id} className="spy-vote-row">
                  <span className="spy-vote-row-name">
                    {p.name}
                    {p.id === spyPlayer?.id ? " 🔍" : ""}
                  </span>
                  <span className="spy-vote-row-count">
                    {voteCounts[p.id] ?? 0} votes
                  </span>
                </div>
              ))}
            </div>

            <div className="spy-result-btns">
              <button
                className="spy-primary-btn"
                type="button"
                onClick={replay}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="spy-secondary-btn"
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
        .spy-container {
          min-height: auto;
          padding: 8px 0 0;
          display: flex;
          flex-direction: column;
          color: var(--ink);
        }

        .spy-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .spy-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .spy-back {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-weight: 800;
          cursor: pointer;
        }

        .spy-back:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        .spy-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .spy-title {
          margin: 0;
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
        }

        .spy-origin {
          color: var(--muted-dark);
          font-size: 0.85rem;
        }

        .spy-phase-pill {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border: 1px solid var(--stamp);
          border-radius: 999px;
          background: color-mix(in oklch, var(--stamp) 14%, var(--paper));
          color: color-mix(in oklch, var(--ink) 74%, var(--stamp));
          font-weight: 850;
          font-size: 0.85rem;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }

        .spy-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 380px;
        }

        /* ── Setup ──────────────────────────────────────── */
        .spy-setup {
          width: 100%;
          max-width: 480px;
        }

        .spy-ai-card {
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

        .spy-ai-orb {
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

        .spy-ai-kicker {
          color: var(--muted-dark);
          font-size: 0.72rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .spy-ai-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .spy-ai-row strong { font-size: 0.95rem; }

        .spy-ai-row span {
          border: 1px solid color-mix(in oklch, var(--stamp) 44%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--stamp) 12%, var(--surface));
          color: color-mix(in oklch, var(--stamp) 70%, white);
          font-size: 0.72rem;
          font-weight: 850;
          padding: 4px 10px;
          text-transform: uppercase;
        }

        .spy-ai-card p {
          color: var(--muted-dark);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-top: 6px;
        }

        .spy-setup h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 8px;
        }

        .spy-subtitle {
          color: var(--muted-dark);
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .spy-name-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
          max-height: 260px;
          overflow-y: auto;
        }

        .spy-name-row {
          display: grid;
          grid-template-columns: 1fr 36px;
          gap: 6px;
          align-items: center;
        }

        .spy-name-input {
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1rem;
          font-weight: 600;
          outline: none;
          width: 100%;
        }

        .spy-name-input:focus {
          border-color: var(--accent);
          background: color-mix(in oklch, var(--accent) 8%, var(--paper));
        }

        .spy-name-input::placeholder {
          color: var(--muted-dark);
          font-weight: 400;
        }

        .spy-remove-btn {
          min-height: 36px;
          min-width: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--coral);
          font-size: 1.2rem;
          font-weight: 900;
          cursor: pointer;
          transition: background 0.15s;
        }

        .spy-remove-btn:hover {
          background: color-mix(in oklch, var(--coral) 14%, var(--paper));
        }

        .spy-setup-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }

        .spy-ai-player-btn {
          min-height: 48px;
          padding: 12px 16px;
          border: 1px solid color-mix(in oklch, var(--teal) 50%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 12%, var(--paper));
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
          font-size: 0.95rem;
          font-weight: 850;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .spy-ai-player-btn:hover { filter: saturate(1.08); }

        .spy-start-btn {
          min-height: 48px;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), oklch(65% 0.16 49));
          color: #180f08;
          font-size: 0.95rem;
          font-weight: 900;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .spy-start-btn:hover { filter: saturate(1.08) brightness(1.01); }

        .spy-rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 18px 20px;
          text-align: left;
          width: 100%;
        }

        .spy-rules-box h3 {
          margin: 0 0 10px;
          font-size: 1rem;
        }

        .spy-rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.65;
        }

        .spy-rules-list li { margin-bottom: 3px; }

        /* ── Word Pack ─────────────────────────────────── */
        .spy-word-pack {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .spy-pack-icon {
          font-size: 3.5rem;
        }

        .spy-word-pack h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .spy-pack-subtitle {
          color: var(--muted-dark);
          font-size: 1rem;
          line-height: 1.5;
          margin-bottom: 8px;
        }

        .spy-role-list {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          overflow: hidden;
        }

        .spy-role-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--paper-line);
        }

        .spy-role-item:last-child { border-bottom: none; }

        .spy-role-name {
          font-weight: 850;
          font-size: 1rem;
          width: 100%;
          text-align: left;
        }

        .spy-reveal-btn {
          min-height: 40px;
          min-width: 140px;
          padding: 10px 20px;
          border: 1px solid var(--paper-line);
          border-radius: 999px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 0.85rem;
          font-weight: 850;
          cursor: pointer;
          transition: all 0.15s;
        }

        .spy-reveal-btn:hover {
          border-color: var(--accent);
          background: color-mix(in oklch, var(--accent) 12%, var(--paper));
        }

        .spy-revealed {
          border-color: var(--teal);
          background: color-mix(in oklch, var(--teal) 10%, var(--paper));
          color: oklch(52% 0.14 178);
        }

        .spy-role-card {
          width: 100%;
          border-radius: 8px;
          padding: 14px;
          text-align: left;
          animation: spy-reveal 0.2s ease-out;
        }

        @keyframes spy-reveal {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spy-role-spy {
          border: 2px solid var(--stamp);
          background: color-mix(in oklch, var(--stamp) 10%, var(--paper));
        }

        .spy-role-agent {
          border: 2px solid oklch(62% 0.18 145);
          background: color-mix(in oklch, oklch(62% 0.18 145) 8%, var(--paper));
        }

        .spy-role-badge {
          font-size: 1.1rem;
          font-weight: 900;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }

        .spy-role-word {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 6px;
          word-break: break-word;
        }

        .spy-role-hint {
          font-size: 0.85rem;
          font-style: italic;
          color: var(--muted-dark);
          margin: 0;
          line-height: 1.4;
        }

        .spy-pack-info {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          text-align: left;
          font-size: 0.9rem;
        }

        .spy-pack-cat-label {
          font-weight: 800;
          color: var(--muted-dark);
          margin-right: 6px;
        }

        .spy-pack-info strong {
          color: var(--accent);
          font-weight: 900;
        }

        /* ── Question Round ─────────────────────────────── */
        .spy-question {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .spy-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          transition: border-color 0.3s, background 0.3s;
        }

        .spy-timer-out {
          border-color: color-mix(in oklch, var(--stamp) 50%, transparent);
          background: color-mix(in oklch, var(--stamp) 10%, var(--paper));
        }

        .spy-timer-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .spy-timer-value {
          font-size: 2rem;
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 78%, var(--accent));
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          letter-spacing: -0.02em;
        }

        .spy-timer-out .spy-timer-value { color: var(--stamp); }

        .spy-question-info h2 {
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 6px;
        }

        .spy-question-info p {
          color: var(--muted-dark);
          font-size: 1rem;
          margin: 0 0 4px;
          line-height: 1.5;
        }

        .spy-players-mini {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }

        .spy-player-chip {
          padding: 6px 12px;
          border: 1px solid var(--paper-line);
          border-radius: 999px;
          background: var(--paper-2);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--ink);
        }

        .spy-ai-question-section {
          border: 1px dashed color-mix(in oklch, var(--teal) 40%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 5%, var(--paper));
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
        }

        .spy-ai-q-btn {
          min-height: 44px;
          padding: 10px 20px;
          border: 1px solid color-mix(in oklch, var(--teal) 50%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 12%, var(--paper));
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
          font-size: 0.9rem;
          font-weight: 850;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .spy-ai-q-btn:hover { filter: saturate(1.08); }

        .spy-ai-q-result {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--paper-2);
          border: 1px solid var(--paper-line);
        }

        .spy-ai-q-label {
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .spy-ai-q-text {
          margin: 0;
          font-size: 1rem;
          font-style: italic;
          color: var(--ink);
          line-height: 1.5;
        }

        .spy-host-speech {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 14px;
          border: 1px solid color-mix(in oklch, var(--teal) 30%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 7%, var(--paper));
          text-align: left;
        }

        .spy-host-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: color-mix(in oklch, var(--ink) 60%, var(--teal));
          text-transform: uppercase;
          letter-spacing: 0;
          flex-shrink: 0;
          padding-top: 2px;
        }

        .spy-host-speech p {
          margin: 0;
          font-size: 0.95rem;
          font-style: italic;
          color: var(--muted-dark);
          line-height: 1.5;
        }

        .spy-vote-btn {
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

        .spy-vote-btn:hover { filter: saturate(1.08) brightness(1.01); }

        /* ── Voting ─────────────────────────────────────── */
        .spy-vote {
          width: 100%;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          align-items: center;
        }

        .spy-vote h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .spy-vote-subtitle {
          color: var(--muted-dark);
          font-size: 1rem;
          margin: 0;
        }

        .spy-vote-players {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          overflow: hidden;
        }

        .spy-vote-player {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--paper-line);
        }

        .spy-vote-player:last-child { border-bottom: none; }

        .spy-vote-name {
          font-weight: 900;
          font-size: 1rem;
          width: 100%;
          text-align: left;
        }

        .spy-vote-options {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          width: 100%;
        }

        .spy-vote-target-btn {
          min-height: 36px;
          padding: 8px 14px;
          border: 1px solid var(--paper-line);
          border-radius: 999px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }

        .spy-vote-target-btn:hover {
          border-color: var(--stamp);
          background: color-mix(in oklch, var(--stamp) 10%, var(--paper));
        }

        .spy-vote-cast {
          font-size: 0.9rem;
          font-weight: 800;
          color: oklch(52% 0.14 145);
          width: 100%;
        }

        .spy-vote-target {
          font-size: 0.82rem;
          color: var(--muted-dark);
          font-weight: 600;
        }

        .spy-vote-count {
          font-size: 0.85rem;
          font-weight: 900;
          color: var(--stamp);
          font-variant-numeric: tabular-nums;
        }

        .spy-vote-progress {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--muted-dark);
        }

        .spy-reveal-btn-final {
          min-height: 52px;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--stamp), oklch(42% 0.2 28));
          color: #fff8f0;
          font-size: 1.1rem;
          font-weight: 900;
          cursor: pointer;
          transition: filter 0.15s;
        }

        .spy-reveal-btn-final:hover { filter: saturate(1.08); }

        /* ── Result ─────────────────────────────────────── */
        .spy-result {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .spy-result-icon {
          font-size: 4rem;
        }

        .spy-result h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .spy-result-tagline {
          font-style: italic;
          color: var(--muted-dark);
          font-size: 1.05rem;
          margin: 0;
        }

        .spy-result-reveal {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .spy-result-word,
        .spy-result-spy {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spy-result-label {
          font-size: 0.75rem;
          font-weight: 900;
          color: var(--muted-dark);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .spy-result-word strong {
          font-size: 1.6rem;
          font-weight: 900;
          color: var(--accent);
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          text-transform: capitalize;
        }

        .spy-result-spy strong {
          font-size: 1.3rem;
          font-weight: 900;
          color: var(--stamp);
        }

        .spy-vote-summary {
          width: 100%;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 16px;
          text-align: left;
        }

        .spy-vote-summary h3 {
          margin: 0 0 12px;
          font-size: 1rem;
          font-weight: 900;
          color: var(--muted-dark);
        }

        .spy-vote-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--paper-line);
          font-size: 1rem;
        }

        .spy-vote-row:last-child { border-bottom: none; }

        .spy-vote-row-name { font-weight: 600; }

        .spy-vote-row-count {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        .spy-result-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        /* ── Buttons ──────────────────────────────────────── */
        .spy-primary-btn {
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
          width: 100%;
        }

        .spy-primary-btn:hover { filter: saturate(1.08) brightness(1.01); }

        .spy-secondary-btn {
          min-height: 44px;
          padding: 14px 28px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1rem;
          font-weight: 800;
          cursor: pointer;
          width: 100%;
        }

        .spy-secondary-btn:hover { background: color-mix(in oklch, var(--paper-2) 78%, white); }

        /* ── Mobile responsive ──────────────────────────── */
        @media (max-width: 680px) {
          .spy-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }

          .spy-title { font-size: 1.5rem; }

          .spy-main { min-height: 360px; }

          .spy-setup-actions { grid-template-columns: 1fr; }

          .spy-timer-value { font-size: 1.6rem; }

          .spy-reveal-btn { min-width: 120px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
}