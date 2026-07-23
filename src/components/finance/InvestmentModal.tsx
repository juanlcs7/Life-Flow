import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Investment } from "@/hooks/useInvestments";
import { Account } from "@/hooks/useAccounts";
import { useMarketRates, getRate } from "@/hooks/useMarketRates";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
  editData?: Investment | null;
  accounts: Account[];
}

const types = [
  { value: "poupanca", label: "Poupança" },
  { value: "renda_fixa", label: "Renda Fixa" },
  { value: "renda_variavel", label: "Renda Variável" },
  { value: "fundos", label: "Fundos" },
  { value: "cripto", label: "Cripto" },
  { value: "outros", label: "Outros" },
];

export function InvestmentModal({ open, onOpenChange, onSubmit, editData, accounts }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("renda_fixa");
  const [initialValue, setInitialValue] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState<string>("none");
  const [yieldRate, setYieldRate] = useState("");
  const [yieldPeriod, setYieldPeriod] = useState("monthly");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: rates = [] } = useMarketRates();

  const cdi = getRate(rates, "CDI");
  const selic = getRate(rates, "SELIC");
  const ipca = getRate(rates, "IPCA");
  const poupanca = getRate(rates, "POUPANCA");

  // CDI comes as daily %; produce an effective annual % (252 business days)
  const cdiAnnual = cdi ? (Math.pow(1 + cdi.value / 100, 252) - 1) * 100 : null;
  const selicYear = selic?.value ?? null;
  const poupancaMonthly = poupanca?.value ?? null;
  const ipcaMonthly = ipca?.value ?? null;

  const presets = [
    cdiAnnual !== null && {
      label: "CDB 100% CDI",
      rate: cdiAnnual.toFixed(2),
      period: "yearly",
      type: "renda_fixa",
      desc: `${cdiAnnual.toFixed(2)}% a.a. (CDI atual)`,
    },
    selicYear !== null && {
      label: "Tesouro Selic",
      rate: selicYear.toFixed(2),
      period: "yearly",
      type: "renda_fixa",
      desc: `${selicYear.toFixed(2)}% a.a. (Selic meta)`,
    },
    cdiAnnual !== null && {
      label: "LCI 95% CDI",
      rate: (cdiAnnual * 0.95).toFixed(2),
      period: "yearly",
      type: "renda_fixa",
      desc: `${(cdiAnnual * 0.95).toFixed(2)}% a.a. (isento de IR)`,
    },
    ipcaMonthly !== null && cdiAnnual !== null && {
      label: "Tesouro IPCA+",
      rate: ((Math.pow(1 + ipcaMonthly / 100, 12) - 1) * 100 + 5.5).toFixed(2),
      period: "yearly",
      type: "renda_fixa",
      desc: "IPCA + 5,5% a.a.",
    },
    poupancaMonthly !== null && {
      label: "Poupança",
      rate: poupancaMonthly.toFixed(4),
      period: "monthly",
      type: "poupanca",
      desc: `${poupancaMonthly.toFixed(2)}% ao mês`,
    },
  ].filter(Boolean) as Array<{ label: string; rate: string; period: string; type: string; desc: string }>;

  const applyPreset = (p: (typeof presets)[number]) => {
    setYieldRate(p.rate);
    setYieldPeriod(p.period);
    setType(p.type);
    if (!name) setName(p.label);
  };

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
      setInitialValue(String(editData.initial_value));
      setStartDate(editData.start_date);
      setAccountId(editData.account_id || "none");
      setYieldRate(String(editData.yield_rate ?? ""));
      setYieldPeriod(editData.yield_period || "monthly");
      setNotes(editData.notes || "");
    } else {
      setName(""); setType("renda_fixa"); setInitialValue("");
      setStartDate(new Date().toISOString().split("T")[0]);
      setAccountId("none"); setYieldRate(""); setYieldPeriod("monthly"); setNotes("");
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !initialValue) return;
    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        initial_value: parseFloat(initialValue),
        start_date: startDate,
        account_id: accountId === "none" ? null : accountId,
        yield_rate: yieldRate ? parseFloat(yieldRate) : 0,
        yield_period: yieldPeriod,
        notes: notes || null,
      });
      onOpenChange(false);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Investimento" : "Novo Investimento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!editData && presets.length > 0 && (
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-warning" />
                Sugestões com taxas reais (BCB)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className="text-[11px] px-2 py-1 rounded-md border bg-card hover:bg-muted/60 active:scale-95 transition text-left"
                    title={p.desc}
                  >
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground ml-1">· {p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: Tesouro Selic 2029" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{types.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor inicial</Label>
              <Input type="number" step="0.01" value={initialValue} onChange={(e) => setInitialValue(e.target.value)} required disabled={!!editData} />
            </div>
            <div className="space-y-1.5">
              <Label>Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>
          {!editData && (
            <div className="space-y-1.5">
              <Label>Conta de origem (opcional)</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">O valor inicial será debitado da conta escolhida.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rendimento (%)</Label>
              <Input type="number" step="0.0001" value={yieldRate} onChange={(e) => setYieldRate(e.target.value)} placeholder="Ex: 0.85" />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={yieldPeriod} onValueChange={setYieldPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">ao dia</SelectItem>
                  <SelectItem value="monthly">ao mês</SelectItem>
                  <SelectItem value="yearly">ao ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O valor atual será atualizado automaticamente todos os dias com base nesta taxa.
          </p>
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={busy} className="flex-1">
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}