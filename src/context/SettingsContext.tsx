import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LS_STATE, patchState, readJson } from "../lib/storage";
import type { Settings } from "../types";

const DEFAULT_SETTINGS: Settings = {
  memTime: 5,
  hideStyle: "blind",
  theme: "",
  showSquareNames: false,
};

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

function loadSettings(): Settings {
  const saved = readJson<{ settings?: Partial<Settings> }>(LS_STATE)?.settings;
  const merged = { ...DEFAULT_SETTINGS, ...saved };
  // Por si el storage tiene valores viejos o inválidos.
  if (![0, 3, 5, 10].includes(merged.memTime)) merged.memTime = DEFAULT_SETTINGS.memTime;
  if (merged.hideStyle !== "blind" && merged.hideStyle !== "checkers") merged.hideStyle = "blind";
  return merged;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    patchState({ settings });
  }, [settings]);

  const updateSettings = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings tiene que usarse dentro de <SettingsProvider>");
  return ctx;
}
