import { Loader2, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useTransactionCategoryRules,
  type TransactionCategoryRule,
} from "@/hooks/useTransactionCategoryRules";
import { TRANSACTION_CATEGORIES } from "@/lib/transactionCsv";

export function CategoryRulesSettings() {
  const {
    rules,
    isLoading,
    isSaving,
    saveCategoryRules,
    deleteCategoryRule,
  } = useTransactionCategoryRules();

  const updateRule = async (rule: TransactionCategoryRule, category: string) => {
    try {
      await saveCategoryRules([{ keyword: rule.keyword, category }]);
      toast.success("Categoria atualizada.");
    } catch {
      toast.error("Não foi possível atualizar a regra.");
    }
  };

  const removeRule = async (keyword: string) => {
    try {
      await deleteCategoryRule(keyword);
      toast.success("Regra removida.");
    } catch {
      toast.error("Não foi possível remover a regra.");
    }
  };

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Tags className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
            Finanças
          </p>
          <h3 className="mt-0.5 font-display text-lg font-semibold">Categorias aprendidas</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Preferências salvas quando você corrige uma categoria durante a importação CSV.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span className="text-xs">Carregando regras...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-7 text-center">
            <p className="text-sm font-medium">Nenhuma regra criada ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Corrija uma categoria ao importar um CSV e ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y overflow-hidden rounded-xl border border-border/70">
            {rules.map((rule) => (
              <div
                key={rule.keyword}
                className="flex flex-col gap-2 bg-muted/10 px-3 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize">{rule.keyword}</p>
                  <p className="text-[11px] text-muted-foreground">Descrição reconhecida no CSV</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Categoria de ${rule.keyword}`}
                    value={rule.category}
                    disabled={isSaving}
                    onChange={(event) => updateRule(rule, event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-36"
                  >
                    {[...new Set([...TRANSACTION_CATEGORIES, rule.category])].map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={isSaving}
                    aria-label={`Remover regra de ${rule.keyword}`}
                    onClick={() => removeRule(rule.keyword)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
