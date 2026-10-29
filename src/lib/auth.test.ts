import { describe, expect, it } from "vitest";
import { checkPassword, createUserRecord, hashPassword, userKey, validatePassword, validateUsername } from "./auth";

describe("cuentas", () => {
  it("valida el nombre de usuario", () => {
    expect(validateUsername("ana")).toBeNull();
    expect(validateUsername("Juan_Perez-99")).toBeNull();
    expect(validateUsername("ab")).not.toBeNull();
    expect(validateUsername("con espacio")).not.toBeNull();
    expect(validateUsername("x".repeat(21))).not.toBeNull();
  });

  it("valida la contraseña y que coincida", () => {
    expect(validatePassword("1234", "1234")).toBeNull();
    expect(validatePassword("123", "123")).toMatch(/al menos/);
    expect(validatePassword("1234", "12345")).toMatch(/no coinciden/);
  });

  it("los nombres no distinguen mayúsculas", () => {
    expect(userKey("  Ana ")).toBe("ana");
  });

  it("guarda un hash, no la contraseña, y la verifica", async () => {
    const record = await createUserRecord("Ana", "secreta");
    expect(record.name).toBe("Ana");
    expect(record.hash).not.toContain("secreta");
    expect(record.hash).toHaveLength(64);
    expect(await checkPassword(record, "secreta")).toBe(true);
    expect(await checkPassword(record, "otra")).toBe(false);
  });

  it("la misma contraseña con distinta sal da distinto hash", async () => {
    expect(await hashPassword("abc", "00")).not.toBe(await hashPassword("abc", "01"));
    expect(await hashPassword("abc", "00")).toBe(await hashPassword("abc", "00"));
  });
});
