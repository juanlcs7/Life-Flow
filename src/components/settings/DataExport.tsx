import { useState } from "react";
import { DatabaseBackup, Download, FileSpreadsheet, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { downloadFinancialCsv, downloadLifeFlowBackup } from "@/lib/dataExport";

type ExportType = "backup" | "finance" | null;

export function DataExport() {
  const { user } = useAuth();
  const [exporting, setExporting] = useState<ExportType>(null);

  const handleBackup = async () => {
    if (!user) return;
    setExporting("backup");
    try {
      await downloadLifeFlowBackup(user.id, user.email);
      toast.success("Backup baixado com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o backup");
    } finally {
      setExporting(null);
    }
  };

  const handleFinance = async () => {
    if (!user) return;
    setExporting("finance");
    try {
      await downloadFinancialCsv(user.id);
      toast.success("Relatório financeiro baixado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o relatório");
    } finally {
      setExporting(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
          <DatabaseBackup className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-500">Seus dados</p>
          <h3 className="mt-1 font-display text-lg font-semibold">Exportação e backup</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Baixe uma cópia dos seus registros ou leve as movimentações para uma planilha.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Backup completo</p>
          </div>
          <p className="mt-1.5 min-h-10 text-xs leading-relaxed text-muted-foreground">
            Perfil, finanças, tarefas, metas, hábitos, contatos, documentos e preferências em JSON.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full bg-background/50"
            onClick={handleBackup}
            disabled={exporting !== null}
          >
            {exporting === "backup" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Baixar backup
          </Button>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-success" />
            <p className="text-sm font-semibold">Planilha financeira</p>
          </div>
          <p className="mt-1.5 min-h-10 text-xs leading-relaxed text-muted-foreground">
            Receitas e despesas em CSV, pronto para abrir no Excel ou Google Planilhas.
          </p>
          <Button
            variant="outline"
            className="mt-4 w-full bg-background/50"
            onClick={handleFinance}
            disabled={exporting !== null}
          >
            {exporting === "finance" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Baixar CSV
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-500/[0.07] px-3 py-2.5 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>Os arquivos são montados no seu navegador e baixados diretamente no seu dispositivo.</span>
      </div>
    </Card>
  );
}
