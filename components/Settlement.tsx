"use client";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import type { PokerGame } from "@/types/game";
import {
  getChipDifference,
  getExpectedChipTotal,
  getEnteredChipTotal,
  number,
} from "@/lib/calculations";
import { MAX_CHIPS } from "@/lib/validation";
import { Heading, Confirm } from "./ui";
export function Settlement({
  game,
  onChange,
  onComplete,
}: {
  game: PokerGame;
  onChange: (fn: (g: PokerGame) => PokerGame) => void;
  onComplete: () => void;
}) {
  const [override, setOverride] = useState(false);
  const difference = getChipDifference(game);
  const filled = game.players.every((p) => p.finalChips !== undefined);
  return (
    <>
      <Heading
        eyebrow="SETTLEMENT"
        title="Every last chip."
        description="Count each player’s final stack. We’ll handle the rest."
      />
      <button
        className="text-button back-button"
        onClick={() => onChange((g) => ({ ...g, status: "active" }))}
      >
        <ArrowLeft size={17} /> Back to live game
      </button>
      <div className="settlement-layout">
        <section className="panel">
          <h2>Final chip counts</h2>
          <p className="muted">Include all chips, even if a player has zero.</p>
          <div className="chip-inputs">
            {game.players.map((p, i) => (
              <label
                className="chip-input-row"
                key={p.id}
                htmlFor={`final-${p.id}`}
              >
                <span className={`avatar avatar-${i % 4}`}>
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="chip-player">
                  {p.name}
                  <small>{number(p.buyIns)} buy-ins</small>
                </span>
                <span className="chip-field">
                  <input
                    id={`final-${p.id}`}
                    aria-label={`${p.name} final chips`}
                    inputMode="numeric"
                    type="text"
                    placeholder="0"
                    value={
                      p.finalChips === undefined ? "" : number(p.finalChips)
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replaceAll(",", "");
                      if (!/^\d*$/.test(raw) || Number(raw) > MAX_CHIPS) return;
                      onChange((g) => ({
                        ...g,
                        players: g.players.map((player) =>
                          player.id === p.id
                            ? {
                                ...player,
                                finalChips:
                                  raw === "" ? undefined : Number(raw),
                              }
                            : player,
                        ),
                      }));
                    }}
                  />
                  <small>chips</small>
                </span>
              </label>
            ))}
          </div>
        </section>
        <aside className="panel reconciliation">
          <h2>Chip check</h2>
          <dl className="summary-list">
            <div>
              <dt>Expected chips</dt>
              <dd>{number(getExpectedChipTotal(game))}</dd>
            </div>
            <div>
              <dt>Entered chips</dt>
              <dd>{number(getEnteredChipTotal(game))}</dd>
            </div>
            <div>
              <dt>Difference</dt>
              <dd>
                {difference > 0 ? "+" : ""}
                {number(difference)}
              </dd>
            </div>
          </dl>
          <div
            className={
              difference === 0 && filled ? "notice success" : "notice warning"
            }
          >
            {difference === 0 && filled ? (
              <CheckCircle2 size={21} />
            ) : (
              <TriangleAlert size={21} />
            )}
            <div>
              <b>
                {!filled
                  ? "A count for every player"
                  : difference === 0
                    ? "All chips accounted for"
                    : "Chip count does not balance"}
              </b>
              <p>
                {!filled
                  ? "Enter every final count, including zero."
                  : difference === 0
                    ? "The table balances. You’re ready to settle."
                    : `${number(Math.abs(difference))} ${difference < 0 ? "chips are missing" : "extra chips were entered"}. Check the counts before continuing.`}
              </p>
            </div>
          </div>
          <button
            disabled={!filled || difference !== 0}
            className="button primary full"
            onClick={onComplete}
          >
            Calculate results
            <ArrowRight size={18} />
          </button>
          {filled && difference !== 0 && (
            <button
              className="button secondary full"
              onClick={() => setOverride(true)}
            >
              Calculate anyway
            </button>
          )}
          <p className="hint">
            Results are saved to your history automatically.
          </p>
        </aside>
      </div>
      {override && (
        <Confirm
          title="Save unbalanced results?"
          body={`There are ${number(Math.abs(difference))} ${difference < 0 ? "missing" : "extra"} chips. The discrepancy will stay visible in results and payment suggestions will be unavailable.`}
          label="Calculate anyway"
          onConfirm={onComplete}
          onClose={() => setOverride(false)}
        />
      )}
    </>
  );
}
