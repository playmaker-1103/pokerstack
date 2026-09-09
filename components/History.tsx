"use client";
import { useState } from "react";
import { ArrowUpRight, Trash2, CalendarDays } from "lucide-react";
import type { PokerGame } from "@/types/game";
import { getTotalMoneyIn, money } from "@/lib/calculations";
import { Heading, Empty, Confirm } from "./ui";
export function History({
  games,
  onView,
  onDelete,
  onClear,
  onNew,
}: {
  games: PokerGame[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onNew: () => void;
}) {
  const [remove, setRemove] = useState<string | null>(null);
  return (
    <>
      <Heading
        eyebrow="YOUR POKER JOURNAL"
        title="Nights worth remembering."
        description="Every session, saved right here on this device."
        action={
          games.length > 0 ? (
            <button
              className="button secondary"
              onClick={() => setRemove("all")}
            >
              <Trash2 size={16} /> Clear history
            </button>
          ) : undefined
        }
      />
      {!games.length ? (
        <Empty
          title="A clean slate."
          action={
            <button className="button primary" onClick={onNew}>
              Go to game
              <ArrowUpRight size={17} />
            </button>
          }
        >
          Your completed sessions will appear here. Get your friends together
          and start the first one.
        </Empty>
      ) : (
        <div className="history-list">
          {games.map((g) => (
            <article className="panel history-card" key={g.id}>
              <div className="history-date">
                <CalendarDays size={22} />
                <div>
                  <h3>
                    {new Date(g.createdAt).toLocaleDateString("en-IE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <span className="muted">
                    {g.players.length} players ·{" "}
                    {money(g.buyInAmount, g.currency)} buy-in
                  </span>
                </div>
              </div>
              <div className="history-total">
                <strong>{money(getTotalMoneyIn(g), g.currency)}</strong>
                <small>Total money in</small>
              </div>
              <button className="button secondary" onClick={() => onView(g.id)}>
                View results
                <ArrowUpRight size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={`Delete session from ${new Date(g.createdAt).toLocaleDateString("en-IE")}`}
                onClick={() => setRemove(g.id)}
              >
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
      )}
      {remove && (
        <Confirm
          title={
            remove === "all"
              ? "Permanently clear all history?"
              : "Delete this session?"
          }
          body={
            remove === "all"
              ? `All ${games.length} completed sessions will be permanently deleted from this device. This cannot be undone. Your active game is kept.`
              : "This completed session will be permanently deleted. This cannot be undone."
          }
          label={remove === "all" ? "Delete all history" : "Delete session"}
          onConfirm={() => (remove === "all" ? onClear() : onDelete(remove))}
          onClose={() => setRemove(null)}
        />
      )}
    </>
  );
}
