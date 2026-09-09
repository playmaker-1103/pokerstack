"use client";
import { useEffect, useState, useCallback } from "react";
import type { Store } from "@/types/game";
import { emptyStore, readStore, writeStore, STORAGE_KEY } from "@/lib/storage";
export function useStore() {
  const [store, setStore] = useState<Store>(emptyStore);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const load = () => {
      try {
        setStore(readStore());
        setError("");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Local storage is unavailable.",
        );
      }
      setReady(true);
    };
    load();
    const sync = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) load();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const update = useCallback((fn: (s: Store) => Store) => {
    try {
      const next = fn(readStore());
      writeStore(next);
      setStore(next);
      setError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save. Free up browser storage and try again.",
      );
      return false;
    }
  }, []);
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        store.settings.theme === "system"
          ? query.matches
            ? "dark"
            : "light"
          : store.settings.theme;
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [store.settings.theme]);
  return { store, ready, error, update };
}
