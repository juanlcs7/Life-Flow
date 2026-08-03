import { FileSpreadsheet, History, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TransactionImport } from "@/hooks/useTransactionImports";

interface ImportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imports: TransactionImport[];
  isLoading: boolean;
}

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function ImportHistoryModal({
  open,
  onOpenChange,
  imports,
  isLoading,
}: ImportHistoryModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de importações
          </DialogTitle>
          <DialogDescription>
            Arquivos importados e quantidades registradas na sua conta.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : imports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center">
            <FileSpreadsheet className="mx-auto mb-3 h-8 w-8 text-muted-foreground/60" />
            <p className="text-sm font-medium">Nenhuma importação registrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Os próximos arquivos CSV e OFX aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {imports.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" title={item.file_name}>{item.file_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {format(parseISO(item.imported_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-md border border-border bg-background/60 px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">
                    {item.file_type}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Lançamentos</p>
                    <p className="mt-0.5 font-semibold">{item.transaction_count}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3" />Receitas</p>
                    <p className="mt-0.5 font-semibold text-success">{currency(item.total_income)}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1 text-muted-foreground"><TrendingDown className="h-3 w-3" />Despesas</p>
                    <p className="mt-0.5 font-semibold text-destructive">{currency(item.total_expense)}</p>
                  </div>
                </div>
                {item.status === "undone" && (
                  <p className="mt-3 border-t border-border/60 pt-2 text-[11px] font-medium text-muted-foreground">
                    Importação desfeita
                    {item.undone_at ? ` em ${format(parseISO(item.undone_at), "dd/MM/yyyy, HH:mm")}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
