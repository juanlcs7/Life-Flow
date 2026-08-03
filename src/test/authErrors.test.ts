import { describe, expect, it } from "vitest";
import { translateAuthError } from "@/lib/authErrors";

describe("translateAuthError", () => {
  it("traduz credenciais inválidas", () => {
    expect(translateAuthError(new Error("Invalid login credentials"))).toBe("E-mail ou senha incorretos.");
  });

  it("explica o limite de envio de e-mails", () => {
    expect(translateAuthError(new Error("email rate limit exceeded"))).toContain("Aguarde alguns minutos");
  });

  it("não revela mensagens inesperadas do servidor", () => {
    expect(translateAuthError(new Error("internal detail"), "Falha segura")).toBe("Falha segura");
  });
});
