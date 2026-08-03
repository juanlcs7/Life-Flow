import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PersonalEvent, PersonalEventInput } from "@/hooks/usePersonalEvents";
import { getErrorMessage } from "@/lib/errors";

interface PersonalEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PersonalEventInput) => Promise<void>;
  editData?: PersonalEvent | null;
  initialDate?: string;
}

export function PersonalEventModal({ open, onOpenChange, onSubmit, editData, initialDate }: PersonalEventModalProps) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(initialDate || "");
  const [eventTime, setEventTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reminderDays, setReminderDays] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(editData?.title ?? "");
    setEventDate(editData?.event_date ?? initialDate ?? "");
    setEventTime(editData?.event_time?.slice(0, 5) ?? "");
    setNotes(editData?.notes ?? "");
    setReminderDays(String(editData?.reminder_days_before ?? 1));
  }, [editData, initialDate, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !eventDate) {
      toast.error("Preencha o título e a data do lembrete.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        event_date: eventDate,
        event_time: eventTime || null,
        notes: notes.trim() || null,
        reminder_days_before: Number(reminderDays),
      });
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Não foi possível salvar o lembrete.", {
        description: getErrorMessage(error, "Tente novamente em alguns instantes."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>{editData ? "Editar lembrete" : "Novo lembrete"}</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="personal-event-title">Título</Label>
            <Input id="personal-event-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex: Comprar presente" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="personal-event-date">Data</Label>
              <Input id="personal-event-date" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personal-event-time">Horário</Label>
              <Input id="personal-event-time" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Avisar</Label>
            <Select value={reminderDays} onValueChange={setReminderDays}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No mesmo dia</SelectItem>
                <SelectItem value="1">1 dia antes</SelectItem>
                <SelectItem value="3">3 dias antes</SelectItem>
                <SelectItem value="7">7 dias antes</SelectItem>
                <SelectItem value="14">14 dias antes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="personal-event-notes">Observação</Label>
            <Textarea id="personal-event-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Detalhes opcionais" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 gradient-tasks text-tasks-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editData ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
