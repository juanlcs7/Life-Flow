import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  it("lê mensagens de erros comuns", () => {
    expect(getErrorMessage(new Error("Falha comum"), "Fallback")).toBe("Falha comum");
  });

  it("lê erros estruturados retornados pelo Supabase", () => {
    expect(
      getErrorMessage(
        { message: "Coluna não encontrada", details: "contact_id", hint: "Recarregue o schema" },
        "Fallback",
      ),
    ).toBe("Coluna não encontrada contact_id Recarregue o schema");
  });

  it("usa o fallback para valores desconhecidos", () => {
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
