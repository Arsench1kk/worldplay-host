"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  GolYaPoochGameState,
  GolYaPoochPhase,
  GolYaPoochRoundState
} from "@/data/gameContent/golYaPooch";
import { useGameAIHost } from "@/lib/ai/gameAIClient";
import { FALLBACK_CLUES, GAME_INSTRUCTIONS } from "@/data/gameContent/golYaPooch";

interface GolYaPoochProps {
  playerCount?: number;
  onBack?: () => void;
}

const GOL_YA_POOCH_RULES_FALLBACK = GAME_INSTRUCTIONS.join(" ");

function createInitialState(playerCount: number): GolYaPoochGameState {
  const players = Array.from({ length: Math.max(2, playerCount) }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i + 1}`,
    score: 0
  }));
  return {
    phase: "intro",
    players,
    round: {
      roundNumber: 1,
      hiderIndex: 0,
      secretHand: null,
      guesserIndex: null,
      guess: null,
      correct: false,
      clue: FALLBACK_CLUES[Math.floor(Math.random() * FALLBACK_CLUES.length)]
    },
    totalRounds: 6,
    winner: null
  };
}

function getNextGuesser(
  players: GolYaPoochGameState["players"],
  currentHiderIndex: number
): number {
  let next = (currentHiderIndex + 1) % players.length;
  if (next === currentHiderIndex) {
    next = (next + 1) % players.length;
  }
  return next;
}

export default function GolYaPooch({ playerCount = 4, onBack }: GolYaPoochProps) {
  const [gameState, setGameState] = useState<GolYaPoochGameState>(
    createInitialState(playerCount)
  );
  const aiCommentKeyRef = useRef("");

  const advancePhase = useCallback(
    (currentPhase: GolYaPoochPhase): GolYaPoochPhase => {
      switch (currentPhase) {
        case "intro":
          return "setup";
        case "setup":
          return "hide";
        case "hide":
          return "guess";
        case "guess":
          return "reveal";
        case "reveal":
          return "round-result";
        case "round-result":
          return "game-over";
        default:
          return currentPhase;
      }
    },
    []
  );

  const startGame = useCallback(() => {
    setGameState(createInitialState(playerCount));
  }, [playerCount]);

  const startRound = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      phase: advancePhase(prev.phase),
      round: {
        ...prev.round,
        secretHand: null,
        guess: null,
        correct: false,
        guesserIndex: getNextGuesser(prev.players, prev.round.hiderIndex),
        clue: FALLBACK_CLUES[Math.floor(Math.random() * FALLBACK_CLUES.length)]
      }
    }));
  }, [advancePhase]);

  const hideObject = useCallback((hand: "left" | "right") => {
    setGameState((prev) => ({
      ...prev,
      phase: advancePhase(prev.phase),
      round: { ...prev.round, secretHand: hand }
    }));
  }, [advancePhase]);

  const makeGuess = useCallback((guess: "left" | "right") => {
    setGameState((prev) => {
      const correct = guess === prev.round.secretHand;
      const updatedPlayers = [...prev.players];
      const guesserIndex = prev.round.guesserIndex ?? 0;

      if (correct) {
        updatedPlayers[guesserIndex] = {
          ...updatedPlayers[guesserIndex],
          score: updatedPlayers[guesserIndex].score + 1
        };
      } else {
        updatedPlayers[prev.round.hiderIndex] = {
          ...updatedPlayers[prev.round.hiderIndex],
          score: updatedPlayers[prev.round.hiderIndex].score + 1
        };
      }

      return {
        ...prev,
        phase: advancePhase(prev.phase),
        players: updatedPlayers,
        round: { ...prev.round, guess, correct }
      };
    });
  }, [advancePhase]);

  const nextRound = useCallback(() => {
    setGameState((prev) => {
      const nextHiderIndex = (prev.round.hiderIndex + 1) % prev.players.length;
      const isLastRound = prev.round.roundNumber >= prev.totalRounds;

      if (isLastRound) {
        const maxScore = Math.max(...prev.players.map((p) => p.score));
        const winners = prev.players.filter((p) => p.score === maxScore);
        return {
          ...prev,
          phase: "game-over",
          winner: winners.length === 1 ? winners[0].name : "Tie"
        };
      }

      return {
        ...prev,
        phase: "setup",
        round: {
          ...prev.round,
          roundNumber: prev.round.roundNumber + 1,
          hiderIndex: nextHiderIndex,
          secretHand: null,
          guesserIndex: null,
          guess: null,
          correct: false
        }
      };
    });
  }, []);

  const hiderName = gameState.players[gameState.round.hiderIndex]?.name ?? "Hider";
  const guesserName = gameState.players[gameState.round.guesserIndex ?? 0]?.name ?? "Guesser";
  const { rules, comment, rulesStatus, commentStatus, hostComment } = useGameAIHost({
    gameId: "gol-ya-pooch",
    cultureId: "iran",
    rulesPrompt:
      "Explain Gol ya Pooch for a same-device demo. Mention hiding the object, guessing the hand, and scoring.",
    initialRules: GOL_YA_POOCH_RULES_FALLBACK,
    initialComment: gameState.round.clue
  });

  useEffect(() => {
    let prompt = "";
    const key = `${gameState.phase}:${gameState.round.roundNumber}:${gameState.round.secretHand ?? ""}:${gameState.round.guess ?? ""}`;
    const state = {
      phase: gameState.phase,
      round: gameState.round.roundNumber,
      hider: hiderName,
      guesser: guesserName,
      guess: gameState.round.guess,
      correct: gameState.round.correct
    };

    if (gameState.phase === "setup") {
      prompt = `${hiderName} is about to hide the object for Gol ya Pooch. Give a short host setup line.`;
    } else if (gameState.phase === "guess") {
      prompt = `${guesserName} is choosing a hand in Gol ya Pooch. Give a short bluff-reading hint.`;
    } else if (gameState.phase === "round-result") {
      prompt = gameState.round.correct
        ? `${guesserName} guessed correctly in Gol ya Pooch. Celebrate briefly.`
        : `${hiderName} fooled the guesser in Gol ya Pooch. React briefly.`;
    } else if (gameState.phase === "game-over") {
      prompt = `Gol ya Pooch ended with winner ${gameState.winner}. Close the game warmly.`;
    }

    if (!prompt || key === aiCommentKeyRef.current) {
      return;
    }

    aiCommentKeyRef.current = key;
    void hostComment(prompt, state, gameState.round.clue);
  }, [
    gameState.phase,
    gameState.round.correct,
    gameState.round.guess,
    gameState.round.roundNumber,
    gameState.round.secretHand,
    gameState.round.clue,
    gameState.winner,
    guesserName,
    hiderName,
    hostComment
  ]);

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="game-title-row">
          {onBack && (
            <button className="back-button" onClick={onBack} type="button">
              Back
            </button>
          )}
          <div className="game-title-area">
            <h1 className="game-title">Gol Ya Pooch</h1>
            <span className="game-origin">Iran · Hidden Choice</span>
          </div>
        </div>
        <div className="round-indicator">
          Round {gameState.round.roundNumber} of {gameState.totalRounds}
        </div>
      </header>

      <main className="game-main">
        {gameState.phase === "intro" && (
          <section className="game-intro">
            <div className="ai-host-badge">AI Host: Nika · {rulesStatus}</div>
            <h2>Find the Flower!</h2>
            <p className="intro-description">
              {rules.text}
            </p>
            <div className="rules-box">
              <h3>How to Play</h3>
              <ol className="rules-list">
                {GAME_INSTRUCTIONS.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </div>
            <button className="primary-button" type="button" onClick={startGame}>
              Start Game
            </button>
          </section>
        )}

        {gameState.phase === "setup" && (
          <section className="game-setup">
            <div className="setup-info">
              <h2>{hiderName}, your turn!</h2>
              <p>Hide the object in one of your hands. Keep it secret!</p>
            </div>
            <div className="hand-buttons">
              <button
                className="hand-button left-hand"
                type="button"
                onClick={() => hideObject("left")}
              >
                <span className="hand-icon">👋</span>
                <span>Left Hand</span>
              </button>
              <button
                className="hand-button right-hand"
                type="button"
                onClick={() => hideObject("right")}
              >
                <span className="hand-icon">🤚</span>
                <span>Right Hand</span>
              </button>
            </div>
          </section>
        )}

        {gameState.phase === "hide" && (
          <section className="game-hide">
            <div className="hide-info">
              <h2>Good!</h2>
              <p>Keep your hands hidden from {guesserName}.</p>
              <button className="primary-button" type="button" onClick={startRound}>
                I&apos;m Ready — {guesserName} Guess!
              </button>
            </div>
          </section>
        )}

        {gameState.phase === "guess" && (
          <section className="game-guess">
            <div className="ai-clue-box">
              <div className="ai-label">Host Hint · {commentStatus}</div>
              <p className="live-comment">{comment.text}</p>
              <p className="clue-text">&ldquo;{gameState.round.clue}&rdquo;</p>
            </div>
            <h2>{guesserName}, make your choice!</h2>
            <p>Which hand holds the flower?</p>
            <div className="choice-buttons">
              <button
                className="choice-button left-choice"
                type="button"
                onClick={() => makeGuess("left")}
              >
                <span className="choice-icon">👈</span>
                <span>Left</span>
              </button>
              <button
                className="choice-button right-choice"
                type="button"
                onClick={() => makeGuess("right")}
              >
                <span className="choice-icon">👉</span>
                <span>Right</span>
              </button>
            </div>
          </section>
        )}

        {gameState.phase === "reveal" && (
          <section className="game-reveal">
            <div className="reveal-header">
              <h2>Reveal!</h2>
              <div
                className={`revealed-hand ${
                  gameState.round.secretHand === "left" ? "left-revealed" : "right-revealed"
                }`}
              >
                <span className="reveal-label">Flower was in</span>
                <span className="reveal-hand-name">
                  {gameState.round.secretHand === "left" ? "LEFT" : "RIGHT"} hand
                </span>
              </div>
            </div>
          </section>
        )}

        {gameState.phase === "round-result" && (
          <section className="game-result">
            <div className={`result-banner ${gameState.round.correct ? "correct" : "wrong"}`}>
              {gameState.round.correct ? "🎯 Correct!" : "❌ Wrong guess!"}
            </div>
            <div className="result-message">
              {gameState.round.correct
                ? `${guesserName} found it! +1 point`
                : `${hiderName} fooled you! +1 point to ${hiderName}`}
            </div>
            <div className="ai-clue-box">
              <div className="ai-label">AI Host · {commentStatus}</div>
              <p className="live-comment">{comment.text}</p>
            </div>
            <div className="scoreboard">
              <h3>Scores</h3>
              <div className="score-list">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`score-item ${
                      gameState.round.guesserIndex === gameState.players.indexOf(player) &&
                      gameState.round.correct
                        ? "score-highlight"
                        : gameState.round.hiderIndex === gameState.players.indexOf(player) &&
                          !gameState.round.correct
                        ? "score-highlight"
                        : ""
                    }`}
                  >
                    <span className="player-name">{player.name}</span>
                    <span className="player-score">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="primary-button" type="button" onClick={nextRound}>
              Next Round
            </button>
          </section>
        )}

        {gameState.phase === "game-over" && (
          <section className="game-over">
            <div className="trophy-icon">🏆</div>
            <h2>
              {gameState.winner === "Tie" ? "It's a Tie!" : `${gameState.winner} Wins!`}
            </h2>
            <div className="final-scores">
              {gameState.players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div key={player.id} className="final-score-item">
                    <span className="final-rank">#{index + 1}</span>
                    <span className="final-name">{player.name}</span>
                    <span className="final-score">{player.score}</span>
                  </div>
                ))}
            </div>
            <div className="game-over-buttons">
              <button className="primary-button" type="button" onClick={startGame}>
                Play Again
              </button>
              {onBack && (
                <button className="secondary-button" type="button" onClick={onBack}>
                  Back to Discovery
                </button>
              )}
            </div>
          </section>
        )}
      </main>

      <style jsx>{`
        .game-container {
          min-height: auto;
          padding: 8px 0 0;
          display: flex;
          flex-direction: column;
          color: var(--ink);
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .game-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-button {
          min-height: 44px;
          padding: 8px 16px;
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-weight: 800;
        }

        .game-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .game-title {
          margin: 0;
          font-size: 1.8rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          font-weight: 800;
        }

        .game-origin {
          color: var(--muted-dark);
          font-size: 0.85rem;
        }

        .round-indicator {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          padding: 8px 16px;
          border: 1px solid var(--accent);
          border-radius: 999px;
          color: color-mix(in oklch, var(--ink) 74%, var(--stamp));
          font-weight: 850;
          font-size: 0.9rem;
        }

        .game-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 380px;
        }

        /* Intro Phase */
        .game-intro {
          max-width: 480px;
          width: 100%;
        }

        .ai-host-badge {
          display: inline-block;
          padding: 6px 14px;
          border: 1px solid color-mix(in oklch, var(--teal) 42%, transparent);
          border-radius: 999px;
          background: color-mix(in oklch, var(--teal) 13%, var(--paper));
          color: color-mix(in oklch, var(--ink) 78%, var(--teal));
          font-size: 0.8rem;
          font-weight: 850;
          margin-bottom: 16px;
        }

        .game-intro h2 {
          font-size: 2.2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .intro-description {
          color: var(--muted-dark);
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .rules-box {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .rules-box h3 {
          margin: 0 0 12px;
          font-size: 1.1rem;
        }

        .rules-list {
          margin: 0;
          padding-left: 20px;
          color: var(--muted-dark);
          line-height: 1.7;
        }

        .rules-list li {
          margin-bottom: 4px;
        }

        /* Setup Phase */
        .game-setup {
          max-width: 420px;
          width: 100%;
        }

        .setup-info h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .setup-info p {
          color: var(--muted-dark);
          font-size: 1.1rem;
          margin-bottom: 32px;
        }

        .hand-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .hand-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-height: 136px;
          padding: 32px 24px;
          border: 2px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1.1rem;
          font-weight: 850;
          transition: filter 0.2s, border-color 0.2s;
        }

        .hand-button:hover {
          border-color: var(--accent);
          background: color-mix(in oklch, var(--accent) 14%, var(--paper));
          filter: saturate(1.08);
        }

        .hand-icon {
          font-size: 3rem;
        }

        /* Hide Phase */
        .game-hide {
          max-width: 400px;
          width: 100%;
        }

        .hide-info h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 12px;
        }

        .hide-info p {
          color: var(--muted-dark);
          font-size: 1.1rem;
          margin-bottom: 32px;
        }

        /* Guess Phase */
        .game-guess {
          max-width: 420px;
          width: 100%;
        }

        .ai-clue-box {
          border: 1px solid color-mix(in oklch, var(--sky) 34%, transparent);
          border-radius: 8px;
          background: color-mix(in oklch, var(--sky) 9%, var(--paper));
          padding: 16px 20px;
          margin-bottom: 24px;
          text-align: left;
        }

        .ai-label {
          color: color-mix(in oklch, var(--ink) 70%, var(--sky));
          font-size: 0.85rem;
          font-weight: 850;
          margin-bottom: 6px;
        }

        .clue-text {
          color: var(--ink);
          font-size: 1.05rem;
          font-style: italic;
          margin: 0;
        }

        .live-comment {
          border-left: 3px solid color-mix(in oklch, var(--sky) 48%, transparent);
          color: var(--muted-dark);
          font-size: 0.95rem;
          line-height: 1.45;
          margin: 0 0 10px;
          padding-left: 10px;
        }

        .game-guess h2 {
          font-size: 2rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 8px;
        }

        .game-guess p {
          color: var(--muted-dark);
          font-size: 1.1rem;
          margin-bottom: 28px;
        }

        .choice-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .choice-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          min-height: 142px;
          padding: 36px 24px;
          border: 2px solid var(--paper-line);
          border-radius: 8px;
          background: var(--paper-2);
          color: var(--ink);
          font-size: 1.4rem;
          font-weight: 950;
          transition: filter 0.2s, border-color 0.2s;
        }

        .choice-button:hover {
          filter: saturate(1.08);
        }

        .left-choice:hover {
          border-color: var(--aqua);
          background: color-mix(in oklch, var(--teal) 16%, var(--paper));
        }

        .right-choice:hover {
          border-color: var(--coral);
          background: color-mix(in oklch, var(--stamp) 12%, var(--paper));
        }

        .choice-icon {
          font-size: 2.5rem;
        }

        /* Reveal Phase */
        .game-reveal {
          max-width: 400px;
          width: 100%;
        }

        .reveal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .reveal-header h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0;
        }

        .revealed-hand {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 48px;
          border-radius: 8px;
          gap: 8px;
        }

        .left-revealed {
          border: 2px solid var(--aqua);
          background: color-mix(in oklch, var(--teal) 16%, var(--paper));
        }

        .right-revealed {
          border: 2px solid var(--coral);
          background: color-mix(in oklch, var(--stamp) 12%, var(--paper));
        }

        .reveal-label {
          font-size: 0.9rem;
          color: var(--muted-dark);
        }

        .reveal-hand-name {
          font-size: 1.8rem;
          font-weight: 900;
        }

        /* Result Phase */
        .game-result {
          max-width: 420px;
          width: 100%;
        }

        .result-banner {
          font-size: 2.2rem;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .result-banner.correct {
          color: var(--leaf);
        }

        .result-banner.wrong {
          color: var(--coral);
        }

        .result-message {
          font-size: 1.2rem;
          color: var(--muted-dark);
          margin-bottom: 28px;
        }

        .scoreboard {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 28px;
          text-align: left;
        }

        .scoreboard h3 {
          margin: 0 0 14px;
          font-size: 1rem;
          color: var(--muted-dark);
        }

        .score-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          background: color-mix(in oklch, var(--paper) 72%, white);
        }

        .score-item.score-highlight {
          background: color-mix(in oklch, var(--accent) 18%, var(--paper));
          border: 1px solid color-mix(in oklch, var(--accent) 38%, transparent);
        }

        .player-name {
          font-weight: 600;
        }

        .player-score {
          font-weight: 900;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
        }

        /* Game Over Phase */
        .game-over {
          max-width: 420px;
          width: 100%;
        }

        .trophy-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .game-over h2 {
          font-size: 2.5rem;
          font-family: "Iowan Old Style", Charter, Georgia, serif;
          margin: 0 0 28px;
        }

        .final-scores {
          border: 1px solid var(--paper-line);
          border-radius: 8px;
          background: var(--panel-strong);
          padding: 20px;
          margin-bottom: 28px;
        }

        .final-score-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--paper-line);
        }

        .final-score-item:last-child {
          border-bottom: none;
        }

        .final-rank {
          font-weight: 900;
          color: color-mix(in oklch, var(--ink) 72%, var(--stamp));
          width: 30px;
        }

        .final-name {
          flex: 1;
          font-weight: 600;
          text-align: left;
        }

        .final-score {
          font-weight: 900;
          color: color-mix(in oklch, var(--ink) 72%, var(--teal));
        }

        .game-over-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .primary-button {
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

        .primary-button:hover {
          filter: saturate(1.08) brightness(1.01);
        }

        .secondary-button {
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

        .secondary-button:hover {
          background: color-mix(in oklch, var(--paper-2) 78%, white);
        }

        /* Mobile Responsive */
        @media (max-width: 680px) {
          .game-container {
            padding: 4px 0 0;
          }

          .game-header {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }

          .game-title {
            font-size: 1.5rem;
          }

          .hand-buttons,
          .choice-buttons {
            grid-template-columns: 1fr;
          }

          .hand-button,
          .choice-button {
            padding: 24px;
            min-height: 120px;
          }
        }
      `}</style>
    </div>
  );
}
