import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emptyStore,
  newGame,
  readStore,
  writeStore,
  STORAGE_KEY,
} from "../lib/storage";
import { validStore } from "../lib/validation";
test("storage saves active rebuys and partial settlement, retaining completed history", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  const store = structuredClone(emptyStore);
  store.active = newGame(20, 20000, "EUR", ["Dat", "Alex"]);
  store.active.players[0].buyIns = 1.5;
  store.active.players[0].rebuyHistory.push({
    id: "rebuy",
    amount: 0.5,
    timestamp: new Date().toISOString(),
  });
  writeStore(store);
  assert.equal(readStore().active?.players[0].buyIns, 1.5);
  store.active.status = "settlement";
  store.active.players[0].finalChips = 0;
  writeStore(store);
  assert.equal(readStore().active?.players[0].finalChips, 0);
  assert.equal(readStore().active?.players[1].finalChips, undefined);
  store.active.players[1].finalChips = 50000;
  store.active.status = "completed";
  store.history.push(store.active);
  store.active = null;
  writeStore(store);
  const next = readStore();
  next.active = newGame(12.5, 10000, "GBP", ["Dat", "Alex"]);
  writeStore(next);
  assert.equal(readStore().history.length, 1);
  assert.equal(readStore().active?.currency, "GBP");
  values.set(STORAGE_KEY, '{"broken":true}');
  assert.throws(readStore);
  assert.equal(values.get(STORAGE_KEY), '{"broken":true}');
});
test("unsupported currencies and malformed rebuy events fail validation safely", () => {
  const store = structuredClone(emptyStore);
  const g = newGame(20, 20000, "EUR", ["Dat", "Alex"]);
  assert.equal(
    validStore({
      ...store,
      settings: { ...store.settings, currency: "toString" },
    }),
    false,
  );
  assert.equal(
    validStore({ ...store, active: { ...g, currency: "constructor" } }),
    false,
  );
  assert.equal(
    validStore({
      ...store,
      active: {
        ...g,
        players: g.players.map((p) => ({ ...p, rebuyHistory: [null] })),
      },
    }),
    false,
  );
});
