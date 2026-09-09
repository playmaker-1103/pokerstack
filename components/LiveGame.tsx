"use client";
import { useState } from "react";
import { Clock, Flag, Coins, Wallet, Users } from "lucide-react";
import type { PokerGame } from "@/types/game";
import {
  getTotalMoneyIn,
  getTotalBuyIns,
  getExpectedChipTotal,
  money,
  number,
} from "@/lib/calculations";
import { Heading, Confirm, Modal } from "./ui";
import { PlayerCard } from "./PlayerCard";
export function Statistics({ game }: { game: PokerGame }) {
  return (
    <div className="stats">
      <div className="stat money-stat">
        <span>
          <Wallet size={17} /> Total money in
        </span>
        <strong>{money(getTotalMoneyIn(game), game.currency)}</strong>
        <small>All buy-ins at this table</small>
      </div>
      <div className="stat">
        <span>
          <Coins size={17} /> Buy-ins
        </span>
        <strong>{number(getTotalBuyIns(game))}</strong>
        <small>{number(getExpectedChipTotal(game))} chips issued</small>
      </div>
      <div className="stat">
        <span>
          <Users size={17} /> Players
        </span>
        <strong>{game.players.length}</strong>
        <small>{money(game.buyInAmount, game.currency)} per buy-in</small>
      </div>
    </div>
  );
}
export function LiveGame({
  game,
  confirmRemoval,
  onChange,
}: {
  game: PokerGame;
  confirmRemoval: boolean;
  onChange: (fn: (g: PokerGame) => PokerGame) => void;
}) {
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    run: () => void;
    label: string;
  } | null>(null);
  const [rebuy, setRebuy] = useState<string | null>(null);
  const [amount, setAmount] = useState("1");
  const [error, setError] = useState("");
  function change(id: string, delta: number) {
    onChange((g) => ({
      ...g,
      players: g.players.map((p) =>
        p.id === id
          ? {
              ...p,
              buyIns: p.buyIns + delta,
              rebuyHistory: [
                ...p.rebuyHistory,
                {
                  id: crypto.randomUUID(),
                  amount: delta,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : p,
      ),
    }));
  }
  function undo(id: string) {
    onChange((g) => ({
      ...g,
      players: g.players.map((p) => {
        if (p.id !== id) return p;
        const last = p.rebuyHistory.at(-1);
        return last
          ? {
              ...p,
              buyIns: p.buyIns - last.amount,
              rebuyHistory: p.rebuyHistory.slice(0, -1),
            }
          : p;
      }),
    }));
  }
  return (
    <>
      <Heading
        eyebrow="THE TABLE IS OPEN"
        title="Keep the game flowing."
        description={`${money(game.buyInAmount, game.currency)} buy-in · ${number(game.chipsPerBuyIn)} chips per stack`}
        action={
          <span className="status live">
            <i /> LIVE GAME
          </span>
        }
      />
      <Statistics game={game} />
      <div className="section-bar">
        <h2>
          At the table{" "}
          <span className="count-badge">{game.players.length}</span>
        </h2>
        <span className="muted start-time">
          <Clock size={15} /> Started{" "}
          {new Date(game.createdAt).toLocaleTimeString("en-IE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
      <div className="player-grid">
        {game.players.map((p, i) => (
          <PlayerCard
            key={p.id}
            game={game}
            player={p}
            index={i}
            onAdd={() => change(p.id, 1)}
            onRemove={() => {
              const run = () => change(p.id, -1);
              if (confirmRemoval)
                setConfirm({
                  title: "Remove one buy-in?",
                  body: `This removes ${money(game.buyInAmount, game.currency)} from ${p.name}’s investment. You can undo this in their history.`,
                  run,
                  label: "Remove buy-in",
                });
              else run();
            }}
            onCustomRebuy={() => {
              setRebuy(p.id);
              setAmount("1");
              setError("");
            }}
            onUndo={() => undo(p.id)}
          />
        ))}
      </div>
      <div className="end-session">
        <div>
          <h3>Ready to count the chips?</h3>
          <p>End the session to calculate everyone’s result.</p>
        </div>
        <button
          className="button danger"
          onClick={() =>
            setConfirm({
              title: "End this poker session?",
              body: "You will now enter the final chip count for every player. You can return to the live game before saving results.",
              label: "End game",
              run: () => onChange((g) => ({ ...g, status: "settlement" })),
            })
          }
        >
          <Flag size={18} /> End game
        </button>
      </div>
      {confirm && (
        <Confirm
          title={confirm.title}
          body={confirm.body}
          label={confirm.label}
          onConfirm={confirm.run}
          onClose={() => setConfirm(null)}
        />
      )}
      {rebuy && (
        <Modal
          title={`Add rebuy for ${game.players.find((p) => p.id === rebuy)?.name}`}
          onClose={() => setRebuy(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(amount);
              const player = game.players.find((p) => p.id === rebuy)!;
              if (
                !Number.isFinite(n) ||
                n < 0.5 ||
                !Number.isInteger(n * 2) ||
                player.buyIns + n > 1000
              ) {
                setError(
                  "Use half or whole buy-ins, up to 1,000 total per player.",
                );
                return;
              }
              if (!Number.isInteger(n * game.chipsPerBuyIn)) {
                setError(
                  "This stack cannot be split into half buy-ins with whole chips. Use a whole buy-in.",
                );
                return;
              }
              change(rebuy, n);
              setRebuy(null);
            }}
          >
            <label htmlFor="rebuy-amount">
              Additional buy-ins
              <input
                autoFocus
                id="rebuy-amount"
                type="number"
                inputMode="decimal"
                value={amount}
                min="0.5"
                max="999"
                step="0.5"
                required
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <p className="hint">
              Half buy-ins are welcome. Enter 0.5 for half a stack.
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setRebuy(null)}
              >
                Cancel
              </button>
              <button className="button primary" type="submit">
                Add rebuy
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
