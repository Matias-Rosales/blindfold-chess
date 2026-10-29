import { Header } from "./components/Header";
import { HomeScreen } from "./components/HomeScreen";
import { LoginScreen } from "./components/LoginScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { TrainingScreen } from "./components/TrainingScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import { SettingsProvider } from "./context/SettingsContext";
import { useHashRoute, type Route } from "./hooks/useHashRoute";
import { userStateKey } from "./lib/storage";

function Screen({ route }: { route: Route }) {
  if (route === "home") return <HomeScreen />;
  if (route === "settings") return <SettingsScreen />;
  return <TrainingScreen key={route} mode={route} />;
}

/** Sin sesión se muestra el login; con sesión, la app con los datos de ese usuario. */
function Content({ route }: { route: Route }) {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  const storageKey = userStateKey(user.key);
  // Con `key` los providers se vuelven a montar (y a leer el storage) al cambiar de usuario.
  return (
    <SettingsProvider key={user.key} storageKey={storageKey}>
      <GameProvider key={user.key} storageKey={storageKey}>
        <Screen route={route} />
      </GameProvider>
    </SettingsProvider>
  );
}

export default function App() {
  const route = useHashRoute();
  return (
    <AuthProvider>
      <Header route={route} />
      <Content route={route} />
      <footer className="mx-auto max-w-[1400px] px-3 pb-6 text-center text-xs text-dim sm:px-5 dark:text-dim-dk">
        Puzzles de la{" "}
        <a href="https://database.lichess.org/#puzzles" className="underline" target="_blank" rel="noopener noreferrer">
          base abierta de Lichess
        </a>{" "}
        (CC0). Piezas cburnett de Colin M.L. Burnett (GPLv2+).
      </footer>
    </AuthProvider>
  );
}
