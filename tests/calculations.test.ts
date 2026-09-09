import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getPlayerInvested,
  getPlayerCashOut,
  getPlayerProfitLoss,
  getChipDifference,
  getResults,
  getSettlementTransfers,
  getTotalMoneyIn,
} from "../lib/calculations";
import { validateSetup, validStore } from "../lib/validation";
import type { PokerGame } from "../types/game";
const game = (
  buyIns = [2, 3, 1, 2],
  finalChips = [60000, 30000, 50000, 20000],
): PokerGame => ({
  id: "test",
  createdAt: new Date().toISOString(),
  currency: "EUR",
  buyInAmount: 20,
  chipsPerBuyIn: 20000,
  status: "completed",
  players: buyIns.map((n, i) => ({
    id: String(i),
    name: ["Dat", "Alex", "John", "Tom"][i],
    buyIns: n,
    rebuyHistory: [],
    finalChips: finalChips[i],
  })),
});
test("normal profit: €40 invested and 50,000 chips returns €50 and +€10", () => {
  const g = game([2, 1], [50000, 10000]);
  assert.equal(getPlayerInvested(g, g.players[0]), 40);
  assert.equal(getPlayerCashOut(g, g.players[0]), 50);
  assert.equal(getPlayerProfitLoss(g, g.players[0]), 10);
});
test("zero chips is a complete loss", () => {
  const g = game([1, 1], [0, 40000]);
  assert.equal(getPlayerProfitLoss(g, g.players[0]), -20);
});
test("break even", () => {
  const g = game([2, 1], [40000, 20000]);
  assert.equal(getPlayerProfitLoss(g, g.players[0]), 0);
});
test("full example: multiple rebuys and balanced settlement", () => {
  const g = game();
  assert.equal(getTotalMoneyIn(g), 160);
  assert.deepEqual(
    getResults(g).map((p) => p.profitLoss),
    [20, -30, 30, -20],
  );
  assert.equal(getChipDifference(g), 0);
  assert.equal(
    getResults(g).reduce((s, p) => s + p.profitLoss, 0),
    0,
  );
  const transfers = getSettlementTransfers(g);
  assert.equal(
    transfers.reduce((s, t) => s + t.amount, 0),
    50,
  );
  assert.ok(transfers.length <= 3);
  for (const p of getResults(g)) {
    const received = transfers
      .filter((t) => t.to === p.name)
      .reduce((s, t) => s + t.amount, 0);
    const paid = transfers
      .filter((t) => t.from === p.name)
      .reduce((s, t) => s + t.amount, 0);
    assert.equal(received - paid, p.profitLoss);
  }
});
test("missing and extra chips block payment suggestions", () => {
  const g = game();
  g.players[0].finalChips = 58500;
  assert.equal(getChipDifference(g), -1500);
  assert.deepEqual(getSettlementTransfers(g), []);
  g.players[0].finalChips = 62000;
  assert.equal(getChipDifference(g), 2000);
});
test("decimal buy-in and half rebuy", () => {
  const g = game([1.5, 1], [30000, 20000]);
  g.buyInAmount = 12.5;
  assert.equal(getPlayerInvested(g, g.players[0]), 18.75);
  assert.equal(getTotalMoneyIn(g), 31.25);
  assert.equal(getPlayerProfitLoss(g, g.players[0]), 0);
});
test("rounding distributes leftover cents deterministically", () => {
  const g = game([1, 1, 1], [1, 1, 7]);
  g.buyInAmount = 0.01;
  g.chipsPerBuyIn = 3;
  assert.deepEqual(
    getResults(g).map((p) => p.cashOut),
    [0.01, 0, 0.02],
  );
  assert.equal(
    Math.round(getResults(g).reduce((s, p) => s + p.profitLoss, 0) * 100),
    0,
  );
});
test("half-cent investments still reconcile", () => {
  const g = game([1.5, 1.5], [3, 3]);
  g.buyInAmount = 0.01;
  g.chipsPerBuyIn = 2;
  assert.equal(getTotalMoneyIn(g), 0.04);
  assert.deepEqual(
    getResults(g).map((p) => p.profitLoss),
    [0, 0],
  );
});
test("large chip counts remain finite", () => {
  const g = game([1000, 1000], [1000000000000, 1000000000000]);
  g.chipsPerBuyIn = 1000000000;
  g.buyInAmount = 1000000;
  assert.equal(getChipDifference(g), 0);
  assert.equal(getTotalMoneyIn(g), 2000000000);
  assert.ok(getResults(g).every((p) => Number.isFinite(p.profitLoss)));
});
test("validates setup edge cases", () => {
  assert.ok(validateSetup(0, 20000, ["Dat", "Alex"]));
  assert.ok(validateSetup(Infinity, 20000, ["Dat", "Alex"]));
  assert.ok(validateSetup(20, 0, ["Dat", "Alex"]));
  assert.ok(validateSetup(20, 2.2, ["Dat", "Alex"]));
  assert.ok(validateSetup(20, 20000, ["Dat", " dat "]));
  assert.ok(validateSetup(20, 20000, ["", "Alex"]));
  assert.ok(validateSetup(20.001, 20000, ["Dat", "Alex"]));
  assert.equal(validateSetup(12.5, 20000, ["Dat", "Alex"]), null);
});
test("invalid persisted stores are rejected", () => {
  assert.equal(validStore({ version: 9 }), false);
  assert.equal(validStore(null), false);
});
