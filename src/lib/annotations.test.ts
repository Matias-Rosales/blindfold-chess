import { describe, expect, it } from "vitest";
import { brushFor, squareAt, squareCenter, toggleShape, type Shape } from "./annotations";

const mods = (m: Partial<{ shiftKey: boolean; altKey: boolean; ctrlKey: boolean; metaKey: boolean }> = {}) => ({
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...m,
});

describe("marcas en el tablero", () => {
  it("elige el color según las teclas, como en Lichess", () => {
    expect(brushFor(mods())).toBe("green");
    expect(brushFor(mods({ shiftKey: true }))).toBe("red");
    expect(brushFor(mods({ altKey: true }))).toBe("blue");
    expect(brushFor(mods({ shiftKey: true, altKey: true }))).toBe("yellow");
  });

  it("agrega, reemplaza el color y borra al repetir", () => {
    const arrow: Shape = { from: "e2", to: "e4", brush: "green" };
    let shapes = toggleShape([], arrow);
    expect(shapes).toEqual([arrow]);
    shapes = toggleShape(shapes, { ...arrow, brush: "red" });
    expect(shapes).toEqual([{ ...arrow, brush: "red" }]);
    shapes = toggleShape(shapes, { ...arrow, brush: "red" });
    expect(shapes).toEqual([]);
  });

  it("una flecha a la misma casilla es un círculo", () => {
    const shapes = toggleShape([], { from: "d4", to: "d4", brush: "blue" });
    expect(shapes).toEqual([{ from: "d4", brush: "blue" }]);
    expect(toggleShape(shapes, { from: "d4", brush: "blue" })).toEqual([]);
  });

  it("las flechas de ida y de vuelta son distintas", () => {
    const shapes = toggleShape([{ from: "a1", to: "h8", brush: "green" }], { from: "h8", to: "a1", brush: "green" });
    expect(shapes).toHaveLength(2);
  });

  it("ubica casillas según la orientación", () => {
    expect(squareAt(0.01, 0.01, "w")).toBe("a8");
    expect(squareAt(0.99, 0.99, "w")).toBe("h1");
    expect(squareAt(0.01, 0.01, "b")).toBe("h1");
    expect(squareAt(1.2, 0.5, "w")).toBeNull();
    expect(squareCenter("a1", "w")).toEqual({ x: 0.5, y: 7.5 });
    expect(squareCenter("a1", "b")).toEqual({ x: 7.5, y: 0.5 });
  });
});
