import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account } from "@/hooks/useAccounts";
import type { NewTransaction } from "@/hooks/useTransactions";
import {
  downloadTransactionsCsvTemplate,
  parseTransactionsCsv,
  type ParsedCsvTransaction,
} from "@/lib/transactionCsv";

interface ImportTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  maxRows?: number;
  onImport: (transactions: NewTransaction[]) => Promise<void>;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function ImportTransactionsModal({
  open,
  onOpenChange,
  accounts,
  maxRows,
  onImport,
}: ImportTransactionsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedCsvTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultAccount, setDefaultAccount] = useState("none");
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setRows([]);
    setFileName("");
    setSkipped(0);
    setError("");
    setImporting(false);
    setDefaultAccount("none");
  }, [open]);

  const exceedsLimit = maxRows !== undefined && rows.length > maxRows;
  const accountByName = useMemo(
    () => new Map(accounts.map((account) => [normalize(account.name), account.id])),
    [accounts],
  );

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");

    try {
      const result = parseTransactionsCsv(await file.text());
      setRows(result.transactions);
      setSkipped(result.skipped);
      setFileName(file.name);
    } catch (parseError) {
      setRows([]);
      setFileName(file.name);
      setError(parseError instanceof Error ? parseError.message : "Não foi possível ler o arquivo.");
    }
  };

  const handleImport = async () => {
    if (!rows.length || exceedsLimit) return;
    setImporting(true);
    setError("");

    try {
      await onImport(
        rows.map((row) => ({
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category: row.category,
          account_id:
            accountByName.get(normalize(row.accountName)) ||
            (defaultAccount === "none" ? null : defaultAccount),
        })),
      );
      onOpenChange(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Não foi possível importar.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar transações</DialogTitle>
          <DialogDescription>
            Envie um CSV do seu banco ou use o modelo do LifeFlow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center transition-colors hover:bg-muted/35"
          >
            <FileSpreadsheet className="mb-3 h-7 w-7 text-primary" />
            <span className="text-sm font-medium">
              {fileName || "Selecionar arquivo CSV"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Até 500 lançamentos por arquivo
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Compatível com formatos comuns de Nubank, Inter, BB, Itaú, Bradesco, Santander, Caixa e C6.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={downloadTransactionsCsvTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Baixar modelo
            </Button>
          </div>

          {rows.length > 0 && (
            <>
              <div className="space-y-1.5">
                <Label>Conta padrão</Label>
                <Select value={defaultAccount} onValueChange={setDefaultAccount}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem conta vinculada</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  A conta escrita no CSV tem prioridade quando o nome corresponder.
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div className="flex items-center justify-between bg-muted/35 px-3 py-2 text-xs">
                  <span className="font-medium">{rows.length} transações encontradas</span>
                  {skipped > 0 && <span className="text-muted-foreground">{skipped} linhas ignoradas</span>}
                </div>
                <div className="divide-y">
                  {rows.slice(0, 5).map((row, index) => (
                    <div key={`${row.date}-${row.description}-${index}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{row.description}</p>
                        <p className="text-[11px] text-muted-foreground">{row.date} · {row.category}</p>
                      </div>
                      <span className={row.type === "income" ? "font-semibold text-success" : "font-semibold text-destructive"}>
                        {row.type === "income" ? "+" : "-"}
                        {row.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {exceedsLimit && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Seu plano permite importar mais {maxRows} transações neste mês. Reduza o arquivo ou faça upgrade.
            </p>
          )}
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" disabled={!rows.length || exceedsLimit || importing} onClick={handleImport}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {importing ? "Importando..." : `Importar${rows.length ? ` ${rows.length}` : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
