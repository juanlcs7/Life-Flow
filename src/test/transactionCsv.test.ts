import { describe, expect, it } from "vitest";
import { parseTransactionsCsv } from "@/lib/transactionCsv";

describe("parseTransactionsCsv", () => {
  it("lê CSV brasileiro com ponto e vírgula", () => {
    const result = parseTransactionsCsv(
      "data;descrição;valor;tipo;categoria;conta\n30/07/2026;Mercado;185,90;despesa;Alimentação;Nubank",
    );

    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-30",
      description: "Mercado",
      amount: 185.9,
      type: "expense",
      category: "Alimentação",
      accountName: "Nubank",
    });
  });

  it("infere o tipo pelo sinal do valor", () => {
    const result = parseTransactionsCsv(
      "date,description,amount\n2026-07-30,\"Compra, mercado\",-49.90\n2026-07-30,Pix recebido,100",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["expense", "income"]);
    expect(result.transactions[0].description).toBe("Compra, mercado");
  });

  it("lê o formato comum do Nubank", () => {
    const result = parseTransactionsCsv(
      "date,title,amount\n2026-07-28,Transferência recebida,350.00\n2026-07-29,Pagamento,-89.90",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["income", "expense"]);
    expect(result.transactions[0].description).toBe("Transferência recebida");
  });

  it("lê formatos de Inter e Banco do Brasil", () => {
    const inter = parseTransactionsCsv(
      "Data Lançamento;Histórico;Descrição;Valor;Saldo\n29/07/2026;Pix;Padaria;-25,50;100,00",
    );
    const bb = parseTransactionsCsv(
      "Data;Dependência Origem;Histórico;Data Balancete;Número documento;Valor\n29/07/2026;1234;Pix recebido;29/07/2026;10;500,00",
    );

    expect(inter.transactions[0]).toMatchObject({ description: "Padaria", type: "expense", amount: 25.5 });
    expect(bb.transactions[0]).toMatchObject({ description: "Pix recebido", type: "income", amount: 500 });
  });

  it("ignora o preâmbulo e combina crédito e débito do Bradesco", () => {
    const result = parseTransactionsCsv(
      ";Bradesco Net Empresa;;;\n;Extrato de: Agência: 1 Conta: 2;;;\nData;Lançamento;Dcto.;Crédito (R$);Débito (R$);Saldo (R$)\n29/07/2026;PIX RECEBIDO;10;230,00;;230,00\n30/07/2026;CARTAO;11;;-45,90;184,10",
    );

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions.map((item) => [item.type, item.amount])).toEqual([
      ["income", 230],
      ["expense", 45.9],
    ]);
  });

  it("entende D e C em uma coluna de débito/crédito", () => {
    const result = parseTransactionsCsv(
      "Data Mov.;Histórico;Valor;Débito/Crédito\n30/07/2026;Pagamento;75,00;D\n30/07/2026;Depósito;200,00;C",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["expense", "income"]);
  });

  it("rejeita arquivos sem as colunas necessárias", () => {
    expect(() => parseTransactionsCsv("data;categoria\n30/07/2026;Outros")).toThrow("colunas");
  });
});
