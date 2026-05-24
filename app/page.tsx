"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { buildDiscovery } from "@/lib/globe/buildDiscovery";
import { selectCulturePack } from "@/lib/globe/selectCulture";
import { getGameById } from "@/lib/games/registry";
import type { GlobeDiscovery } from "@/types/ai";
import type { GameId, PartyVibe } from "@/types/culture";
import type { ProductPulse, RoomEventKind, RoomPlayer, RoomSnapshot } from "@/types/room";

type PlayableGameProps = {
  playerCount: number;
  onBack: () => void;
};

type RoomSessionResponse = {
  room?: RoomSnapshot;
  player?: RoomPlayer;
  error?: string;
};

const guestNameStorageKey = "worldplay.guestName";

const GolYaPooch = dynamic<PlayableGameProps>(() => import("@/components/games/GolYaPooch"), {
  ssr: false
});

const Daruma = dynamic<PlayableGameProps>(() => import("@/components/games/Daruma"), {
  ssr: false
});

const Loteria = dynamic<PlayableGameProps>(() => import("@/components/games/Loteria"), {
  ssr: false
});

const Adedonha = dynamic<PlayableGameProps>(() => import("@/components/games/Adedonha"), {
  ssr: false
});

const TheHat = dynamic<PlayableGameProps>(() => import("@/components/games/TheHat"), {
  ssr: false
});

const SpyImpostor = dynamic<PlayableGameProps>(() => import("@/components/games/SpyImpostor"), {
  ssr: false
});

const playableGameComponents: Partial<Record<GameId, ComponentType<PlayableGameProps>>> = {
  "gol-ya-pooch": GolYaPooch,
  daruma: Daruma,
  loteria: Loteria,
  adedonha: Adedonha,
  "the-hat": TheHat,
  "spy-impostor": SpyImpostor,
};

const vibes: { value: PartyVibe; label: string }[] = [
  { value: "funny", label: "Funny" },
  { value: "chaotic", label: "Chaotic" },
  { value: "cultural", label: "Cultural" },
  { value: "family", label: "Family" },
  { value: "strategic", label: "Strategic" },
  { value: "deep", label: "Deep" }
];

const demoSteps = [
  { id: "setup", label: "Setup" },
  { id: "stamp", label: "Stamp" },
  { id: "host", label: "Host" },
  { id: "round", label: "Round" },
  { id: "result", label: "Result" }
] as const;

type DemoStepId = (typeof demoSteps)[number]["id"];

export default function Home() {
  const [playerCount, setPlayerCount] = useState(4);
  const [vibe, setVibe] = useState<PartyVibe>("funny");
  const [discovery, setDiscovery] = useState<GlobeDiscovery | undefined>();
  const [spinning, setSpinning] = useState(false);
  const [activeGameId, setActiveGameId] = useState<GameId | undefined>();
  const [guestName, setGuestName] = useState("Guest Host");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<RoomSnapshot | undefined>();
  const [roomPlayer, setRoomPlayer] = useState<RoomPlayer | undefined>();
  const [roomStatus, setRoomStatus] = useState("Room server ready");
  const [productPulse, setProductPulse] = useState<ProductPulse | undefined>();

  const activeGame = useMemo(
    () => (activeGameId ? getGameById(activeGameId) : undefined),
    [activeGameId]
  );
  const ActiveGameComponent = activeGameId
    ? playableGameComponents[activeGameId]
    : undefined;
  const aiModeLabel = discovery
    ? discovery.fallback
      ? "AI Host: Simulation Mode"
      : `AI Host: ${discovery.aiProvider} Live`
    : "AI Host: Live-ready fallback";
  const currentStep: DemoStepId = activeGameId
    ? "round"
    : discovery
      ? "host"
      : spinning
        ? "stamp"
        : "setup";
  const currentStepIndex = demoSteps.findIndex((step) => step.id === currentStep);
  const hostName = discovery?.culture.hostName ?? "WorldPlay Host";
  const hostStatus = discovery
    ? discovery.fallback
      ? "Simulation Mode"
      : `${discovery.aiProvider} Live`
    : spinning
      ? "Finding a culture"
      : "Offline Ready";
  const hostSpeech = spinning
    ? "I am searching the table for a culture pack that fits this group."
    : discovery
      ? discovery.hostIntro
      : `Set ${playerCount} players and a vibe. I can run the demo locally even without live AI.`;
  const roomSelectedGame = room?.selectedGameId
    ? getGameById(room.selectedGameId)
    : undefined;

  async function refreshProductPulse() {
    try {
      const response = await fetch("/api/product/pulse");
      if (response.ok) {
        setProductPulse((await response.json()) as ProductPulse);
      }
    } catch {
      // Product pulse is decorative; gameplay must never depend on it.
    }
  }

  async function refreshRoom(code = room?.code) {
    if (!code) return;

    try {
      const response = await fetch(`/api/rooms/${code}`);
      if (response.ok) {
        setRoom((await response.json()) as RoomSnapshot);
      }
    } catch {
      setRoomStatus("Room sync paused");
    }
  }

  async function createPartyRoom() {
    setRoomStatus("Creating room...");
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: guestName, playerCount, vibe })
      });
      const payload = (await response.json()) as RoomSessionResponse;

      if (!response.ok || !payload.room || !payload.player) {
        setRoomStatus(payload.error ?? "Could not create room");
        return;
      }

      setRoom(payload.room);
      setRoomPlayer(payload.player);
      setJoinCode(payload.room.code);
      setRoomStatus("Room live on server");
      void refreshProductPulse();
    } catch {
      setRoomStatus("Room server unavailable");
    }
  }

  async function joinPartyRoom() {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setRoomStatus("Enter a room code");
      return;
    }

    setRoomStatus("Joining room...");
    try {
      const response = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerName: guestName })
      });
      const payload = (await response.json()) as RoomSessionResponse;

      if (!response.ok || !payload.room || !payload.player) {
        setRoomStatus(payload.error ?? "Room not found");
        return;
      }

      setRoom(payload.room);
      setRoomPlayer(payload.player);
      setJoinCode(payload.room.code);
      setPlayerCount(payload.room.playerCount);
      setVibe(payload.room.vibe);
      setRoomStatus("Joined room");
      void refreshProductPulse();
    } catch {
      setRoomStatus("Room server unavailable");
    }
  }

  async function recordRoomEvent(
    kind: RoomEventKind,
    summary: string,
    payload: Record<string, unknown>
  ) {
    if (!room) return;

    try {
      const response = await fetch(`/api/rooms/${room.code}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          summary,
          payload,
          playerId: roomPlayer?.id,
          playerName: roomPlayer?.name ?? guestName
        })
      });

      if (response.ok) {
        setRoom((await response.json()) as RoomSnapshot);
        void refreshProductPulse();
      }
    } catch {
      setRoomStatus("Room event queued locally");
    }
  }

  useEffect(() => {
    const savedName = window.localStorage.getItem(guestNameStorageKey);
    if (savedName) {
      setGuestName(savedName);
    }
    void refreshProductPulse();
  }, []);

  useEffect(() => {
    window.localStorage.setItem(guestNameStorageKey, guestName);
  }, [guestName]);

  useEffect(() => {
    if (!room?.code) return;

    const interval = window.setInterval(() => {
      void refreshRoom(room.code);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [room?.code]);

  async function handleSpin() {
    setSpinning(true);
    setActiveGameId(undefined);

    const culture = selectCulturePack({
      playerCount,
      vibe,
      previousCultureId: discovery?.culture.id
    });

    await new Promise((resolve) => setTimeout(resolve, 950));

    const nextDiscovery = await buildDiscovery({
      culture,
      playerCount,
      vibe,
      useAI: true
    });

    setDiscovery(nextDiscovery);
    setSpinning(false);

    const firstGame = nextDiscovery.recommendations[0];
    void recordRoomEvent(
      "spin_completed",
      `${roomPlayer?.name ?? guestName} spun ${nextDiscovery.culture.country}.`,
      {
        cultureId: nextDiscovery.culture.id,
        country: nextDiscovery.culture.country,
        gameId: firstGame?.gameId,
        provider: nextDiscovery.aiProvider,
        fallback: nextDiscovery.fallback,
        vibe,
        playerCount
      }
    );
  }

  function adjustPlayers(delta: number) {
    setPlayerCount((count) => Math.min(12, Math.max(2, count + delta)));
  }

  function handleStartGame(gameId: GameId) {
    setActiveGameId(gameId);
    const game = getGameById(gameId);
    void recordRoomEvent(
      "game_started",
      `${roomPlayer?.name ?? guestName} started ${game?.title ?? "a game"}.`,
      {
        gameId,
        cultureId: game?.cultureId,
        title: game?.title
      }
    );
  }

  return (
    <main className="page-shell">
      <div className="app-grid">
        <ol className="demo-progress" aria-label="Demo progress">
          {demoSteps.map((step, index) => (
            <li
              data-state={
                index < currentStepIndex
                  ? "complete"
                  : index === currentStepIndex
                    ? "active"
                    : "pending"
              }
              key={step.id}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step.label}
            </li>
          ))}
        </ol>

        <section className="product-modes" aria-label="Product modes">
          <article className="product-mode-card" data-primary="true">
            <span>Primary mode</span>
            <strong>Local Party</strong>
            <p>Same-device play for the group around the table.</p>
          </article>
          <article className="product-mode-card">
            <span>Party Room</span>
            <strong>Remote Room</strong>
            <p>Share a room code so friends can follow the spin.</p>
          </article>
          <article className="product-mode-card">
            <span>AI assist</span>
            <strong>AI Players</strong>
            <p>Fill empty seats, explain rules, and keep rounds moving.</p>
          </article>
        </section>

        <section className="setup-rail" aria-label="Spin setup">
          <div className="brand-lockup">
            <div className="mode-badge">{aiModeLabel}</div>
            <div>
              <h1>WorldPlay Host</h1>
              <p className="subhead">
                Spin the globe, land on a real culture pack, and let the local
                fallback host recommend games your group can start immediately.
              </p>
            </div>
          </div>

          <div className="control-panel">
            <div className="control-row">
              <label>Players</label>
              <div className="stepper" aria-label="Player count selector">
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Decrease players"
                  onClick={() => adjustPlayers(-1)}
                >
                  -
                </button>
                <div className="player-count">{playerCount} players</div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Increase players"
                  onClick={() => adjustPlayers(1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="control-row">
              <label>Vibe</label>
              <div className="vibe-grid" aria-label="Party vibe selector">
                {vibes.map((option) => (
                  <button
                    className="vibe-button"
                    data-active={vibe === option.value}
                    key={option.value}
                    type="button"
                    onClick={() => setVibe(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="spin-button"
              type="button"
              disabled={spinning}
              onClick={handleSpin}
            >
              {spinning ? "Spinning..." : "Spin the Globe"}
            </button>
          </div>

          <section className="party-panel" aria-label="Multiplayer party room">
            <div className="party-head">
              <div>
                <div className="host-kicker">Light Multiplayer</div>
                <h2>Party Room</h2>
              </div>
              <span className="status-pill">Postgres Server</span>
            </div>

            <div className="room-form">
              <label>
                Guest name
                <input
                  value={guestName}
                  maxLength={28}
                  onChange={(event) => setGuestName(event.target.value)}
                />
              </label>
              <label>
                Room code
                <input
                  value={joinCode}
                  maxLength={6}
                  placeholder="ABC123"
                  onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                />
              </label>
            </div>

            <div className="room-actions">
              <button type="button" className="secondary-button" onClick={createPartyRoom}>
                Create Room
              </button>
              <button type="button" className="secondary-button" onClick={joinPartyRoom}>
                Join
              </button>
            </div>

            <div className="room-status-row">
              <span>{roomStatus}</span>
              {room ? <strong>Code {room.code}</strong> : <strong>Guest mode</strong>}
            </div>

            <div className="room-code-card" data-empty={room ? "false" : "true"}>
              <span>{room ? "Share code" : "Room code"}</span>
              <strong>{room?.code ?? "Create"}</strong>
            </div>

            {room ? (
              <div className="room-live">
                <div className="player-strip" aria-label="Players in room">
                  {room.players.map((player) => (
                    <span data-color={player.color} key={player.id}>
                      {player.name}
                      {player.isHost ? " Host" : ""}
                    </span>
                  ))}
                </div>
                <div className="room-now">
                  <span>
                    {room.selectedCultureId
                      ? `Culture: ${room.selectedCultureId}`
                      : "Waiting for first spin"}
                  </span>
                  <span>
                    {roomSelectedGame
                      ? `Game: ${roomSelectedGame.title}`
                      : "Game not started"}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="pulse-head">
              <span>Product Pulse</span>
              <strong>Live demo state</strong>
            </div>
            <div className="product-pulse">
              <div>
                <span>Active rooms</span>
                <strong>{productPulse?.activeRooms ?? 0}</strong>
              </div>
              <div>
                <span>Players</span>
                <strong>{productPulse?.totalPlayers ?? 0}</strong>
              </div>
              <div>
                <span>Events</span>
                <strong>{productPulse?.totalEvents ?? 0}</strong>
              </div>
            </div>

            {productPulse ? (
              <p className="daily-challenge">
                Daily challenge: {productPulse.dailyChallenge.title} from{" "}
                {productPulse.dailyChallenge.country}
              </p>
            ) : null}
          </section>

          <aside className="host-card" aria-label="AI Host status" aria-live="polite">
            <div className="host-orb" aria-hidden="true">
              AI
            </div>
            <div className="host-card-copy">
              <div className="host-kicker">AI Host</div>
              <div className="host-card-head">
                <strong>{hostName}</strong>
                <span className="status-pill">{hostStatus}</span>
              </div>
              <p>{hostSpeech}</p>
            </div>
          </aside>
        </section>

        <section className="stage" aria-label="Globe discovery">
          <div className="globe-stage">
            <div className="pin" aria-hidden="true" />
            <div className="globe" data-spinning={spinning}>
              <div className="globe-label">
                {spinning
                  ? "Searching"
                  : discovery
                    ? discovery.culture.flag
                    : "Spin"}
              </div>
            </div>
          </div>

          <div className="arrival-panel">
            {discovery ? (
              <>
                <div className="arrival-top">
                  <div className="culture-title">
                    <h2>{discovery.culture.country}</h2>
                    <p>
                      {discovery.culture.greeting} {discovery.openingLine}
                    </p>
                  </div>
                  <div className="stamp">{discovery.culture.visualTheme.stampLabel}</div>
                </div>

                <div className="host-panel">
                  <div className="host-panel-head">
                    <div className="host-orb" aria-hidden="true">
                      {discovery.culture.hostName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="host-kicker">AI Host</div>
                      <div className="host-name">{discovery.culture.hostName}</div>
                    </div>
                    <span className="status-pill">{hostStatus}</span>
                  </div>
                  <p className="host-speech">{discovery.hostIntro}</p>
                  <p className="fact-line">{discovery.culturalFact}</p>
                </div>

                <div className="game-list" aria-label="Recommended games">
                  {discovery.recommendations.map((recommendation) => (
                    <article className="game-card" key={recommendation.gameId}>
                      <div>
                        <div className="game-badge">{recommendation.badge}</div>
                        <h3>{recommendation.title}</h3>
                        <p>{recommendation.reason}</p>
                      </div>
                      <button
                        className="start-button"
                        type="button"
                        onClick={() => handleStartGame(recommendation.gameId)}
                      >
                        Start Game
                      </button>
                    </article>
                  ))}
                </div>

                {ActiveGameComponent ? (
                  <div className="game-wrapper">
                    <ActiveGameComponent
                      playerCount={playerCount}
                      onBack={() => setActiveGameId(undefined)}
                    />
                  </div>
                ) : activeGame ? (
                  <div className="placeholder-game" role="status">
                    <strong>{activeGame.title}</strong> is registered as{" "}
                    {activeGame.implementationStatus}. Placeholder start works:
                    Claude can replace component key "{activeGame.componentKey}" with the
                    playable engine when ready.
                  </div>
                ) : null}
              </>
            ) : (
              <div className="empty-panel">
                <div className="status-pill">Local-first demo path</div>
                <p>
                  Pick a player count and vibe, then spin. The flow uses local
                  culture data, local recommendations, and fallback host lines.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
