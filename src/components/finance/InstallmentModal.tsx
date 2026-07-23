import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Account } from "@/hooks/useAccounts";

interface InstallmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    description: string;
    total_amount: number;
    installment_count: number;
    installment_amount: number;
    first_payment_date: string;
    category: string;
    account_id: string | null;
    auto_debit: boolean;
  }) => Promise<void>;
  accounts: Account[];
}

const categories = [
  "Compras",
  "Eletrônicos",
  "Móveis",
  "Viagem",
  "Saúde",
  "Educação",
  "Outros",
];

export function InstallmentModal({ open, onOpenChange, onSubmit, accounts }: InstallmentModalProps) {
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [firstPaymentDate, setFirstPaymentDate] = useState("");
  const [category, setCategory] = useState("Compras");
  const [accountId, setAccountId] = useState<string>("");
  const [autoDebit, setAutoDebit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const installmentAmount = totalAmount && installmentCount 
    ? (parseFloat(totalAmount) / parseInt(installmentCount)).toFixed(2)
    : "";

  useEffect(() => {
    if (!open) {
      setDescription("");
      setTotalAmount("");
      setInstallmentCount("");
      setFirstPaymentDate("");
      setCategory("Compras");
      setAccountId("");
      setAutoDebit(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !totalAmount || !installmentCount || !firstPaymentDate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        description: description.trim(),
        total_amount: parseFloat(totalAmount),
        installment_count: parseInt(installmentCount),
        installment_amount: parseFloat(installmentAmount),
        first_payment_date: firstPaymentDate,
        category,
        account_id: accountId || null,
        auto_debit: autoDebit && !!accountId,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Parcelamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: iPhone 15"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Valor Total</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                placeholder="5000,00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installmentCount">Nº de Parcelas</Label>
              <Input
                id="installmentCount"
                type="number"
                min="2"
                max="48"
                placeholder="12"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(e.target.value)}
                required
              />
            </div>
          </div>

          {installmentAmount && (
            <div className="p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Valor da parcela</p>
              <p className="text-lg font-bold">R$ {parseFloat(installmentAmount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="firstPaymentDate">Data da 1ª Parcela</Label>
            <Input
              id="firstPaymentDate"
              type="date"
              value={firstPaymentDate}
              onChange={(e) => setFirstPaymentDate(e.target.value)}
              required
            />
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
                  Na data de vencimento, a parcela é descontada da conta automaticamente.
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
              Criar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
