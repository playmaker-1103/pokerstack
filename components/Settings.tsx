"use client";
import {
  Download,
  Smartphone,
  ShieldCheck,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import type { Settings as Preferences } from "@/types/game";
import { currencies } from "@/lib/calculations";
import { STORAGE_KEY } from "@/lib/storage";
import { Heading } from "./ui";
export function Settings({
  settings,
  onChange,
}: {
  settings: Preferences;
  onChange: (s: Preferences) => void;
}) {
  function download() {
    const blob = new Blob([localStorage.getItem(STORAGE_KEY) ?? "{}"], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokerstack-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <Heading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your table. Your way."
        description="A few preferences to make poker night feel right."
      />
      <div className="settings-layout">
        <section className="panel">
          <h2>Preferences</h2>
          <div className="setting-row">
            <label htmlFor="default-currency">
              Default currency<small>Used when you set up a new game.</small>
            </label>
            <select
              id="default-currency"
              value={settings.currency}
              onChange={(e) =>
                onChange({
                  ...settings,
                  currency: e.target.value as Preferences["currency"],
                })
              }
            >
              {Object.entries(currencies).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-row vertical">
            <div>
              Appearance<small>Comfortable in daylight or late at night.</small>
            </div>
            <div className="theme-options">
              {(
                [
                  { id: "system", Icon: Monitor },
                  { id: "light", Icon: Sun },
                  { id: "dark", Icon: Moon },
                ] as const
              ).map(({ id, Icon }) => (
                <button
                  key={id}
                  aria-pressed={settings.theme === id}
                  className={settings.theme === id ? "selected" : ""}
                  onClick={() => onChange({ ...settings, theme: id })}
                >
                  <Icon size={20} />
                  {id[0].toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-row">
            <label htmlFor="confirm-removal">
              Confirm buy-in removal
              <small>Double-check before reducing a player’s buy-ins.</small>
            </label>
            <input
              id="confirm-removal"
              className="switch"
              type="checkbox"
              checked={settings.confirmRemoval}
              onChange={(e) =>
                onChange({ ...settings, confirmRemoval: e.target.checked })
              }
            />
          </div>
        </section>
        <div>
          <section className="panel install-card">
            <Smartphone size={26} />
            <h2>A seat on your home screen.</h2>
            <p>Keep PokerStack one tap away.</p>
            <ol>
              <li>Open this website in Safari.</li>
              <li>
                Tap <b>Share</b>.
              </li>
              <li>
                Select <b>Add to Home Screen</b>.
              </li>
              <li>
                Tap <b>Add</b> and you’re ready.
              </li>
            </ol>
            <p className="hint">
              On Android, choose Install app from your browser menu.
            </p>
          </section>
          <section className="panel privacy-card">
            <ShieldCheck size={24} />
            <h3>Yours, and only yours.</h3>
            <p>
              Games are stored in this browser. No account, no server, no
              tracking. Clearing browser data removes your sessions. Home-screen
              apps may use separate storage.
            </p>
            <button className="button secondary full" onClick={download}>
              <Download size={17} /> Export data backup
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
