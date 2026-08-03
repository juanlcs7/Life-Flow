import { useMemo, useState } from "react";
import { Loader2, Plus, Search, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useTransactionCategoryRules,
  type TransactionCategoryRule,
} from "@/hooks/useTransactionCategoryRules";
import {
  normalizeTransactionDescription,
} from "@/lib/transactionCsv";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";

export function CategoryRulesSettings() {
  const { categories: transactionCategories } = useTransactionCategories();
  const categoryNames = transactionCategories.map((item) => item.name);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Outros");
  const [search, setSearch] = useState("");
  const {
    rules,
    isLoading,
    isSaving,
    saveCategoryRules,
    deleteCategoryRule,
  } = useTransactionCategoryRules();
  const filteredRules = useMemo(() => {
    const term = normalizeTransactionDescription(search);
    return term
      ? rules.filter((rule) =>
          rule.keyword.includes(term) || normalizeTransactionDescription(rule.category).includes(term),
        )
      : rules;
  }, [rules, search]);

  const createRule = async () => {
    const keyword = normalizeTransactionDescription(description);
    if (keyword.length < 3) {
      toast.error("Informe pelo menos 3 caracteres para criar a regra.");
      return;
    }

    try {
      await saveCategoryRules([{ keyword, category }]);
      toast.success("Regra criada.");
      setDescription("");
      setCategory("Outros");
      setDialogOpen(false);
    } catch {
      toast.error("Não foi possível criar a regra.");
    }
  };

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
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova regra de categoria</DialogTitle>
            <DialogDescription>
              Informe uma parte marcante da descrição. Ela também reconhecerá lançamentos com números ou textos adicionais.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-description">Descrição do lançamento</Label>
              <Input
                id="rule-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Ex.: posto shell"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-category">Categoria</Label>
              <select
                id="rule-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {categoryNames.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" disabled={isSaving} onClick={createRule}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar regra
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                Preferências usadas automaticamente durante a importação CSV.
              </p>
            </div>
          </div>
          <Button type="button" size="sm" className="shrink-0" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nova regra
          </Button>
        </div>

        <div className="mt-4">
          {!isLoading && rules.length > 0 && (
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar descrição ou categoria..."
                className="pl-9"
              />
            </div>
          )}

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
          ) : filteredRules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-7 text-center">
              <p className="text-sm font-medium">Nenhuma regra encontrada</p>
              <p className="mt-1 text-xs text-muted-foreground">Tente buscar por outro termo.</p>
            </div>
          ) : (
          <div className="divide-y overflow-hidden rounded-xl border border-border/70">
            {filteredRules.map((rule) => (
              <div
                key={rule.keyword}
                className="flex flex-col gap-2 bg-muted/10 px-3 py-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize">{rule.keyword}</p>
                  <p className="text-[11px] text-muted-foreground">Trecho reconhecido na descrição do CSV</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Categoria de ${rule.keyword}`}
                    value={rule.category}
                    disabled={isSaving}
                    onChange={(event) => updateRule(rule, event.target.value)}
                    className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring sm:w-36"
                  >
                    {[...new Set([...categoryNames, rule.category])].map((category) => (
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
    </>
  );
}
