"use client";
import { Plus, Minus, RotateCcw } from "lucide-react";
import type { Player, PokerGame } from "@/types/game";
import { money, number, getPlayerInvested } from "@/lib/calculations";
export function PlayerCard({
  game,
  player: p,
  index: i,
  onAdd,
  onRemove,
  onCustomRebuy,
  onUndo,
}: {
  game: PokerGame;
  player: Player;
  index: number;
  onAdd: () => void;
  onRemove: () => void;
  onCustomRebuy: () => void;
  onUndo: () => void;
}) {
  return (
    <article className="panel player-card">
      <div className="player-top">
        <span className={`avatar avatar-${i % 4}`}>
          {p.name.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <h3>{p.name}</h3>
          <span className="muted">Seat {String(i + 1).padStart(2, "0")}</span>
        </div>
        <span className="player-invested">
          {money(getPlayerInvested(game, p), game.currency)}
          <small>invested</small>
        </span>
      </div>
      <div className="buyin-row">
        <div>
          <span className="muted">Buy-ins</span>
          <strong>{number(p.buyIns)}</strong>
        </div>
        <div className="rebuy-stepper">
          <button
            className="icon-button"
            aria-label={`Remove one buy-in from ${p.name}`}
            disabled={p.buyIns < 2}
            onClick={onRemove}
          >
            <Minus size={20} />
          </button>
          <button
            className="icon-button add"
            aria-label={`Add one buy-in to ${p.name}`}
            disabled={p.buyIns > 999}
            onClick={onAdd}
          >
            <Plus size={21} />
          </button>
        </div>
      </div>
      <div className="chips-row">
        <span>{number(p.buyIns * game.chipsPerBuyIn)} chips bought</span>
        <button
          className="text-button"
          disabled={p.buyIns >= 1000}
          onClick={onCustomRebuy}
        >
          <Plus size={15} /> Add rebuy
        </button>
      </div>
      <details className="rebuy-history">
        <summary>
          Buy-in history <span>{p.rebuyHistory.length + 1}</span>
        </summary>
        <div className="event">
          <span>Initial buy-in</span>
          <b>+1</b>
        </div>
        {p.rebuyHistory.map((e) => (
          <div className="event" key={e.id}>
            <time>
              {new Date(e.timestamp).toLocaleTimeString("en-IE", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <b>
              {e.amount > 0 ? "+" : ""}
              {e.amount}
            </b>
          </div>
        ))}
        {p.rebuyHistory.length > 0 && (
          <button className="text-button" onClick={onUndo}>
            <RotateCcw size={14} /> Undo latest action
          </button>
        )}
      </details>
    </article>
  );
}
