import { useEffect, useState } from "react";

export type Route = "home" | "rated" | "streak" | "settings";

const HASHES: Record<Route, string> = {
  home: "#/",
  rated: "#/puzzles",
  streak: "#/racha",
  settings: "#/configuracion",
};

function parse(hash: string): Route {
  if (hash === HASHES.rated) return "rated";
  if (hash === HASHES.streak) return "streak";
  if (hash === HASHES.settings) return "settings";
  return "home";
}

export const routeHref = (route: Route) => HASHES[route];

/** Navegación mínima con el hash de la URL: así funcionan el botón "atrás" y los enlaces. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
