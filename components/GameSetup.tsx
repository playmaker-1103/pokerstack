"use client";
import { useState } from "react";
import {
  Coins,
  Users,
  ArrowRight,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";
import type { CurrencyCode } from "@/types/game";
import { currencies, money, number } from "@/lib/calculations";
import { validateSetup } from "@/lib/validation";
import { Heading } from "./ui";
export function GameSetup({
  defaultCurrency,
  onStart,
}: {
  defaultCurrency: CurrencyCode;
  onStart: (
    amount: number,
    chips: number,
    currency: CurrencyCode,
    names: string[],
  ) => void;
}) {
  const [amount, setAmount] = useState("20");
  const [chips, setChips] = useState("20000");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [names, setNames] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [countText, setCountText] = useState("4");
  const a = Number(amount),
    c = Number(chips);
  const valid = !validateSetup(a, c, ["One", "Two"]);
  function count(n: number) {
    if (Number.isInteger(n) && n >= 2 && n <= 20) {
      setCountText(String(n));
      setNames((old) => Array.from({ length: n }, (_, i) => old[i] ?? ""));
    }
  }
  return (
    <>
      <Heading
        eyebrow="YOUR NEXT POKER NIGHT"
        title="Let’s set the table."
        description="Good company. Clear numbers. Every chip accounted for."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const issue = validateSetup(a, c, names);
          setError(issue ?? "");
          if (!issue) onStart(a, c, currency, names);
        }}
        className="setup-layout"
      >
        <div className="setup-fields">
          <section className="panel">
            <div className="section-title">
              <span className="section-icon">
                <Coins size={21} />
              </span>
              <div>
                <h2>Table stakes</h2>
                <p>Set the buy-in for your cash game.</p>
              </div>
              <span className="step">01</span>
            </div>
            <div className="fields two">
              <label htmlFor="buy-in">
                Buy-in amount
                <div className="input-unit">
                  <span>
                    {currency === "EUR"
                      ? "€"
                      : currency === "GBP"
                        ? "£"
                        : currency === "USD"
                          ? "$"
                          : "₫"}
                  </span>
                  <input
                    id="buy-in"
                    type="number"
                    inputMode="decimal"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <small>Cash value of one buy-in</small>
              </label>
              <label htmlFor="chips">
                Chips per buy-in
                <input
                  id="chips"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1000000000"
                  step="1"
                  required
                  value={chips}
                  onChange={(e) => setChips(e.target.value)}
                />
                <small>Starting stack for each player</small>
              </label>
            </div>
            <label htmlFor="currency" className="currency-field">
              Currency
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                {Object.entries(currencies).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel">
            <div className="section-title">
              <span className="section-icon">
                <Users size={21} />
              </span>
              <div>
                <h2>Who’s playing?</h2>
                <p>A seat for everyone at the table.</p>
              </div>
              <span className="step">02</span>
            </div>
            <div className="player-count">
              <label htmlFor="player-count">
                Number of players<small>2 to 20 players</small>
              </label>
              <div className="stepper">
                <button
                  type="button"
                  aria-label="Fewer players"
                  disabled={names.length <= 2}
                  onClick={() => count(names.length - 1)}
                >
                  −
                </button>
                <input
                  id="player-count"
                  type="number"
                  min="2"
                  max="20"
                  inputMode="numeric"
                  value={countText}
                  onChange={(e) => {
                    setCountText(e.target.value);
                    count(Number(e.target.value));
                  }}
                  onBlur={() => setCountText(String(names.length))}
                />
                <button
                  type="button"
                  aria-label="More players"
                  disabled={names.length >= 20}
                  onClick={() => count(names.length + 1)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="names-grid">
              {names.map((name, i) => (
                <label key={i} htmlFor={`name-${i}`}>
                  <span className="player-label">Player {i + 1}</span>
                  <div className="name-input">
                    <span className={`avatar avatar-${i % 4}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <input
                      id={`name-${i}`}
                      maxLength={40}
                      required
                      placeholder={
                        ["e.g. Dat", "e.g. Alex", "e.g. John", "e.g. Tom"][i] ??
                        "Player name"
                      }
                      value={name}
                      autoComplete="off"
                      onChange={(e) =>
                        setNames((old) =>
                          old.map((n, j) => (j === i ? e.target.value : n)),
                        )
                      }
                    />
                  </div>
                </label>
              ))}
            </div>
            <p className="hint">
              <CircleHelp size={15} /> Everyone starts with one buy-in. Add
              rebuys as you play.
            </p>
          </section>
        </div>
        <aside>
          <section className="summary-card">
            <div className="eyebrow">SESSION PREVIEW</div>
            <h2>Your table, at a glance.</h2>
            <div className="table-art" aria-hidden="true">
              <div className="table-rail">
                <span className="table-suit">♠</span>
                <span className="table-word">POKERSTACK</span>
              </div>
              {Array.from({ length: Math.min(names.length, 8) }, (_, i) => (
                <span
                  className="table-seat"
                  key={i}
                  style={
                    {
                      "--seat": i,
                      "--total": Math.min(names.length, 8),
                    } as React.CSSProperties
                  }
                >
                  {i + 1}
                </span>
              ))}
            </div>
            <dl className="summary-list">
              <div>
                <dt>Buy-in</dt>
                <dd>{valid ? money(a, currency) : "—"}</dd>
              </div>
              <div>
                <dt>Starting stack</dt>
                <dd>
                  {valid ? number(c) : "—"} <span>chips</span>
                </dd>
              </div>
              <div>
                <dt>Players</dt>
                <dd>{names.length}</dd>
              </div>
              <div>
                <dt>Value per chip</dt>
                <dd>
                  {valid
                    ? new Intl.NumberFormat("en-IE", {
                        style: "currency",
                        currency,
                        maximumFractionDigits: 9,
                      }).format(a / c)
                    : "—"}
                </dd>
              </div>
            </dl>
            <div className="initial-pot">
              <span>Starting money in</span>
              <strong>{valid ? money(a * names.length, currency) : "—"}</strong>
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary start-button" type="submit">
              Start game
              <ArrowRight size={19} />
            </button>
            <p className="saved-note">
              <ShieldCheck size={15} /> Automatically saved on this device
            </p>
          </section>
          <p className="aside-note">
            For the game around your table.
            <br />
            You play the hands. We’ll keep the count.
          </p>
        </aside>
      </form>
    </>
  );
}
