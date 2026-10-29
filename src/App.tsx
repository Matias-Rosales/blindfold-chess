import { Header } from "./components/Header";
import { HomeScreen } from "./components/HomeScreen";
import { TrainingScreen } from "./components/TrainingScreen";
import { GameProvider } from "./context/GameContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useHashRoute } from "./hooks/useHashRoute";

export default function App() {
  const route = useHashRoute();
  return (
    <SettingsProvider>
      <GameProvider>
        <Header route={route} />
        {route === "home" ? <HomeScreen /> : <TrainingScreen key={route} mode={route} />}
        <footer className="mx-auto max-w-[1400px] px-3 pb-6 text-center text-xs text-dim sm:px-5 dark:text-dim-dk">
          Puzzles de la{" "}
          <a href="https://database.lichess.org/#puzzles" className="underline" target="_blank" rel="noopener noreferrer">
            base abierta de Lichess
          </a>{" "}
          (CC0). Piezas cburnett de Colin M.L. Burnett (GPLv2+).
        </footer>
      </GameProvider>
    </SettingsProvider>
  );
}
