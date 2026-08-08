import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CalendarDays, Loader2, Plus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import type { Account } from "@/hooks/useAccounts";
import { useIncomeSources, type IncomeSource, type NewIncomeSource } from "@/hooks/useIncomeSources";
import { toast } from "sonner";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const emptyForm = { name: "Salário", amount: "", paymentDay: "5", accountId: "none", active: true };

export function IncomeSourcesSection({ accounts }: { accounts: Account[] }) {
  const { incomeSources, monthlyIncome, isLoading, saveIncomeSource, deleteIncomeSource, isSaving } = useIncomeSources();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openForm = (source?: IncomeSource) => {
    setEditingId(source?.id ?? null);
    setForm(source ? {
      name: source.name,
      amount: String(source.amount),
      paymentDay: String(source.payment_day),
      accountId: source.account_id ?? "none",
      active: source.active,
    } : emptyForm);
    setOpen(true);
  };

  const save = async () => {
    const payload: NewIncomeSource & { id?: string } = {
      id: editingId ?? undefined,
      name: form.name.trim(),
      amount: Number(form.amount),
      payment_day: Number(form.paymentDay),
      account_id: form.accountId === "none" ? null : form.accountId,
      active: form.active,
    };
    if (!payload.name || payload.amount <= 0 || payload.payment_day < 1 || payload.payment_day > 31) {
      toast.error("Informe um nome, valor e dia entre 1 e 31");
      return;
    }
    try {
      await saveIncomeSource(payload);
      setOpen(false);
      toast.success(editingId ? "Renda atualizada" : "Renda mensal cadastrada");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a renda");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Editar renda mensal" : "Cadastrar renda mensal"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Nome da renda</Label><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Salário, aposentadoria..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valor mensal</Label><Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="3500,00" /></div>
              <div className="space-y-1.5"><Label>Dia do recebimento</Label><Input type="number" min="1" max="31" value={form.paymentDay} onChange={(event) => setForm((current) => ({ ...current, paymentDay: event.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label>Conta que recebe</Label>
              <Select value={form.accountId} onValueChange={(value) => setForm((current) => ({ ...current, accountId: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
                <SelectContent><SelectItem value="none">Não definir conta</SelectItem>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 p-3"><div><p className="text-sm font-medium">Renda ativa</p><p className="text-xs text-muted-foreground">Considerar no resumo mensal</p></div><Switch checked={form.active} onCheckedChange={(active) => setForm((current) => ({ ...current, active }))} /></div>
            <p className="text-[11px] leading-4 text-muted-foreground">O cadastro organiza sua renda prevista. Ele não altera o saldo nem cria uma transação automaticamente.</p>
            <Button onClick={save} disabled={isSaving} className="w-full">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar renda</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="group relative h-full overflow-hidden rounded-[1.6rem] border-success/15 bg-gradient-to-br from-card via-card to-success/[0.06] p-4 shadow-sm transition-all hover:shadow-xl sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-success/10 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-display text-sm font-semibold sm:text-base"><Banknote className="h-4 w-4 text-success" />Renda mensal</h3><Button size="sm" variant="outline" onClick={() => openForm()} className="h-8"><Plus className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Nova</span></Button></div>

        {isLoading ? <div className="grid place-items-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : incomeSources.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground"><Banknote className="mx-auto mb-2 h-10 w-10 opacity-40" /><p className="text-sm">Nenhuma renda mensal cadastrada</p><Button variant="link" onClick={() => openForm()}>Cadastrar meu salário</Button></div>
        ) : (
          <>
            <div className="my-4 rounded-2xl border border-success/15 bg-success/[0.08] p-3.5"><p className="text-xs text-muted-foreground">Renda mensal prevista</p><p className="mt-1 text-xl font-bold text-success">{money(monthlyIncome)}</p></div>
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {incomeSources.map((source) => {
                const account = accounts.find((item) => item.id === source.account_id);
                return <div key={source.id} className="flex items-center gap-3 rounded-2xl border border-border/45 bg-background/60 p-3 shadow-sm"><span className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success"><Wallet className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold">{source.name}</p>{!source.active && <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">Inativa</span>}</div><p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />Todo dia {source.payment_day}</span><span>{account?.name ?? "Sem conta definida"}</span></p></div><p className="whitespace-nowrap text-xs font-bold text-success">{money(Number(source.amount))}</p><ContextActionMenu onEdit={() => openForm(source)} onDelete={async () => { await deleteIncomeSource(source.id); toast.success("Renda removida"); }} /></div>;
              })}
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
