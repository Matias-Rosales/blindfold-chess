# A ciegas

Puzzles de ajedrez para entrenar la visualización. Mirás la posición unos segundos, las piezas se ocultan (o se vuelven fichas) y tenés que resolver el puzzle de memoria.

Dos formas de entrenar, desde la pantalla de inicio:

- **Puzzles**: elegidos según tu rating de visualización, que sube o baja con cada puzzle.
- **Racha**: puzzles cada vez más difíciles. Un error y se termina. Una espiada por racha.

Cada usuario tiene su cuenta, con sus estadísticas y sus opciones (tiempo para memorizar, si las piezas desaparecen o se vuelven círculos, tema). Las cuentas se guardan en el navegador: no hay servidor.

Hecho con React, TypeScript, Vite, Tailwind CSS y chess.js. El diseño sigue al de la página de puzzles de Lichess.

## Uso

```bash
npm install
npm run dev
```

Otros comandos:

```bash
npm run build   # chequeo de tipos y build de producción
npm run lint
npm test        # pruebas de la lógica pura (src/lib)
```

## Base de puzzles

Sin datos generados, la app usa los 17 puzzles de ejemplo de `src/data/samples.ts`. Para usar la base de Lichess:

1. Descargá `lichess_db_puzzle.csv.zst` de https://database.lichess.org/#puzzles.
2. Generá los JSON. El script acepta el `.csv` o directamente el `.csv.zst` (Node 22.15 o más nuevo):

   ```bash
   npm run build:puzzles -- ruta/a/lichess_db_puzzle.csv.zst --per-bucket 150
   ```

   Se queda con los puzzles populares y muy jugados (`Popularity >= 70`, `NbPlays >= 300`), toma una muestra de cada tramo de 100 puntos de rating, descarta los que tengan jugadas ilegales y escribe `public/puzzles/<tramo>.json` más un `index.json`. Con `--seed` se cambia la muestra y con `--out` la carpeta de salida.

También se puede importar un CSV propio desde el navegador, en la caja "Base de puzzles".

## Créditos

- Puzzles: [base abierta de Lichess](https://database.lichess.org/#puzzles) (CC0).
- Piezas: set cburnett de [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett), copiado de [lila](https://github.com/lichess-org/lila), con licencia GPLv2+.
