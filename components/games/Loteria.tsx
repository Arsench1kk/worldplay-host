"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import type { LoteriaCard, LoteriaPhase, LoteriaGameState } from "@/data/gameContent/loteria";
import { useGameAIHost } from "@/lib/ai/gameAIClient";
import {
  LOTERIA_DECK,
  GAME_INSTRUCTIONS,
  CANTOR_INTRO_LINES,
  CANTOR_WIN_LINES,
  CANTOR_LOSE_LINES,
} from "@/data/gameContent/loteria";

interface LoteriaProps {
  playerCount?: number;
  onBack?: () => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LOTERIA_RULES_FALLBACK = GAME_INSTRUCTIONS.join(" ");

/** Fisher-Yates shuffle (immutable). */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** All win-line index combos for a 3×3 grid. */
const WIN_LINES = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

function checkWin(board: LoteriaCard[], marked: Set<number>): number[] | null {
  for (const line of WIN_LINES) {
    if (line.every((idx) => marked.has(board[idx].id))) {
      return line;
    }
  }
  return null;
}

function createGame(): LoteriaGameState {
  const shuffled = shuffle(LOTERIA_DECK);
  const board = shuffled.slice(0, 9);
  const remaining = shuffled.slice(9);
  // Add some board cards back into remaining deck (so matches are possible),
  // then shuffle again. We guarantee at least all 9 board cards appear somewhere
  // in the caller deck so a win is theoretically possible.
  const callerDeck = shuffle([...remaining, ...shuffle(board)]);

  return {
    phase: "intro",
    board,
    deck: callerDeck,
    calledCards: [],
    currentCall: null,
    marked: new Set(),
    callCount: 0,
    won: false,
    winLine: null,
  };
}

export default function Loteria({ onBack }: LoteriaProps) {
  const [game, setGame] = useState<LoteriaGameState>(createGame);
  const [cantorLine, setCantorLine] = useState(pick(CANTOR_INTRO_LINES));
  const aiCommentKeyRef = useRef("");

  /* ── Derived ────────────────────────────────────────── */
  const boardCardIds = useMemo(
    () => new Set(game.board.map((c) => c.id)),
    [game.board]
  );
  const { rules, comment, rulesStatus, commentStatus, hostComment } = useGameAIHost({
    gameId: "loteria",
    cultureId: "mexico",
    rulesPrompt:
      "Explain Loteria for a same-device demo. Mention the caller, matching cards, and the line win.",
    initialRules: LOTERIA_RULES_FALLBACK,
    initialComment: cantorLine
  });

  /* ── Actions ────────────────────────────────────────── */

  const startGame = useCallback(() => {
    const g = createGame();
    setGame(g);
    setCantorLine(pick(CANTOR_INTRO_LINES));
  }, []);

  const callNextCard = useCallback(() => {
    setGame((prev) => {
      if (prev.deck.length === 0) {
        setCantorLine(pick(CANTOR_LOSE_LINES));
        return { ...prev, phase: "lose" };
      }
      const [next, ...rest] = prev.deck;
      setCantorLine(`"${next.riddle}"`);
      return {
        ...prev,
        deck: rest,
        currentCall: next,
        calledCards: [...prev.calledCards, next],
        callCount: prev.callCount + 1,
      };
    });
  }, []);

  const markCard = useCallback(
    (cardId: number) => {
      setGame((prev) => {
        if (prev.phase !== "playing") return prev;
        if (prev.marked.has(cardId)) return prev; // already marked
        // Can only mark if the card has been called
        const wasCalled = prev.calledCards.some((c) => c.id === cardId);
        if (!wasCalled) return prev;

        const newMarked = new Set(prev.marked);
        newMarked.add(cardId);

        const winLine = checkWin(prev.board, newMarked);
        if (winLine) {
          setCantorLine(pick(CANTOR_WIN_LINES));
          return {
            ...prev,
            marked: newMarked,
            won: true,
            winLine,
            phase: "win",
          };
        }
        return { ...prev, marked: newMarked };
      });
    },
    []
  );

  const beginPlaying = useCallback(() => {
    setGame((prev) => ({ ...prev, phase: "playing" }));
  }, []);

  useEffect(() => {
    let key = "";
    let prompt = "";
    const state = {
      phase: game.phase,
      callCount: game.callCount,
      markedCount: game.marked.size,
      currentCard: game.currentCall?.name
    };

    if (game.phase === "playing" && game.currentCall) {
      key = `call:${game.callCount}:${game.currentCall.id}`;
      prompt = `The AI caller just drew ${game.currentCall.name}. Give a lively Loteria caller comment.`;
    } else if (game.phase === "playing") {
      key = "playing:ready";
      prompt = "The Loteria board is ready and no card has been drawn yet.";
    } else if (game.phase === "win") {
      key = `win:${game.callCount}:${game.marked.size}`;
      prompt = "The player completed a line in Loteria. Celebrate the win briefly.";
    } else if (game.phase === "lose") {
      key = `lose:${game.callCount}:${game.marked.size}`;
      prompt = "The Loteria deck ended before a completed line. Keep the player encouraged.";
    }

    if (!key || key === aiCommentKeyRef.current) {
      return;
    }

    aiCommentKeyRef.current = key;
    void hostComment(prompt, state, cantorLine);
  }, [
    cantorLine,
    game.callCount,
    game.currentCall,
    game.marked.size,
    game.phase,
    hostComment
  ]);

  /* ── Render helpers ─────────────────────────────────── */

  const isCardCallable = useCallback(
    (cardId: number) => game.calledCards.some((c) => c.id === cardId),
    [game.calledCards]
  );

  const winSet = useMemo(
    () => new Set(game.winLine ?? []),
    [game.winLine]
  );

  return (
    <div className="loteria-container">
      <header className="loteria-header">
        <div className="loteria-title-row">
          {onBack && (
            <button className="loteria-back" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="loteria-title-area">
            <h1 className="loteria-title">Lotería</h1>
            <span className="loteria-origin">Mexico · Caller Board</span>
          </div>
        </div>
        <div className="loteria-call-pill">
          Calls: {game.callCount}
        </div>
      </header>

      <main className="loteria-main">
        {/* ── Intro ──────────────────────────────────── */}
        {game.phase === "intro" && (
          <section className="loteria-intro">
            <div className="loteria-ai-card">
              <div className="loteria-ai-orb" aria-hidden="true">
                AI
              </div>
              <div>
                <div className="loteria-ai-kicker">AI Cantor</div>
                <div className="loteria-ai-row">
                  <strong>{rulesStatus}</strong>
                  <span>Caller</span>
                </div>
                <p>{rules.text}</p>
              </div>
            </div>
            <h2>¡Lotería!</h2>
            <p className="loteria-subtitle">
              Draw a card. Match it on your tabla. Complete a line.
            </p>
            <div className="loteria-rules-box">
              <h3>How to Play</h3>
              <ol className="loteria-rules-list">
                {GAME_INSTRUCTIONS.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ol>
            </div>
            <button
              className="loteria-primary-btn"
              type="button"
              onClick={beginPlaying}
            >
              Start Game
            </button>
          </section>
        )}

        {/* ── Playing ────────────────────────────────── */}
        {game.phase === "playing" && (
          <section className="loteria-playing">
            {/* Cantor area */}
            <div className="loteria-cantor-box">
              <div className="loteria-cantor-head">
                <div className="loteria-ai-orb" aria-hidden="true">
                  AI
                </div>
                <div>
                  <div className="loteria-ai-kicker">AI Cantor</div>
                  <div className="loteria-ai-row">
                    <strong>{commentStatus}</strong>
                    <span>{game.currentCall ? "Calling" : "Ready"}</span>
                  </div>
                </div>
              </div>
              <p className="loteria-live-comment">{comment.text}</p>
              <p className="loteria-cantor-speech">{cantorLine}</p>
              {game.currentCall && (
                <div className="loteria-current-card">
                  <span className="loteria-current-emoji">
                    {game.currentCall.emoji}
                  </span>
                  <span className="loteria-current-name">
                    {game.currentCall.name}
                  </span>
                </div>
              )}
              <button
                className="loteria-call-btn"
                type="button"
                onClick={callNextCard}
              >
                {game.currentCall ? "Next Card" : "Draw First Card"}
              </button>
            </div>

            {/* 3×3 Tabla */}
            <div className="loteria-tabla" role="grid" aria-label="Your tabla">
              {game.board.map((card, idx) => {
                const isMarked = game.marked.has(card.id);
                const callable = isCardCallable(card.id);
                return (
                  <button
                    key={card.id}
                    className={`loteria-cell ${isMarked ? "loteria-marked" : ""} ${
                      callable && !isMarked ? "loteria-callable" : ""
                    }`}
                    type="button"
                    onClick={() => markCard(card.id)}
                    disabled={isMarked}
                    aria-label={`${card.name}${isMarked ? " (marked)" : ""}`}
                  >
                    <span className="loteria-cell-emoji">{card.emoji}</span>
                    <span className="loteria-cell-name">{card.name}</span>
                    {isMarked && (
                      <span className="loteria-bean" aria-hidden="true">
                        🫘
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Called card history */}
            <div className="loteria-history">
              <div className="loteria-history-label">Called Cards</div>
              <div className="loteria-history-row">
                {game.calledCards.length === 0 ? (
                  <span className="loteria-history-empty">
                    No cards called yet
                  </span>
                ) : (
                  game.calledCards.map((c) => (
                    <span
                      key={`${c.id}-${game.calledCards.indexOf(c)}`}
                      className={`loteria-history-chip ${
                        boardCardIds.has(c.id) ? "loteria-chip-match" : ""
                      } ${game.marked.has(c.id) ? "loteria-chip-marked" : ""}`}
                      title={c.name}
                    >
                      {c.emoji}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Win ────────────────────────────────────── */}
        {game.phase === "win" && (
          <section className="loteria-result-screen">
            <div className="loteria-result-icon">🎉</div>
            <h2>¡Lotería!</h2>
            <div className="loteria-verdict-card">
              <span>AI Cantor verdict · {commentStatus}</span>
              <p className="loteria-cantor-win">{cantorLine}</p>
              <p className="loteria-live-comment">{comment.text}</p>
            </div>

            {/* Winning board */}
            <div className="loteria-tabla loteria-tabla-result" role="grid">
              {game.board.map((card, idx) => (
                <div
                  key={card.id}
                  className={`loteria-cell loteria-cell-static ${
                    game.marked.has(card.id) ? "loteria-marked" : ""
                  } ${winSet.has(idx) ? "loteria-win-cell" : ""}`}
                >
                  <span className="loteria-cell-emoji">{card.emoji}</span>
                  <span className="loteria-cell-name">{card.name}</span>
                  {game.marked.has(card.id) && (
                    <span className="loteria-bean" aria-hidden="true">
                      🫘
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="loteria-stats-box">
              <div className="loteria-stat-row">
                <span>Cards Called</span>
                <span className="loteria-stat-val">{game.callCount}</span>
              </div>
              <div className="loteria-stat-row">
                <span>Cards Marked</span>
                <span className="loteria-stat-val">{game.marked.size}</span>
              </div>
            </div>

            <div className="loteria-result-btns">
              <button
                className="loteria-primary-btn"
                type="button"
                onClick={startGame}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="loteria-secondary-btn"
                  type="button"
                  onClick={onBack}
                >
                  Back to Discovery
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Lose ───────────────────────────────────── */}
        {game.phase === "lose" && (
          <section className="loteria-result-screen">
            <div className="loteria-result-icon">😔</div>
            <h2>Deck Empty!</h2>
            <div className="loteria-verdict-card">
              <span>AI Cantor verdict · {commentStatus}</span>
              <p className="loteria-cantor-win">{cantorLine}</p>
              <p className="loteria-live-comment">{comment.text}</p>
            </div>

            <div className="loteria-tabla loteria-tabla-result" role="grid">
              {game.board.map((card) => (
                <div
                  key={card.id}
                  className={`loteria-cell loteria-cell-static ${
                    game.marked.has(card.id) ? "loteria-marked" : ""
                  }`}
                >
                  <span className="loteria-cell-emoji">{card.emoji}</span>
                  <span className="loteria-cell-name">{card.name}</span>
                  {game.marked.has(card.id) && (
                    <span className="loteria-bean" aria-hidden="true">
                      🫘
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="loteria-stats-box">
              <div className="loteria-stat-row">
                <span>Cards Called</span>
                <span className="loteria-stat-val">{game.callCount}</span>
              </div>
              <div className="loteria-stat-row">
                <span>Cards Marked</span>
                <span className="loteria-stat-val">{game.marked.size}</span>
              </div>
            </div>

            <div className="loteria-result-btns">
              <button
                className="loteria-primary-btn"
                type="button"
                onClick={startGame}
              >
                Play Again
              </button>
              {onBack && (
                <button
                  className="loteria-secondary-btn"
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
        .loteria-container {
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
        .loteria-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .loteria-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .loteria-back {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 78%, transparent);
          color: var(--fg);
          font-weight: 800;
          cursor: pointer;
        }

        .loteria-back:hover {
          filter: brightness(1.08);
        }

        .loteria-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .loteria-title {
          margin: 0;
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
          color: var(--fg);
        }

        .loteria-origin {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .loteria-call-pill {
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
        .loteria-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 400px;
        }

        /* ── Intro ────────────────────────────────────── */
        .loteria-intro,
        .loteria-playing,
        .loteria-result-screen {
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

        .loteria-intro {
          max-width: 520px;
        }

        .loteria-ai-card,
        .loteria-cantor-head {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 12px;
          align-items: center;
          border: 1px solid var(--line);
          border-radius: 8px;
          background: color-mix(in oklch, var(--surface) 88%, black);
          color: var(--fg);
          padding: 14px;
          text-align: left;
        }

        .loteria-ai-card {
          margin-bottom: 18px;
        }

        .loteria-ai-orb {
          display: grid;
          width: 54px;
          height: 54px;
          place-items: center;
          border: 1px solid color-mix(in oklch, var(--accent) 56%, white);
          border-radius: 999px;
          background:
            radial-gradient(circle at 35% 24%, rgba(255, 255, 255, 0.92), transparent 22%),
            linear-gradient(145deg, var(--teal), var(--stamp));
          box-shadow: 0 14px 32px color-mix(in oklch, var(--teal) 24%, transparent);
          color: white;
          font-size: 0.8rem;
          font-weight: 950;
        }

        .loteria-ai-kicker {
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .loteria-ai-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .loteria-ai-row strong {
          color: var(--fg);
          font-size: 1rem;
        }

        .loteria-ai-row span {
          border: 1px solid color-mix(in oklch, var(--teal) 44%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--teal) 12%, var(--surface));
          color: color-mix(in oklch, var(--teal) 72%, white);
          font-size: 0.72rem;
          font-weight: 850;
          padding: 5px 8px;
          text-transform: uppercase;
        }

        .loteria-ai-card p {
          color: color-mix(in oklch, var(--fg) 86%, var(--muted));
          line-height: 1.45;
          margin-top: 6px;
        }

        .loteria-intro h2 {
          font-size: 2.2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .loteria-subtitle {
          color: var(--muted-dark);
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .loteria-rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .loteria-rules-box h3 {
          margin: 0 0 12px;
          font-size: 1.1rem;
        }

        .loteria-rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.7;
        }

        .loteria-rules-list li {
          margin-bottom: 4px;
        }

        /* ── Playing ──────────────────────────────────── */
        .loteria-playing {
          max-width: 620px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* ── Cantor box ───────────────────────────────── */
        .loteria-cantor-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 14px;
          text-align: left;
        }

        .loteria-cantor-head {
          margin-bottom: 12px;
        }

        .loteria-cantor-speech {
          color: var(--ink);
          font-size: 1.05rem;
          font-style: italic;
          line-height: 1.45;
          margin: 0 0 12px;
          min-height: 1.4em;
        }

        .loteria-live-comment {
          border-left: 3px solid color-mix(in oklch, var(--teal) 56%, transparent);
          color: var(--muted-dark);
          font-size: 0.95rem;
          line-height: 1.45;
          margin: 0 0 12px;
          padding-left: 10px;
        }

        .loteria-current-card {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
          padding: 10px 14px;
          border-radius: 8px;
          background: color-mix(in oklch, var(--accent) 16%, var(--paper));
          border: 1px solid color-mix(in oklch, var(--accent) 30%, transparent);
        }

        .loteria-current-emoji {
          font-size: 2rem;
        }

        .loteria-current-name {
          font-weight: 850;
          font-size: 1.1rem;
        }

        .loteria-call-btn {
          min-height: 44px;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--accent), oklch(65% 0.16 49));
          color: #180f08;
          font-size: 1rem;
          font-weight: 900;
          cursor: pointer;
          transition: filter 0.2s;
          width: 100%;
        }

        .loteria-call-btn:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        /* ── 3×3 Tabla grid ───────────────────────────── */
        .loteria-tabla {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          width: min(100%, 480px);
          align-self: center;
          border: 1px solid color-mix(in oklch, var(--stamp) 20%, transparent);
          border-radius: 8px;
          background:
            linear-gradient(145deg, color-mix(in oklch, var(--stamp) 9%, transparent), transparent 45%),
            color-mix(in oklch, var(--paper) 70%, white);
          padding: 10px;
        }

        .loteria-cell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          min-height: 106px;
          padding: 12px 6px;
          border: 2px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          cursor: pointer;
          box-shadow: inset 0 0 0 1px color-mix(in oklch, white 42%, transparent);
          transition: border-color 0.15s, background 0.15s, transform 0.15s;
          user-select: none;
          -webkit-user-select: none;
        }

        .loteria-cell:hover:not(:disabled):not(.loteria-marked) {
          border-color: var(--accent);
          background: color-mix(in oklch, var(--accent) 10%, var(--paper));
          transform: translateY(-1px);
        }

        .loteria-callable {
          border-color: color-mix(in oklch, oklch(62% 0.18 145) 60%, transparent);
          background: color-mix(in oklch, oklch(62% 0.18 145) 8%, var(--paper));
          animation: loteria-glow 1.2s ease-in-out infinite alternate;
        }

        @keyframes loteria-glow {
          from { box-shadow: 0 0 0 0 transparent; }
          to { box-shadow: 0 0 8px 2px color-mix(in oklch, oklch(62% 0.18 145) 30%, transparent); }
        }

        .loteria-marked {
          border-color: color-mix(in oklch, var(--stamp) 60%, transparent);
          background: color-mix(in oklch, var(--stamp) 12%, var(--paper));
          cursor: default;
          box-shadow:
            inset 0 0 0 3px color-mix(in oklch, var(--stamp) 22%, transparent),
            0 12px 24px rgba(38, 28, 18, 0.12);
          opacity: 1;
        }

        .loteria-win-cell {
          border-color: var(--teal) !important;
          background: color-mix(in oklch, var(--teal) 18%, var(--paper)) !important;
          box-shadow:
            inset 0 0 0 4px color-mix(in oklch, var(--teal) 28%, transparent),
            0 0 16px 4px color-mix(in oklch, var(--teal) 35%, transparent);
          opacity: 1 !important;
        }

        .loteria-win-cell::after {
          position: absolute;
          right: 6px;
          bottom: 6px;
          content: "LINE";
          border-radius: 999px;
          background: color-mix(in oklch, var(--teal) 72%, black);
          color: white;
          font-size: 0.58rem;
          font-weight: 950;
          padding: 3px 6px;
        }

        .loteria-cell-static {
          cursor: default;
        }

        .loteria-cell-emoji {
          font-size: 2rem;
          line-height: 1;
        }

        .loteria-cell-name {
          font-size: 0.74rem;
          font-weight: 850;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .loteria-bean {
          position: absolute;
          top: 6px;
          right: 6px;
          display: grid;
          width: 28px;
          height: 28px;
          place-items: center;
          border: 1px solid color-mix(in oklch, var(--stamp) 34%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--paper) 82%, white);
          box-shadow: 0 6px 12px rgba(38, 28, 18, 0.18);
          font-size: 1.1rem;
        }

        /* ── Called card history ───────────────────────── */
        .loteria-history {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 14px;
          text-align: left;
        }

        .loteria-history-label {
          font-size: 0.85rem;
          font-weight: 850;
          color: var(--muted-dark);
          margin-bottom: 8px;
        }

        .loteria-history-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          max-height: 92px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .loteria-history-empty {
          font-size: 0.9rem;
          color: var(--muted-dark);
          font-style: italic;
        }

        .loteria-history-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--paper-2);
          border: 1px solid var(--paper-line);
          font-size: 1.2rem;
          opacity: 0.6;
        }

        .loteria-chip-match {
          opacity: 1;
          border-color: color-mix(in oklch, var(--accent) 50%, transparent);
          background: color-mix(in oklch, var(--accent) 14%, var(--paper));
        }

        .loteria-chip-marked {
          border-color: color-mix(in oklch, var(--stamp) 50%, transparent);
          background: color-mix(in oklch, var(--stamp) 12%, var(--paper));
        }

        /* ── Result screens ───────────────────────────── */
        .loteria-result-screen {
          max-width: 540px;
        }

        .loteria-result-icon {
          font-size: 4rem;
          margin-bottom: 12px;
        }

        .loteria-result-screen h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .loteria-cantor-win {
          font-style: italic;
          font-size: 1.1rem;
          color: var(--muted-dark);
          line-height: 1.45;
        }

        .loteria-verdict-card {
          border: 1px solid color-mix(in oklch, var(--teal) 28%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--teal) 7%, var(--paper));
          margin-bottom: 18px;
          padding: 14px;
          text-align: left;
        }

        .loteria-verdict-card span {
          display: block;
          color: var(--muted-dark);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .loteria-tabla-result {
          margin-bottom: 20px;
        }

        .loteria-stats-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .loteria-stat-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--paper-line);
          font-size: 1rem;
        }

        .loteria-stat-row:last-child {
          border-bottom: none;
        }

        .loteria-stat-val {
          font-weight: 900;
          font-variant-numeric: tabular-nums;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        /* ── Buttons ──────────────────────────────────── */
        .loteria-primary-btn {
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

        .loteria-primary-btn:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        .loteria-secondary-btn {
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

        .loteria-secondary-btn:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        .loteria-result-btns {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* ── Mobile responsive ────────────────────────── */
        @media (max-width: 680px) {
          .loteria-container {
            padding: 14px;
          }

          .loteria-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .loteria-title {
            font-size: 1.5rem;
          }

          .loteria-main {
            min-height: 360px;
          }

          .loteria-intro,
          .loteria-playing,
          .loteria-result-screen {
            padding: 16px;
          }

          .loteria-ai-card,
          .loteria-cantor-head {
            grid-template-columns: 48px 1fr;
            padding: 12px;
          }

          .loteria-ai-orb {
            width: 48px;
            height: 48px;
          }

          .loteria-tabla {
            gap: 8px;
            padding: 8px;
          }

          .loteria-cell {
            min-height: 88px;
            padding: 8px 4px;
          }

          .loteria-cell-emoji {
            font-size: 1.5rem;
          }

          .loteria-cell-name {
            font-size: 0.65rem;
          }

          .loteria-current-emoji {
            font-size: 1.6rem;
          }

          .loteria-primary-btn,
          .loteria-secondary-btn,
          .loteria-call-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
