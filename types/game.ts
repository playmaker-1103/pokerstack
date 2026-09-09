export type CurrencyCode = "EUR" | "USD" | "GBP" | "VND";
export interface RebuyEvent {
  id: string;
  amount: number;
  timestamp: string;
}
export interface Player {
  id: string;
  name: string;
  buyIns: number;
  rebuyHistory: RebuyEvent[];
  finalChips?: number;
}
export interface PokerGame {
  id: string;
  createdAt: string;
  completedAt?: string;
  currency: CurrencyCode;
  buyInAmount: number;
  chipsPerBuyIn: number;
  status: "active" | "settlement" | "completed";
  players: Player[];
}
export interface Settings {
  currency: CurrencyCode;
  theme: "system" | "light" | "dark";
  confirmRemoval: boolean;
}
export interface Store {
  version: 1;
  active: PokerGame | null;
  history: PokerGame[];
  settings: Settings;
}
