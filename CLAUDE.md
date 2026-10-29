# A ciegas: puzzles de ajedrez para entrenar la visualización

## Qué es el proyecto

Aplicación web de puzzles de ajedrez. El usuario ve la posición durante unos segundos y después tiene que resolver el puzzle de memoria. El tiempo lo elige el usuario: 3, 5 o 10 segundos, o sin ocultar.

Cuando se termina el tiempo pasa una de dos cosas, según la opción elegida:

- **Desaparecen** (estilo blindfold): no se ve ninguna pieza.
- **Se vuelven fichas** (estilo damas): se ven discos blancos y negros, así que se sabe dónde hay piezas pero no cuál es cada una.

Los puzzles salen de la base abierta de Lichess (licencia CC0).

Es un trabajo práctico para una materia de desarrollo web. La interfaz va en **castellano rioplatense** (voseo: "Elegí", "Memorizá", "Seguí").

## Prototipo de referencia

`docs/a-ciegas.html` es un prototipo funcional hecho en HTML, CSS y JavaScript sin frameworks, con chess.js 0.10.3. **Es la referencia de comportamiento.** El objetivo es reimplementarlo en React respetando su funcionamiento. No hay que copiar el código tal cual.

El **diseño visual no sigue al prototipo**: sigue a Lichess (ver la sección "Diseño").

## Stack

- React + TypeScript, con Vite como herramienta de build.
- Tailwind CSS para todos los estilos. No usar archivos CSS sueltos salvo lo mínimo que Tailwind no cubra.
- Vitest para las pruebas de la lógica pura (`npm test`).
- chess.js (versión 1.x) para las reglas: legalidad de jugadas, mate y notación SAN. **Solo valida, no dibuja.** El tablero es un componente propio.

Ojo, porque la API de chess.js 1.x cambió respecto de la 0.10.3 del prototipo:

- `isCheckmate()` reemplaza a `in_checkmate()`.
- `move()` **lanza un error** si la jugada es ilegal, en vez de devolver `null`. Hay que envolverlo en try/catch o validar antes contra `moves({ verbose: true })`.
- Siguen igual: `get(square)`, `turn()`, `fen()`, `undo()`, `moves({ verbose: true })`.

Antes de usar cualquier otra función, verificarla en la documentación de la versión instalada.

## Requisitos de la materia

Estos contenidos tienen que aparecer de forma clara en el código.

Obligatorios:

- **useState**: estado del puzzle (puzzle actual, posición, índice de jugada, piezas ocultas, casilla seleccionada, fallado o resuelto), preferencias, rating y racha.
- **map / filter**: `map` para las 64 casillas, el historial de jugadas y las opciones de temas. `filter` para elegir puzzles por tema o rating, y para buscar la jugada legal que coincide con las casillas de origen y destino.
- **Componentes y props**: ver la sección "Estructura de componentes".
- **Renderizado condicional**: pieza, ficha o nada en cada casilla; rating o racha según el modo; mensajes de acierto o error; botón "Nueva racha" solo al terminar; barra de progreso solo durante la importación.

También se usan:

- **useEffect**: temporizador de ocultamiento con limpieza (`clearTimeout`) al cambiar de puzzle; demora de la respuesta del rival; temporizador de "espiar"; persistencia en `localStorage`; carga inicial de puzzles.
- **Context**: `SettingsContext` para las preferencias y `GameContext` (o similar) para el rating y el conjunto de puzzles, así se evita el prop drilling.
- **fetch**: carga de los JSON de puzzles desde `public/puzzles/`.
- **Tailwind**: grilla del tablero (`grid grid-cols-8 aspect-square`), colores de casillas, transiciones de opacidad y desenfoque, modo oscuro con `dark:`.
- **TypeScript**: tipos para todo el dominio (ver "Tipos") e interfaces de props.
- **Responsive**: tablero y panel lado a lado en pantallas grandes, apilados en celular (`md:`, `lg:`). Las casillas tienen que ser cómodas de tocar con el dedo.
- **children**: componentes contenedores (`Card`, `Panel`), los Providers de los contextos y superposiciones sobre el tablero (temporizador, aviso de resuelto).

## Tipos

```ts
type Mode = "rated" | "streak";
type HideStyle = "blind" | "checkers";
type MemTime = 0 | 3 | 5 | 10; // 0 = no ocultar

interface Puzzle {
  id: string;
  fen: string;
  moves: string[];   // UCI, la primera es del rival
  rating: number;
  themes: string[];
}
```

## Datos: base de puzzles de Lichess

La base se descarga de https://database.lichess.org/#puzzles. Viene como CSV comprimido con Zstandard (`.csv.zst`), tiene varios millones de filas y pesa del orden de 1 GB descomprimida. Las columnas son:

```
PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
```

- **FEN**: la posición **antes** de la jugada del rival.
- **Moves**: jugadas en UCI separadas por espacio (`e2e4`, `e7e8q`). La primera la hace el rival; después alternan usuario y rival. El usuario juega los índices impares (1, 3, 5…).
- **Themes**: etiquetas separadas por espacio (`mateIn2 fork short`).
- **Popularity** va de −100 a 100. **NbPlays** es la cantidad de veces que se jugó.

### Preprocesamiento

El CSV completo no va al navegador. Hay que crear `scripts/build-puzzles.ts` (Node) que:

1. Lea el CSV descomprimido línea por línea, en streaming.
2. Filtre por calidad: `Popularity >= 70` y `NbPlays >= 300`.
3. Agrupe por tramos de 100 puntos de rating y tome una muestra por tramo (reservoir sampling).
4. Escriba un JSON por tramo en `public/puzzles/` (por ejemplo `1200.json`) más un `index.json` con los tramos disponibles y la cantidad de puzzles de cada uno.

Formato compacto de cada puzzle en el JSON: `[id, fen, moves, rating, themes]`, con `moves` y `themes` como strings separados por espacio. Al cargarlos se convierten a `Puzzle`.

Además, en `src/data/samples.ts` va un conjunto chico de puzzles de ejemplo para desarrollo y como respaldo si falla el fetch. Se pueden tomar los 17 del prototipo (ids `ej01` a `ej17`), que están verificados.

## Pantallas

La navegación usa el hash de la URL (`useHashRoute`), sin librería de rutas, así funcionan el botón "atrás" y los enlaces:

- **Inicio** (`#/`): título, dos tarjetas para elegir cómo entrenar (**Puzzles** con rating y **Racha**, cada una con su dato: rating o récord), un "Cómo funciona" en tres pasos y la caja de la base de puzzles (con la importación de CSV).
- **Puzzles** (`#/puzzles`) y **Racha** (`#/racha`): pantalla de entrenamiento. Desde la barra superior (`ModeTabs`) se puede pasar de un modo al otro.

La sesión de entrenamiento se vuelve a montar (con `key`) cuando cambian el modo, el conjunto de puzzles o el tema. El primer puzzle se elige al montar, no en un efecto.

## Flujo de un puzzle

1. Cargar la FEN. El color del usuario es el contrario al que mueve en la FEN, y el tablero se orienta hacia el usuario.
2. Mostrar la posición unos 800 ms y jugar automáticamente `moves[0]`, la jugada del rival, resaltando origen y destino.
3. Arrancar la cuenta regresiva de memorización con una barra que se vacía sobre el tablero. Al terminar, ocultar las piezas según el estilo. El usuario puede jugar antes de que se oculten.
4. El usuario juega tocando la casilla de origen y después la de destino. No hay opción de escribir la jugada.
   - Con las piezas visibles, solo se pueden seleccionar piezas propias.
   - Con las piezas ocultas, se puede seleccionar cualquier casilla, para no revelar información.
5. **Jugada correcta**: coincide con `moves[i]`. Si es la última jugada del puzzle, también se acepta cualquier jugada que dé mate.
   - Si no es la última, el rival responde con `moves[i+1]` después de unos 550 ms. Se resalta la jugada y se informa en notación ("Las negras jugaron Rh8").
   - Si es la última, el puzzle queda resuelto y se revelan las piezas.
6. **Jugada incorrecta**: se marca la casilla en rojo unos 900 ms y no se aplica.
   - Con las piezas ocultas, una jugada **ilegal** también cuenta como error, porque significa que el usuario recordaba mal la posición.
   - Con las piezas visibles, una jugada ilegal solo muestra un aviso.
7. **Coronación**: si la solución indica una pieza, usar esa; si no, dama.
8. **Ver solución**: cuenta como error, revela las piezas y reproduce las jugadas restantes cada 750 ms.
9. **Espiar**: revela las piezas durante 2 s.
   - En el modo con rating, cuenta como error.
   - En el modo racha hay **una espiada disponible por racha**.

## Modos

- **Puzzles (rated)**: el usuario tiene un rating propio de visualización (inicial 1500). Se elige un puzzle al azar con rating a ±150 del usuario, y si no hay se amplía el rango de a 150. Se evitan los últimos 40 puzzles jugados.
  - Fórmula tipo Elo: `esperado = 1 / (1 + 10^((ratingPuzzle - ratingUsuario) / 400))` y `delta = K * (resultado - esperado)`.
  - `K` vale 48 en los primeros 20 puzzles y 28 después. Rating mínimo: 100.
  - Un puzzle cuenta una sola vez: si ya falló, resolverlo después no suma.
  - Se muestra el delta del último puzzle (+34 / −30).
- **Racha (streak)**: una escalera de dificultad que nunca baja. El objetivo arranca en 600 y sube 50 con cada puzzle; cada puzzle se elige al azar entre los que tienen rating en [objetivo, objetivo + 100) y no son más fáciles que el anterior. Si no hay ninguno (con ratings muy altos quedan pocos) se toma el siguiente más difícil, y la cola termina cuando no quedan más. El método del prototipo (ordenar todo por rating + 0 a 180 al azar) no sirve con 150 puzzles por tramo: la dificultad casi no sube. Un error termina la racha y se muestra cuál era la jugada correcta. Al resolver uno, el siguiente pasa solo después de unos 1100 ms. Se guarda el récord.

## Notación

- Mostrar las jugadas en notación castellana: C caballo, A alfil, T torre, D dama, R rey (por ejemplo "Txe8#").

## Persistencia (localStorage)

Todas las lecturas y escrituras van en try/catch, y la app tiene que funcionar si el storage está vacío o no disponible.

- `aciegas.state.v1`: rating, cantidad de puzzles jugados, récord de racha, preferencias (tiempo, estilo, tema, mostrar nombres de casillas), modo e ids recientes.
- `aciegas.pool.v1`: puzzles importados por el usuario, si se mantiene la opción de importar un CSV propio desde el navegador. El límite práctico es de unos 6000 puzzles, porque el localStorage tiene unos 5 MB.

## Estructura de componentes

- `App`: providers, barra superior y elección de pantalla.
- `Header` / `ModeTabs`: logo y pestañas de modo, como el menú de Lichess.
- `HomeScreen`: pantalla de inicio con las dos formas de entrenar.
- `TrainingScreen`: espera a que carguen los puzzles y monta la sesión (tablero, herramientas y datos).
- `Board`: props `fen`, `orientation`, `hidden`, `hideStyle`, `selected`, `lastMove`, `wrongSquare`, `onSquareClick` y `children` para superposiciones.
- `Square`: nombre, color claro u oscuro, pieza, resaltados y coordenadas en el borde.
- `Piece`: tipo, color y modo de visualización (pieza, ficha u oculta). La pieza y la ficha están siempre en el DOM y se alternan por clases, para que la transición se anime.
- `TimerBar`: segundos y clave de reinicio.
- `SolvedOverlay`: aviso de resuelto o fallado que aparece y se desvanece sobre el tablero.
- `ScoreCard`, `PuzzleInfo` (id, rating y temas, que se muestran recién al terminar), `MessageBox`, `MoveLog`, `ActionButtons` (Espiar, Ver solución, Siguiente o Nueva racha).
- `SettingsPanel`: tiempo, estilo, selector de temas con nombres en castellano y opción de mostrar el nombre de cada casilla.
- `ImportPanel`: origen de los puzzles e importación de un CSV propio.
- `Card` / `Panel` / `Button`: contenedores y botón base.

La mecánica de un puzzle está en el hook `usePuzzle` y las reglas de cada modo (rating, cola y espiada de la racha) en `useTraining`.

## Estructura de carpetas sugerida

```
src/
  components/      Board, Square, Piece, TimerBar, paneles…
  context/         SettingsContext, GameContext
  hooks/           usePuzzle, useTraining, useHashRoute
  lib/             notación (SAN ↔ castellano), rating, selección de puzzles
  data/            samples.ts, nombres de temas en castellano
  types.ts
public/puzzles/    JSON por tramo de rating (generados por el script)
public/pieces/     set de piezas cburnett de Lichess (GPLv2+)
docs/              prototipo de referencia
scripts/           build-puzzles.ts
```

## Diseño

Copiar el aspecto de la página de puzzles de **Lichess**, sin usar su nombre ni su logo:

- **Distribución**: barra superior con logo y pestañas en mayúsculas. En el entrenamiento, en pantallas grandes: datos a la izquierda (rating o racha, puzzle, opciones, base), tablero al centro y herramientas a la derecha (mensaje con ícono grande, jugadas, input y botones). En tablet, tablero a la izquierda y el resto a la derecha. En celular todo apilado y el tablero de borde a borde.
- **Colores** (tokens en `src/index.css`, cada uno con su par `-dk` para el modo oscuro):
  - Fondo con el degradé cálido de arriba de Lichess. Cajas blancas (oscuro `#262421`) con sombra suave.
  - Azul `#1b78d0` / `#3692e7` para las acciones principales y la barra de tiempo, verde `#629924` para acierto, rojo `#cc3333` para error y naranja `#d85000` para la racha.
  - Tablero marrón: claras `#f0d9b5` y oscuras `#b58863`. Última jugada `rgba(155,199,0,.41)`, selección `rgba(20,85,30,.5)` y puntos de destino como en chessground (solo con las piezas a la vista, para no revelar nada).
  - Coordenadas dentro del tablero: números en la última columna y letras en la última fila, con el color de la casilla opuesta.
- **Tipografía**: Noto Sans desde Google Fonts, con fuentes del sistema como respaldo.
- **Botones**: el principal es azul con texto en mayúsculas ("Seguir entrenando", "Nueva racha") y los secundarios tienen el degradé gris de Lichess.
- **Piezas**: set **cburnett**, el predeterminado de Lichess, en `public/pieces/cburnett/`. Autor: Colin M.L. Burnett. Licencia: GPLv2+. Mantener la atribución en el pie de página.
- **Modo oscuro**: completo, según `prefers-color-scheme`, con variantes `dark:`.
- **Ocultamiento**: las piezas se desvanecen con opacidad y desenfoque y las fichas aparecen escalando. Respetar `prefers-reduced-motion`.
- **Accesibilidad**: foco visible con el teclado y casillas como `<button>` con `aria-label` igual al nombre de la casilla.

## Convenciones

- Componentes funcionales con hooks. Nada de componentes de clase.
- Nombres de código en inglés y textos de interfaz en castellano rioplatense.
- Lógica pura (notación, rating, selección de puzzles) en `src/lib/`, sin depender de React, para poder probarla aparte.
