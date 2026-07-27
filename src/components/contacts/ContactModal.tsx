import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Contact, ContactInput, ContactType } from "@/hooks/useContacts";

interface ContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  isSaving: boolean;
  onSubmit: (data: ContactInput) => Promise<void>;
}

const emptyForm = {
  name: "",
  type: "personal" as ContactType,
  email: "",
  phone: "",
  role: "",
  company: "",
  birthday: "",
  notes: "",
  favorite: false,
  last_contact_date: "",
  follow_up_date: "",
  follow_up_note: "",
};

export function ContactModal({ open, onOpenChange, contact, isSaving, onSubmit }: ContactModalProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm(contact ? {
      name: contact.name,
      type: contact.type,
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role || "",
      company: contact.company || "",
      birthday: contact.birthday || "",
      notes: contact.notes || "",
      favorite: contact.favorite,
      last_contact_date: contact.last_contact_date || "",
      follow_up_date: contact.follow_up_date || "",
      follow_up_note: contact.follow_up_note || "",
    } : emptyForm);
  }, [contact, open]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const nullable = (value: string) => value.trim() || null;
    await onSubmit({
      name: form.name.trim(),
      type: form.type,
      email: nullable(form.email),
      phone: nullable(form.phone),
      role: nullable(form.role),
      company: nullable(form.company),
      birthday: form.birthday || null,
      notes: nullable(form.notes),
      favorite: form.favorite,
      last_contact_date: form.last_contact_date || null,
      follow_up_date: form.follow_up_date || null,
      follow_up_note: nullable(form.follow_up_note),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome completo" required />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(value) => set("type", value as ContactType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Pessoal</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@exemplo.com" /></div>
            <div className="space-y-1.5"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(21) 99999-9999" /></div>
            <div className="space-y-1.5"><Label>Cargo</Label><Input value={form.role} onChange={(e) => set("role", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Empresa</Label><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Aniversário</Label><Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Último contato</Label><Input type="date" value={form.last_contact_date} onChange={(e) => set("last_contact_date", e.target.value)} /></div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximo follow-up</p>
            <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
              <Input type="date" value={form.follow_up_date} onChange={(e) => set("follow_up_date", e.target.value)} />
              <Input value={form.follow_up_note} onChange={(e) => set("follow_up_note", e.target.value)} placeholder="Ex: Retornar sobre a proposta" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Informações importantes sobre este contato..." rows={3} />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 p-3">
            <div className="flex items-center gap-2"><Star className="h-4 w-4 text-warning" /><div><p className="text-sm font-medium">Contato favorito</p><p className="text-xs text-muted-foreground">Aparece primeiro na lista</p></div></div>
            <Switch checked={form.favorite} onCheckedChange={(value) => set("favorite", value)} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 gradient-contacts text-contacts-foreground" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {contact ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
