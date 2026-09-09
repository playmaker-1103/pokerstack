import type { PokerGame, Store } from "@/types/game";
import { currencies } from "./calculations";
export const MAX_CHIPS = 1_000_000_000_000;
export function validateSetup(amount: number, chips: number, names: string[]) {
  if (
    !Number.isFinite(amount) ||
    amount < 0.01 ||
    amount > 1_000_000 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-6
  )
    return "Enter a buy-in from 0.01 to 1,000,000 with at most two decimals.";
  if (!Number.isSafeInteger(chips) || chips < 1 || chips > 1_000_000_000)
    return "Enter a whole chip count from 1 to 1,000,000,000.";
  if (names.length < 2 || names.length > 20)
    return "A table needs 2 to 20 players.";
  if (names.some((n) => !n.trim() || n.trim().length > 40))
    return "Give every player a name of 1 to 40 characters.";
  if (
    new Set(names.map((n) => n.trim().toLocaleLowerCase())).size !==
    names.length
  )
    return "Each player needs a unique name.";
  return null;
}
export function validGame(value: unknown): value is PokerGame {
  if (!value || typeof value !== "object") return false;
  const g = value as PokerGame;
  return (
    typeof g.id === "string" &&
    typeof g.createdAt === "string" &&
    Number.isFinite(Date.parse(g.createdAt)) &&
    Object.hasOwn(currencies, g.currency) &&
    ["active", "settlement", "completed"].includes(g.status) &&
    Array.isArray(g.players) &&
    !validateSetup(
      g.buyInAmount,
      g.chipsPerBuyIn,
      g.players.map((p) => (typeof p?.name === "string" ? p.name : "")),
    ) &&
    new Set(g.players.map((p) => p.id)).size === g.players.length &&
    g.players.every(
      (p) =>
        typeof p.id === "string" &&
        Number.isFinite(p.buyIns) &&
        p.buyIns >= 1 &&
        p.buyIns <= 1000 &&
        Number.isInteger(p.buyIns * 2) &&
        Array.isArray(p.rebuyHistory) &&
        p.rebuyHistory.every(
          (e) =>
            !!e &&
            typeof e.id === "string" &&
            Number.isFinite(e.amount) &&
            Number.isInteger(e.amount * 2) &&
            e.amount !== 0 &&
            typeof e.timestamp === "string" &&
            Number.isFinite(Date.parse(e.timestamp)),
        ) &&
        (p.finalChips === undefined
          ? g.status !== "completed"
          : Number.isSafeInteger(p.finalChips) &&
            p.finalChips >= 0 &&
            p.finalChips <= MAX_CHIPS),
    )
  );
}
export function validStore(v: unknown): v is Store {
  if (!v || typeof v !== "object") return false;
  const s = v as Store;
  return (
    s.version === 1 &&
    (s.active === null ||
      (validGame(s.active) && s.active.status !== "completed")) &&
    Array.isArray(s.history) &&
    s.history.every((g) => validGame(g) && g.status === "completed") &&
    !!s.settings &&
    Object.hasOwn(currencies, s.settings.currency) &&
    ["system", "light", "dark"].includes(s.settings.theme) &&
    typeof s.settings.confirmRemoval === "boolean"
  );
}
