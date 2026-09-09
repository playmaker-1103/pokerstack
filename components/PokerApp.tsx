"use client";
import { useEffect, useState } from "react";
import {
  Spade,
  History as HistoryIcon,
  Settings as SettingsIcon,
  ShieldCheck,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { newGame } from "@/lib/storage";
import type { PokerGame } from "@/types/game";
import { getTotalMoneyIn, money } from "@/lib/calculations";
import { Brand, Heading, Confirm } from "./ui";
import { GameSetup } from "./GameSetup";
import { LiveGame } from "./LiveGame";
import { Settlement } from "./Settlement";
import { Results } from "./Results";
import { History } from "./History";
import { Settings } from "./Settings";
export default function PokerApp() {
  const { store, ready, error, update } = useStore();
  const [route, setRoute] = useState("game");
  const [resumed, setResumed] = useState(false);
  const [discard, setDiscard] = useState(false);
  useEffect(() => {
    const sync = () => setRoute(location.hash.slice(1) || "game");
    sync();
    addEventListener("hashchange", sync);
    return () => removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then((registration) => {
          const urls = performance
            .getEntriesByType("resource")
            .map((r) => r.name);
          registration.active?.postMessage({ type: "CACHE_ASSETS", urls });
        })
        .catch(() => {
          /* Core local storage still works if service workers are blocked. */
        });
  }, []);
  function navigate(value: string) {
    location.hash = value;
    setRoute(value);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function changeGame(fn: (g: PokerGame) => PokerGame) {
    update((s) => (s.active ? { ...s, active: fn(s.active) } : s));
  }
  function complete() {
    let completedId: string | null = null;
    const saved = update((s) => {
      const g = s.active;
      if (
        !g ||
        g.status !== "settlement" ||
        g.players.some((p) => p.finalChips === undefined)
      )
        return s;
      const done: PokerGame = {
        ...g,
        status: "completed",
        completedAt: new Date().toISOString(),
      };
      completedId = done.id;
      return {
        ...s,
        active: null,
        history: [done, ...s.history.filter((h) => h.id !== done.id)],
      };
    });
    if (saved && completedId) navigate(`results/${completedId}`);
  }

  const tab =
    route === "history" || route.startsWith("results/")
      ? "history"
      : route === "settings"
        ? "settings"
        : "game";
  const result = route.startsWith("results/")
    ? store.history.find((g) => g.id === route.slice(8))
    : undefined;
  return (
    <div className="app-shell">
      <header className="topbar">
        <a href="#game" aria-label="PokerStack game">
          <Brand />
        </a>
        <nav aria-label="Main navigation">
          {[
            { id: "game", label: "Game", Icon: Spade },
            { id: "history", label: "History", Icon: HistoryIcon },
            { id: "settings", label: "Settings", Icon: SettingsIcon },
          ].map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className={tab === id ? "active" : ""}
              aria-current={tab === id ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
              {id === "game" && store.active && <i className="nav-dot" />}
            </a>
          ))}
        </nav>
        <span className="local-badge">
          <ShieldCheck size={15} /> Private by design
        </span>
      </header>
      <main id="main">
        {error && (
          <div className="notice warning" role="alert">
            <div>
              <b>We couldn’t save or load your data.</b>
              <p>{error}</p>
              <p>
                Changes are paused until storage is available. Existing data has
                not been overwritten.
              </p>
            </div>
          </div>
        )}
        {!ready ? (
          <div className="loading" aria-live="polite">
            Getting your table ready…
          </div>
        ) : route === "settings" ? (
          <Settings
            settings={store.settings}
            onChange={(settings) => update((s) => ({ ...s, settings }))}
          />
        ) : route === "history" ? (
          <History
            games={store.history}
            onView={(id) => navigate(`results/${id}`)}
            onNew={() => navigate("game")}
            onDelete={(id) =>
              update((s) => ({
                ...s,
                history: s.history.filter((g) => g.id !== id),
              }))
            }
            onClear={() => update((s) => ({ ...s, history: [] }))}
          />
        ) : result ? (
          <Results
            game={result}
            hasActive={!!store.active}
            onNew={() => navigate("game")}
            onRematch={() => {
              if (store.active) return;
              const g = newGame(
                result.buyInAmount,
                result.chipsPerBuyIn,
                result.currency,
                result.players.map((p) => p.name),
              );
              if (update((s) => ({ ...s, active: g }))) {
                setResumed(true);
                navigate("game");
              }
            }}
          />
        ) : store.active && !resumed ? (
          <>
            <Heading
              eyebrow="WELCOME BACK"
              title="Your table is waiting."
              description="Pick up right where poker night left off."
            />
            <section className="panel recovery">
              <span className="status live">
                <i /> GAME IN PROGRESS
              </span>
              <h2>
                {store.active.players.length} friends. One unfinished game.
              </h2>
              <p>
                Started{" "}
                {new Date(store.active.createdAt).toLocaleString("en-IE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <strong className="recovery-total">
                {money(getTotalMoneyIn(store.active), store.active.currency)}
              </strong>
              <p>currently in the game</p>
              <div className="recovery-players">
                {store.active.players.map((p, i) => (
                  <span
                    className={`avatar avatar-${i % 4}`}
                    key={p.id}
                    title={p.name}
                  >
                    {p.name.slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              <button
                className="button primary full"
                onClick={() => setResumed(true)}
              >
                Continue game
                <ArrowRight size={18} />
              </button>
              <button className="text-button" onClick={() => setDiscard(true)}>
                <Trash2 size={15} /> Discard game
              </button>
            </section>
          </>
        ) : store.active?.status === "active" ? (
          <LiveGame
            game={store.active}
            confirmRemoval={store.settings.confirmRemoval}
            onChange={changeGame}
          />
        ) : store.active?.status === "settlement" ? (
          <Settlement
            game={store.active}
            onChange={changeGame}
            onComplete={complete}
          />
        ) : (
          <GameSetup
            defaultCurrency={store.settings.currency}
            onStart={(amount, chips, currency, names) => {
              const g = newGame(amount, chips, currency, names);
              if (update((s) => ({ ...s, active: g }))) {
                setResumed(true);
                navigate("game");
              }
            }}
          />
        )}
      </main>
      <footer className="footer">
        <span>
          <Spade size={14} /> Made for your poker night.
        </span>
        <span>
          <ShieldCheck size={14} /> Saved locally. Always private.
        </span>
      </footer>
      {discard && (
        <Confirm
          title="Discard this game?"
          body="All buy-ins and chip counts for this unfinished session will be permanently removed. Your completed history will be kept."
          label="Discard game"
          onConfirm={() => update((s) => ({ ...s, active: null }))}
          onClose={() => setDiscard(false)}
        />
      )}
    </div>
  );
}
