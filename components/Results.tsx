"use client";
import {
  ArrowRight,
  Trophy,
  RotateCcw,
  Plus,
  CheckCircle2,
  TriangleAlert,
} from "lucide-react";
import type { PokerGame } from "@/types/game";
import {
  getResults,
  getSettlementTransfers,
  getChipDifference,
  money,
  number,
} from "@/lib/calculations";
import { Heading } from "./ui";
import { Statistics } from "./LiveGame";
export function Results({
  game,
  onNew,
  onRematch,
  hasActive,
}: {
  game: PokerGame;
  onNew: () => void;
  onRematch: () => void;
  hasActive: boolean;
}) {
  const results = getResults(game).sort((a, b) => b.profitLoss - a.profitLoss);
  const transfers = getSettlementTransfers(game);
  const profits =
    results.reduce(
      (s, p) => s + Math.max(0, Math.round(p.profitLoss * 100)),
      0,
    ) / 100;
  const losses =
    results.reduce(
      (s, p) => s + Math.min(0, Math.round(p.profitLoss * 100)),
      0,
    ) / 100;
  const net = Math.round((profits + losses) * 100) / 100;
  const difference = getChipDifference(game);
  return (
    <>
      <Heading
        eyebrow="GAME RESULTS"
        title="That’s a wrap."
        description={`${new Date(game.createdAt).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })} · A good night, all accounted for.`}
        action={
          <span className="status">
            <CheckCircle2 size={14} /> COMPLETED
          </span>
        }
      />
      <Statistics game={game} />
      {difference !== 0 && (
        <div className="notice warning">
          <TriangleAlert size={22} />
          <div>
            <b>This session is unbalanced</b>
            <p>
              {number(Math.abs(difference))}{" "}
              {difference < 0 ? "missing" : "extra"} chips. Net result:{" "}
              {money(net, game.currency, true)}. Payment suggestions are
              unavailable.
            </p>
          </div>
        </div>
      )}
      <div className="section-bar">
        <h2>
          <Trophy size={21} /> The final standings
        </h2>
        <span className="muted">Ranked by profit / loss</span>
      </div>
      <section className="panel leaderboard">
        {results.map((p, i) => (
          <article className="result-row" key={p.id}>
            <span className={`rank ${i === 0 ? "first" : ""}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="result-name">
              <h3>{p.name}</h3>
              <small>
                {number(p.finalChips ?? 0)} final chips · {number(p.buyIns)}{" "}
                buy-ins
              </small>
            </div>
            <div className="result-detail">
              <span>Invested</span>
              <b>{money(p.invested, game.currency)}</b>
            </div>
            <div className="result-detail">
              <span>Cash out</span>
              <b>{money(p.cashOut, game.currency)}</b>
            </div>
            <div
              className={`result-profit ${p.profitLoss > 0 ? "positive" : p.profitLoss < 0 ? "negative" : "muted"}`}
            >
              <strong>{money(p.profitLoss, game.currency, true)}</strong>
              <small>
                {p.profitLoss > 0
                  ? "Profit"
                  : p.profitLoss < 0
                    ? "Loss"
                    : "Break even"}
              </small>
            </div>
          </article>
        ))}
      </section>
      <section className="verification">
        <div>
          <span>Total profit</span>
          <b className="positive">{money(profits, game.currency, true)}</b>
        </div>
        <div>
          <span>Total loss</span>
          <b className="negative">{money(losses, game.currency, true)}</b>
        </div>
        <div>
          <span>Net result</span>
          <b>
            {money(net, game.currency)}{" "}
            {net === 0 && <CheckCircle2 size={16} />}
          </b>
        </div>
      </section>
      {difference === 0 && (
        <details className="panel payments" open>
          <summary>
            Settle up <span>{transfers.length} suggested payments</span>
          </summary>
          <p className="muted">
            For direct settlement between players. Skip these if the table’s
            bank pays cash-outs.
          </p>
          {transfers.length ? (
            transfers.map((t, i) => (
              <div className="payment-row" key={i}>
                <span>
                  {t.from}
                  <ArrowRight size={16} />
                  {t.to}
                </span>
                <strong>{money(t.amount, game.currency)}</strong>
              </div>
            ))
          ) : (
            <p>Everyone broke even. No payments needed.</p>
          )}
          <p className="hint">
            Matches the largest balances first to keep transfers simple.
          </p>
        </details>
      )}
      <div className="result-actions">
        <button
          className="button secondary"
          onClick={onRematch}
          disabled={hasActive}
        >
          <RotateCcw size={17} /> Rematch
        </button>
        <button className="button primary" onClick={onNew}>
          <Plus size={18} />
          {hasActive ? "Continue active game" : "New game"}
        </button>
      </div>
      {hasActive && (
        <p className="hint">
          Finish or discard your active game before starting a rematch.
        </p>
      )}
    </>
  );
}
