import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Subscription } from "@/hooks/useSubscriptions";
import { Account } from "@/hooks/useAccounts";

interface SubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">) => Promise<void>;
  editData?: Subscription | null;
  accounts: Account[];
}

const categories = [
  "Streaming",
  "Música",
  "Jogos",
  "Produtividade",
  "Academia",
  "Notícias",
  "Armazenamento",
  "Outros",
];

export function SubscriptionModal({ open, onOpenChange, onSubmit, editData, accounts }: SubscriptionModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [category, setCategory] = useState("Streaming");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [reminderDaysBefore, setReminderDaysBefore] = useState("3");
  const [accountId, setAccountId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [autoDebit, setAutoDebit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setAmount(editData.amount.toString());
      setFrequency(editData.frequency);
      setCategory(editData.category);
      setNextBillingDate(editData.next_billing_date);
      setReminderDaysBefore(editData.reminder_days_before.toString());
      setAccountId(editData.account_id || "");
      setActive(editData.active);
      setAutoDebit((editData as any).auto_debit ?? false);
    } else {
      setName("");
      setAmount("");
      setFrequency("monthly");
      setCategory("Streaming");
      setNextBillingDate("");
      setReminderDaysBefore("3");
      setAccountId("");
      setActive(true);
      setAutoDebit(false);
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !nextBillingDate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        amount: parseFloat(amount),
        frequency,
        category,
        next_billing_date: nextBillingDate,
        reminder_days_before: parseInt(reminderDaysBefore),
        account_id: accountId || null,
        active,
        auto_debit: autoDebit && !!accountId,
      } as any);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Assinatura" : "Nova Assinatura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço</Label>
            <Input
              id="name"
              placeholder="Ex: Netflix, Spotify..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="39,90"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextBillingDate">Próxima Cobrança</Label>
            <Input
              id="nextBillingDate"
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminderDays">Lembrar X dias antes</Label>
            <Input
              id="reminderDays"
              type="number"
              min="0"
              max="30"
              value={reminderDaysBefore}
              onChange={(e) => setReminderDaysBefore(e.target.value)}
            />
          </div>

          {accounts.length > 0 && (
            <div className="space-y-2">
              <Label>Conta (opcional)</Label>
              <Select value={accountId || "none"} onValueChange={(val) => setAccountId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {accountId && (
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div className="min-w-0 pr-3">
                <Label className="text-sm">Débito automático</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Cobra automaticamente da conta na data da próxima fatura.
                </p>
              </div>
              <Switch checked={autoDebit} onCheckedChange={setAutoDebit} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
