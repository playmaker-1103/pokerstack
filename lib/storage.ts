import type { Store } from "@/types/game";
import { validStore } from "./validation";
export const STORAGE_KEY = "pokerstack.v1";
export const emptyStore: Store = {
  version: 1,
  active: null,
  history: [],
  settings: { currency: "EUR", theme: "system", confirmRemoval: true },
};
export function readStore(): Store {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(emptyStore);
  const data: unknown = JSON.parse(raw);
  if (!validStore(data))
    throw new Error(
      "Saved data could not be read. Export a backup in Settings before resetting browser storage.",
    );
  return data;
}
export function writeStore(store: Store) {
  if (!validStore(store))
    throw new Error(
      "This change is outside the supported game limits. Please check the values and try again.",
    );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
export function newGame(
  amount: number,
  chips: number,
  currency: Store["settings"]["currency"],
  names: string[],
): NonNullable<Store["active"]> {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    currency,
    buyInAmount: amount,
    chipsPerBuyIn: chips,
    status: "active",
    players: names.map((name) => ({
      id: crypto.randomUUID(),
      name: name.trim(),
      buyIns: 1,
      rebuyHistory: [],
    })),
  };
}
