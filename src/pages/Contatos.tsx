import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  CalendarCheck,
  Gift,
  Heart,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Star,
  UserRoundPlus,
  Users,
} from "lucide-react";
import { format, formatDistanceToNow, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { ContactModal } from "@/components/contacts/ContactModal";
import { Contact, ContactInput, ContactType, useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ContactFilter = "all" | ContactType | "favorites";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function nextBirthday(date: string) {
  const source = parseISO(date);
  const now = startOfDay(new Date());
  let next = new Date(now.getFullYear(), source.getMonth(), source.getDate());
  if (next < now) next = new Date(now.getFullYear() + 1, source.getMonth(), source.getDate());
  return next;
}

export default function Contatos() {
  const { contacts, isLoading, addContact, updateContact, deleteContact, isSaving } = useContacts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (filter === "favorites" && !contact.favorite) return false;
      if (filter !== "all" && filter !== "favorites" && contact.type !== filter) return false;
      if (!query) return true;
      return [contact.name, contact.email, contact.phone, contact.company, contact.role]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [contacts, filter, search]);

  const followUps = useMemo(
    () => contacts
      .filter((contact) => contact.follow_up_date)
      .sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!)),
    [contacts],
  );

  const birthdays = useMemo(
    () => contacts
      .filter((contact) => contact.birthday)
      .map((contact) => ({ contact, date: nextBirthday(contact.birthday!) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5),
    [contacts],
  );

  const handleSave = async (data: ContactInput) => {
    try {
      if (editing) {
        await updateContact({ id: editing.id, ...data });
        toast.success("Contato atualizado!");
      } else {
        await addContact(data);
        toast.success("Contato adicionado!");
      }
      setEditing(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o contato");
      throw error;
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!confirm(`Excluir "${contact.name}"?`)) return;
    try {
      await deleteContact(contact.id);
      toast.success("Contato excluído!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir");
    }
  };

  const markContacted = async (contact: Contact) => {
    try {
      await updateContact({
        id: contact.id,
        last_contact_date: format(new Date(), "yyyy-MM-dd"),
        follow_up_date: null,
        follow_up_note: null,
      });
      toast.success(`Contato com ${contact.name} registrado!`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar");
    }
  };

  const toggleFavorite = async (contact: Contact) => {
    await updateContact({ id: contact.id, favorite: !contact.favorite });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <ContactModal
        open={modalOpen}
        onOpenChange={(open) => { setModalOpen(open); if (!open) setEditing(null); }}
        contact={editing}
        isSaving={isSaving}
        onSubmit={handleSave}
      />

      <PageHeader
        title="Contatos & Networking"
        description="Organize seus relacionamentos, acompanhe conversas e não perca datas importantes."
        eyebrow="Sua rede"
        icon={Users}
        variant="neutral"
        actions={
          <Button
            className="gradient-contacts h-10 text-contacts-foreground active:scale-95"
            onClick={() => { setEditing(null); setModalOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" />Novo Contato
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total", value: contacts.length, icon: Users, tone: "text-contacts", bg: "bg-contacts/10", accent: "before:bg-contacts" },
          { label: "Profissionais", value: contacts.filter((c) => c.type === "professional").length, icon: Briefcase, tone: "text-tasks", bg: "bg-tasks/10", accent: "before:bg-tasks" },
          { label: "Pessoais", value: contacts.filter((c) => c.type === "personal").length, icon: Heart, tone: "text-health", bg: "bg-health/10", accent: "before:bg-health" },
          { label: "Follow-ups", value: followUps.length, icon: Bell, tone: "text-warning", bg: "bg-warning/10", accent: "before:bg-warning" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className={cn("relative h-full overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5", stat.accent)}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.bg)}><stat.icon className={cn("h-5 w-5", stat.tone)} /></div>
                <div><p className={cn("text-2xl font-bold", stat.tone)}>{isLoading ? "—" : stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-contacts">Agenda de pessoas</p>
              <h2 className="mt-1 font-display text-lg font-semibold">Seus contatos</h2>
            </div>
            <div className="relative w-full xl:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, empresa..." className="h-10 bg-muted/30 pl-9" />
            </div>
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as ContactFilter)}>
            <TabsList className="mb-4 grid h-10 w-full grid-cols-4 rounded-xl border border-border/60 bg-muted/30 p-1">
              <TabsTrigger value="all" className="rounded-lg text-xs">Todos</TabsTrigger>
              <TabsTrigger value="professional" className="rounded-lg text-xs">Profissionais</TabsTrigger>
              <TabsTrigger value="personal" className="rounded-lg text-xs">Pessoais</TabsTrigger>
              <TabsTrigger value="favorites" className="rounded-lg text-xs"><Star className="mr-1 h-3 w-3" />Favoritos</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filteredContacts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 py-12 text-center">
              <UserRoundPlus className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
              <p className="text-sm font-medium">{contacts.length === 0 ? "Nenhum contato cadastrado" : "Nenhum contato encontrado"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{contacts.length === 0 ? "Adicione a primeira pessoa da sua rede." : "Tente alterar a busca ou o filtro."}</p>
              {contacts.length === 0 && <Button variant="link" onClick={() => setModalOpen(true)}>Adicionar contato</Button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025 }}
                  className="group flex items-center gap-3 rounded-xl border border-transparent bg-muted/20 p-3 transition-all hover:border-contacts/15 hover:bg-contacts/[0.035]"
                >
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-contacts/10 font-semibold text-contacts">{initials(contact.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{contact.name}</p>
                      {contact.favorite && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                      {contact.type === "professional" ? <Briefcase className="h-3 w-3 text-tasks" /> : <Heart className="h-3 w-3 text-health" />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {[contact.role, contact.company].filter(Boolean).join(" • ") || contact.email || contact.phone || "Sem detalhes adicionais"}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/75">
                      {contact.last_contact_date
                        ? `Último contato ${formatDistanceToNow(parseISO(contact.last_contact_date), { locale: ptBR, addSuffix: true })}`
                        : "Nenhum contato registrado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title={contact.favorite ? "Remover dos favoritos" : "Favoritar"} onClick={() => toggleFavorite(contact)}>
                      <Star className={cn("h-4 w-4", contact.favorite && "fill-warning text-warning")} />
                    </Button>
                    {contact.phone && <Button asChild variant="ghost" size="icon" className="h-8 w-8"><a href={`tel:${contact.phone}`} title="Ligar"><Phone className="h-4 w-4" /></a></Button>}
                    {contact.email && <Button asChild variant="ghost" size="icon" className="h-8 w-8"><a href={`mailto:${contact.email}`} title="Enviar e-mail"><Mail className="h-4 w-4" /></a></Button>}
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Registrar contato hoje" onClick={() => markContacted(contact)}><MessageSquare className="h-4 w-4" /></Button>
                    <ContextActionMenu
                      onEdit={() => { setEditing(contact); setModalOpen(true); }}
                      onDelete={() => handleDelete(contact)}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="border-warning/15 bg-gradient-to-br from-card to-warning/[0.045] p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-warning" /><h3 className="font-display font-semibold">Follow-ups</h3></div>
            {followUps.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Nenhum retorno agendado</p>
            ) : (
              <div className="space-y-2">
                {followUps.slice(0, 5).map((contact) => {
                  const date = parseISO(contact.follow_up_date!);
                  const overdue = date < startOfDay(new Date());
                  return (
                    <button key={contact.id} onClick={() => { setEditing(contact); setModalOpen(true); }} className="w-full rounded-xl border border-border/50 bg-background/45 p-3 text-left transition-colors hover:bg-background/80">
                      <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium">{contact.name}</p><span className={cn("text-[10px] font-semibold", overdue ? "text-destructive" : "text-warning")}>{format(date, "dd MMM", { locale: ptBR })}</span></div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{contact.follow_up_note || "Retomar contato"}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="border-accent/15 bg-gradient-to-br from-card to-accent/[0.045] p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><Gift className="h-4 w-4 text-accent" /><h3 className="font-display font-semibold">Próximos aniversários</h3></div>
            {birthdays.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">Cadastre aniversários para vê-los aqui</p>
            ) : (
              <div className="space-y-3">
                {birthdays.map(({ contact, date }) => (
                  <div key={contact.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9"><AvatarFallback className="bg-accent/10 text-xs font-semibold text-accent">{initials(contact.name)}</AvatarFallback></Avatar>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{contact.name}</p><p className="text-xs text-muted-foreground">{format(date, "dd 'de' MMMM", { locale: ptBR })}</p></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
