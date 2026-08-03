import { useState } from "react";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useTransactionCategories,
  type TransactionCategoryOption,
} from "@/hooks/useTransactionCategories";

const colors = ["#22c55e", "#3b82f6", "#8b5cf6", "#ef4444", "#f59e0b", "#ec4899", "#06b6d4", "#64748b"];
const icons = ["🛒", "🍽️", "🚗", "🏠", "❤️", "📚", "🎮", "💰", "✈️", "🐾", "👕", "📌"];

export function TransactionCategoriesSettings() {
  const { categories, createCategory, updateCategory, deleteCategory, isLoading, isSaving } = useTransactionCategories();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionCategoryOption | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [icon, setIcon] = useState(icons[0]);

  const beginCreate = () => {
    setEditing(null);
    setName("");
    setColor(colors[0]);
    setIcon(icons[0]);
    setOpen(true);
  };

  const beginEdit = (category: TransactionCategoryOption) => {
    setEditing(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon);
    setOpen(true);
  };

  const save = async () => {
    if (name.trim().length < 2 || name.trim().length > 32) {
      toast.error("O nome deve ter entre 2 e 32 caracteres.");
      return;
    }

    try {
      if (editing?.id) await updateCategory({ id: editing.id, name, color, icon });
      else await createCategory({ name, color, icon });
      toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a categoria.");
    }
  };

  const remove = async (category: TransactionCategoryOption) => {
    if (!category.id || !window.confirm(`Excluir a categoria “${category.name}”? As transações existentes não serão apagadas.`)) return;
    try {
      await deleteCategory(category.id);
      toast.success("Categoria removida.");
    } catch {
      toast.error("Não foi possível remover a categoria.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>Escolha um nome, uma cor e um ícone para identificar seus lançamentos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="transaction-category-name">Nome</Label>
              <Input id="transaction-category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Pets" maxLength={32} autoFocus />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((option) => (
                  <button key={option} type="button" aria-label={`Selecionar cor ${option}`} onClick={() => setColor(option)} className={`h-8 w-8 rounded-full border-2 transition-transform ${color === option ? "scale-110 border-foreground" : "border-transparent"}`} style={{ backgroundColor: option }} />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2">
                {icons.map((option) => (
                  <button key={option} type="button" onClick={() => setIcon(option)} className={`flex h-10 items-center justify-center rounded-lg border text-lg ${icon === option ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>{option}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={isSaving} onClick={save}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Finanças</p>
              <h3 className="mt-0.5 font-display text-lg font-semibold">Categorias de transações</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Crie categorias que aparecerão em transações, importações e orçamentos.</p>
            </div>
          </div>
          <Button size="sm" onClick={beginCreate}><Plus className="mr-1.5 h-4 w-4" />Nova categoria</Button>
        </div>

        {isLoading ? (
          <div className="mt-5 flex justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <div key={category.id || category.name} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>{category.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="text-[10px] text-muted-foreground">{category.isCustom ? "Personalizada" : "Padrão do LifeFlow"}</p>
                </div>
                {category.isCustom && (
                  <div className="flex">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => beginEdit(category)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => remove(category)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
