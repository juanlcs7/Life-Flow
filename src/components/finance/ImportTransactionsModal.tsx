import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, FileSpreadsheet, Loader2, Search, TrendingDown, TrendingUp, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Account } from "@/hooks/useAccounts";
import type { NewTransaction, Transaction } from "@/hooks/useTransactions";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import {
  downloadTransactionsCsvTemplate,
  filterTransactionPreview,
  findPersonalTransactionCategory,
  normalizeTransactionDescription,
  parseTransactionsFile,
  summarizeTransactions,
  transactionFingerprint,
  type ParsedCsvTransaction,
  type TransactionPreviewFilter,
} from "@/lib/transactionCsv";

interface ImportTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  transactions: Transaction[];
  maxRows?: number;
  categoryRules: Record<string, string>;
  onImport: (
    transactions: NewTransaction[],
    rules: Array<{ keyword: string; category: string }>,
  ) => Promise<void>;
}

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function ImportTransactionsModal({
  open,
  onOpenChange,
  accounts,
  transactions,
  maxRows,
  categoryRules,
  onImport,
}: ImportTransactionsModalProps) {
  const { categories: transactionCategories } = useTransactionCategories();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedCsvTransaction[]>([]);
  const [fileName, setFileName] = useState("");
  const [defaultAccount, setDefaultAccount] = useState("none");
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());
  const [previewSearch, setPreviewSearch] = useState("");
  const [previewFilter, setPreviewFilter] = useState<TransactionPreviewFilter>("all");
  const [bulkCategory, setBulkCategory] = useState("none");
  const [pendingRules, setPendingRules] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setRows([]);
    setFileName("");
    setSkipped(0);
    setError("");
    setImporting(false);
    setIsDragging(false);
    setExcludedRows(new Set());
    setPreviewSearch("");
    setPreviewFilter("all");
    setBulkCategory("none");
    setDefaultAccount("none");
    setPendingRules({});
  }, [open]);

  const accountByName = useMemo(
    () => new Map(accounts.map((account) => [normalize(account.name), account.id])),
    [accounts],
  );
  const preparedRows = useMemo(() => {
    const existingKeys = new Set(transactions.map(transactionFingerprint));
    const fileKeys = new Set<string>();

    return rows.map((row) => {
      const transaction: NewTransaction = {
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
        account_id:
          accountByName.get(normalize(row.accountName)) ||
          (defaultAccount === "none" ? null : defaultAccount),
      };
      const key = transactionFingerprint(transaction);
      const duplicate = existingKeys.has(key) || fileKeys.has(key);
      fileKeys.add(key);

      return { row, transaction, duplicate };
    });
  }, [accountByName, defaultAccount, rows, transactions]);
  const selectableRows = preparedRows.filter((item) => !item.duplicate);
  const importableRows = preparedRows.filter((item, index) => !item.duplicate && !excludedRows.has(index));
  const duplicateCount = preparedRows.length - selectableRows.length;
  const excludedCount = selectableRows.length - importableRows.length;
  const allSelected = selectableRows.length > 0 && excludedCount === 0;
  const importSummary = useMemo(
    () => summarizeTransactions(importableRows.map((item) => item.transaction)),
    [importableRows],
  );
  const visiblePreparedRows = useMemo(
    () => filterTransactionPreview(
      preparedRows.map((item, index) => ({ ...item, index })),
      previewSearch,
      previewFilter,
    ),
    [preparedRows, previewFilter, previewSearch],
  );
  const visibleEditableRows = visiblePreparedRows.filter(
    ({ duplicate, index }) => !duplicate && !excludedRows.has(index),
  );
  const exceedsLimit = maxRows !== undefined && importableRows.length > maxRows;
  const categoryOptions = useMemo(
    () => [...new Set([...transactionCategories.map((category) => category.name), ...rows.map((row) => row.category)])],
    [rows, transactionCategories],
  );

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    setExcludedRows(new Set());
    setPreviewSearch("");
    setPreviewFilter("all");
    setBulkCategory("none");
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["csv", "ofx"].includes(extension || "")) {
      setRows([]);
      setFileName(file.name);
      setError("Formato não aceito. Selecione um arquivo CSV ou OFX.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setRows([]);
      setFileName(file.name);
      setError("O arquivo ultrapassa o limite de 5 MB.");
      return;
    }

    try {
      const result = parseTransactionsFile(await file.text(), file.name);
      setRows(result.transactions.map((row) => ({
        ...row,
        category: findPersonalTransactionCategory(row.description, categoryRules) || row.category,
      })));
      setPendingRules({});
      setSkipped(result.skipped);
      setFileName(file.name);
    } catch (parseError) {
      setRows([]);
      setFileName(file.name);
      setError(parseError instanceof Error ? parseError.message : "Não foi possível ler o arquivo.");
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleImport = async () => {
    if (!importableRows.length || exceedsLimit) return;
    setImporting(true);
    setError("");

    try {
      await onImport(
        importableRows.map((item) => item.transaction),
        Object.entries(pendingRules)
          .filter(([keyword]) =>
            importableRows.some(({ row }) =>
              normalizeTransactionDescription(row.description) === keyword,
            ),
          )
          .map(([keyword, category]) => ({ keyword, category })),
      );
      onOpenChange(false);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Não foi possível importar.");
    } finally {
      setImporting(false);
    }
  };

  const updateCategory = (index: number, category: string) => {
    const keyword = normalizeTransactionDescription(rows[index].description);
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, category } : row,
      ),
    );
    setPendingRules((current) => ({ ...current, [keyword]: category }));
  };

  const toggleRow = (index: number) => {
    setExcludedRows((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleAllRows = () => {
    if (allSelected) {
      setExcludedRows(new Set(
        preparedRows.flatMap((item, index) => item.duplicate ? [] : [index]),
      ));
    } else {
      setExcludedRows(new Set());
    }
  };

  const applyCategoryToVisibleRows = () => {
    if (bulkCategory === "none" || visibleEditableRows.length === 0) return;

    const targetIndices = new Set(visibleEditableRows.map(({ index }) => index));
    setRows((current) =>
      current.map((row, index) =>
        targetIndices.has(index) ? { ...row, category: bulkCategory } : row,
      ),
    );
    setPendingRules((current) => {
      const next = { ...current };
      visibleEditableRows.forEach(({ row }) => {
        next[normalizeTransactionDescription(row.description)] = bulkCategory;
      });
      return next;
    });
    toast.success(
      `Categoria aplicada a ${visibleEditableRows.length} lançamento${visibleEditableRows.length === 1 ? "" : "s"}.`,
    );
    setBulkCategory("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar transações</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou OFX do seu banco.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.ofx,text/csv,application/x-ofx"
            className="hidden"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <button
            type="button"
            onClick={openFilePicker}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              handleFile(event.dataTransfer.files[0]);
            }}
            className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-5 py-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/20 hover:bg-muted/35"
            }`}
          >
            <FileSpreadsheet className="mb-3 h-7 w-7 text-primary" />
            <span className="text-sm font-medium">
              {isDragging ? "Solte o arquivo aqui" : fileName || "Selecionar arquivo CSV ou OFX"}
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              Arraste ou clique · até 500 lançamentos · máximo 5 MB
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Compatível com OFX e formatos CSV comuns de Nubank, Inter, BB, Itaú, Bradesco, Santander, Caixa e C6.
              Categorias ausentes são sugeridas pela descrição e suas correções ficam salvas.
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
                  A conta informada no arquivo tem prioridade quando o nome corresponder.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Receitas",
                    value: importSummary.income,
                    icon: TrendingUp,
                    color: "text-success",
                    background: "bg-success/10",
                  },
                  {
                    label: "Despesas",
                    value: importSummary.expenses,
                    icon: TrendingDown,
                    color: "text-destructive",
                    background: "bg-destructive/10",
                  },
                  {
                    label: "Saldo",
                    value: importSummary.balance,
                    icon: Wallet,
                    color: importSummary.balance >= 0 ? "text-success" : "text-destructive",
                    background: "bg-primary/10",
                  },
                ].map((item) => (
                  <div key={item.label} className="min-w-0 rounded-xl border border-border/70 bg-muted/15 p-2.5 sm:p-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${item.background}`}>
                        <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      </span>
                      <span className="truncate text-[10px] text-muted-foreground sm:text-xs">{item.label}</span>
                    </div>
                    <p className={`mt-2 truncate text-xs font-semibold sm:text-sm ${item.color}`}>
                      {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-xl border">
                <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/35 px-3 py-2 text-xs">
                  <div>
                    <span className="font-medium">{importableRows.length} selecionadas de {selectableRows.length} novas</span>
                    <span className="ml-2 text-muted-foreground">
                      {[duplicateCount && `${duplicateCount} repetidas`, skipped && `${skipped} inválidas`]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <button type="button" className="font-medium text-primary hover:underline" onClick={toggleAllRows}>
                    {allSelected ? "Desmarcar todas" : "Marcar todas"}
                  </button>
                </div>
                <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/15 p-2 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={previewSearch}
                      onChange={(event) => setPreviewSearch(event.target.value)}
                      placeholder="Buscar lançamento..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <select
                    aria-label="Filtrar lançamentos"
                    value={previewFilter}
                    onChange={(event) => setPreviewFilter(event.target.value as TransactionPreviewFilter)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-32"
                  >
                    <option value="all">Todos</option>
                    <option value="income">Receitas</option>
                    <option value="expense">Despesas</option>
                    <option value="duplicate">Repetidos</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2 border-t border-border/60 bg-muted/15 p-2 sm:flex-row">
                  <select
                    aria-label="Categoria para aplicar em lote"
                    value={bulkCategory}
                    onChange={(event) => setBulkCategory(event.target.value)}
                    className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="none">Escolha uma categoria para as linhas visíveis</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={bulkCategory === "none" || visibleEditableRows.length === 0}
                    onClick={applyCategoryToVisibleRows}
                  >
                    Aplicar a {visibleEditableRows.length}
                  </Button>
                </div>
                <div className="max-h-72 divide-y overflow-y-auto">
                  {visiblePreparedRows.map(({ row, duplicate, index }) => (
                    <div
                      key={`${row.date}-${row.description}-${index}`}
                      className={`grid grid-cols-[20px_minmax(0,1fr)] gap-2 px-3 py-2.5 text-xs sm:grid-cols-[20px_minmax(0,1fr)_140px_100px] sm:items-center ${
                        duplicate || excludedRows.has(index) ? "opacity-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Selecionar ${row.description}`}
                        checked={!duplicate && !excludedRows.has(index)}
                        disabled={duplicate}
                        onChange={() => toggleRow(index)}
                        className="h-4 w-4 rounded border-input accent-primary disabled:cursor-not-allowed"
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-medium">
                          {row.description}
                          {duplicate && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide">Já existe</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{row.date}</p>
                      </div>
                      <select
                        aria-label={`Categoria de ${row.description}`}
                        value={row.category}
                        disabled={duplicate || excludedRows.has(index)}
                        onChange={(event) => updateCategory(index, event.target.value)}
                        className="col-start-2 h-8 min-w-0 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed sm:col-start-auto"
                      >
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <span className={`col-start-2 text-right sm:col-start-auto ${row.type === "income" ? "font-semibold text-success" : "font-semibold text-destructive"}`}>
                        {row.type === "income" ? "+" : "-"}
                        {row.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </span>
                    </div>
                  ))}
                  {visiblePreparedRows.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm font-medium">Nenhum lançamento encontrado</p>
                      <p className="mt-1 text-xs text-muted-foreground">Tente outro termo ou filtro.</p>
                    </div>
                  )}
                </div>
              </div>
              {duplicateCount > 0 && (
                <p className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
                  <Check className="h-4 w-4 shrink-0" />
                  {duplicateCount} lançamento{duplicateCount === 1 ? "" : "s"} já existente{duplicateCount === 1 ? "" : "s"} será{duplicateCount === 1 ? "" : "ão"} ignorado{duplicateCount === 1 ? "" : "s"}.
                </p>
              )}
            </>
          )}

          {exceedsLimit && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Seu plano permite importar mais {maxRows} transações neste mês. Desmarque alguns lançamentos ou faça upgrade.
            </p>
          )}
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" disabled={!importableRows.length || exceedsLimit || importing} onClick={handleImport}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {importing ? "Importando..." : importableRows.length ? `Importar ${importableRows.length}` : "Nada novo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
