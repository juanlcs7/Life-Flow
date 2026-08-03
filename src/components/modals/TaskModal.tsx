import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat2 } from "lucide-react";
import { toast } from "sonner";
import type { TaskRecurrence } from "@/hooks/useTasks";
import { useContacts } from "@/hooks/useContacts";
import { getErrorMessage } from "@/lib/errors";

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    due_date: string;
    due_time: string | null;
    priority: string;
    category: string;
    recurrence: TaskRecurrence;
    contact_id: string | null;
  }) => Promise<void>;
  editData?: {
    id: string;
    title: string;
    due_date: string;
    due_time: string | null;
    priority: string;
    category: string;
    recurrence: TaskRecurrence;
    contact_id: string | null;
  } | null;
}

const priorities = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

const categories = [
  "Trabalho",
  "Pessoal",
  "Saúde",
  "Educação",
  "Networking",
  "Outros",
];

export function TaskModal({ open, onOpenChange, onSubmit, editData }: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState<TaskRecurrence>("none");
  const [contactId, setContactId] = useState("none");
  const { contacts } = useContacts();

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setDueDate(editData.due_date);
      setDueTime(editData.due_time || "");
      setPriority(editData.priority);
      setCategory(editData.category);
      setRecurrence(editData.recurrence || "none");
      setContactId(editData.contact_id || "none");
    } else {
      setTitle("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setDueTime("");
      setPriority("medium");
      setCategory("");
      setRecurrence("none");
      setContactId("none");
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Digite um título para a tarefa.");
      return;
    }

    if (!dueDate) {
      toast.error("Escolha uma data para a tarefa.");
      return;
    }

    if (!category) {
      toast.error("Selecione uma categoria para continuar.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        due_date: dueDate,
        due_time: dueTime || null,
        priority,
        category,
        recurrence,
        contact_id: contactId === "none" ? null : contactId,
      });
      setTitle("");
      setDueDate(new Date().toISOString().split("T")[0]);
      setDueTime("");
      setPriority("medium");
      setCategory("");
      setRecurrence("none");
      setContactId("none");
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error("Não foi possível salvar a tarefa.", {
        description: getErrorMessage(error, "Tente novamente em alguns instantes."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editData ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Reunião com cliente, Entregar relatório..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueTime">Horário</Label>
              <Input
                id="dueTime"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {priorities.map((p) => (
                  <SelectItem key={p.value} value={p.value} className="py-3">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="py-3">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurrence" className="flex items-center gap-2">
              <Repeat2 className="h-4 w-4 text-tasks" />
              Repetição
            </Label>
            <Select value={recurrence} onValueChange={(value) => setRecurrence(value as TaskRecurrence)}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none" className="py-3">Não repetir</SelectItem>
                <SelectItem value="daily" className="py-3">Todos os dias</SelectItem>
                <SelectItem value="weekly" className="py-3">Toda semana</SelectItem>
                <SelectItem value="monthly" className="py-3">Todo mês</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              A próxima ocorrência será criada quando esta tarefa for concluída.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Contato vinculado</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="h-12 text-base"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="none">Nenhum contato</SelectItem>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>{contact.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 text-base active:scale-95"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-base gradient-tasks text-tasks-foreground active:scale-95"
              disabled={loading}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                />
              ) : editData ? (
                "Salvar"
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
