import type { CurrencyCode, Player, PokerGame } from "@/types/game";
export const currencies: Record<CurrencyCode, string> = {
  EUR: "EUR (€)",
  USD: "USD ($)",
  GBP: "GBP (£)",
  VND: "VND (₫)",
};
export const number = (value: number) =>
  new Intl.NumberFormat("en-IE", { maximumFractionDigits: 3 }).format(value);
export const money = (value: number, currency: CurrencyCode, signed = false) =>
  new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: signed ? "exceptZero" : "auto",
  }).format(value);
export const getChipValue = (g: PokerGame) => g.buyInAmount / g.chipsPerBuyIn;
export const getTotalBuyIns = (g: PokerGame) =>
  g.players.reduce((s, p) => s + p.buyIns, 0);
export const getPlayerInvested = (g: PokerGame, p: Player) =>
  Math.round(Math.round(g.buyInAmount * 100) * p.buyIns) / 100;
export const getTotalMoneyIn = (g: PokerGame) =>
  g.players.reduce((s, p) => s + Math.round(getPlayerInvested(g, p) * 100), 0) /
  100;
export const getExpectedChipTotal = (g: PokerGame) =>
  getTotalBuyIns(g) * g.chipsPerBuyIn;
export const getEnteredChipTotal = (g: PokerGame) =>
  g.players.reduce((s, p) => s + (p.finalChips ?? 0), 0);
export const getChipDifference = (g: PokerGame) =>
  getEnteredChipTotal(g) - getExpectedChipTotal(g);
// Largest-remainder allocation keeps rounded payouts equal to the rounded total.
// Ties are resolved in original seating order for reproducibility.
export function getResults(g: PokerGame) {
  const denominator = BigInt(g.chipsPerBuyIn);
  const numerators = g.players.map(
    (p) => BigInt(p.finalChips ?? 0) * BigInt(Math.round(g.buyInAmount * 100)),
  );
  const cents = numerators.map((v) => Number(v / denominator));
  const sum = numerators.reduce((s, v) => s + v, 0n);
  const target =
    getChipDifference(g) === 0
      ? Math.round(getTotalMoneyIn(g) * 100)
      : Number((sum * 2n + denominator) / (denominator * 2n));
  let remainder = target - cents.reduce((s, v) => s + v, 0);
  const order = numerators
    .map((v, i) => ({ i, f: v % denominator }))
    .sort((a, b) => (a.f === b.f ? a.i - b.i : a.f > b.f ? -1 : 1));
  for (let i = 0; remainder > 0; i++, remainder--)
    cents[order[i % order.length].i]++;
  return g.players.map((p, i) => ({
    ...p,
    invested: getPlayerInvested(g, p),
    cashOut: cents[i] / 100,
    profitLoss: (cents[i] - Math.round(getPlayerInvested(g, p) * 100)) / 100,
  }));
}
export const getPlayerCashOut = (g: PokerGame, p: Player) =>
  getResults(g).find((r) => r.id === p.id)?.cashOut ?? 0;
export const getPlayerProfitLoss = (g: PokerGame, p: Player) =>
  getResults(g).find((r) => r.id === p.id)?.profitLoss ?? 0;
export function getSettlementTransfers(g: PokerGame) {
  const results = getResults(g);
  if (
    getChipDifference(g) !== 0 ||
    Math.round(results.reduce((s, p) => s + p.profitLoss, 0) * 100) !== 0
  )
    return [];
  const creditors = results
    .filter((p) => p.profitLoss > 0)
    .map((p) => ({ name: p.name, cents: Math.round(p.profitLoss * 100) }))
    .sort((a, b) => b.cents - a.cents);
  const debtors = results
    .filter((p) => p.profitLoss < 0)
    .map((p) => ({ name: p.name, cents: -Math.round(p.profitLoss * 100) }))
    .sort((a, b) => b.cents - a.cents);
  const transfers: { from: string; to: string; amount: number }[] = [];
  let i = 0,
    j = 0;
  while (i < debtors.length && j < creditors.length) {
    const cents = Math.min(debtors[i].cents, creditors[j].cents);
    transfers.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: cents / 100,
    });
    debtors[i].cents -= cents;
    creditors[j].cents -= cents;
    if (!debtors[i].cents) i++;
    if (!creditors[j].cents) j++;
  }
  return transfers;
}
