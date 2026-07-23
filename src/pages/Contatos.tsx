import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Users,
  Briefcase,
  Heart,
  Star,
  Phone,
  Mail,
  Calendar,
  Gift,
  MoreVertical,
  Bell,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const contacts = [
  { id: 1, name: "Ana Silva", role: "Gerente de Marketing", company: "TechCorp", email: "ana@techcorp.com", phone: "(11) 99999-1111", type: "professional", lastContact: "3 dias atrás", birthday: "15 Mar", avatar: "AS" },
  { id: 2, name: "Carlos Oliveira", role: "CEO", company: "StartupX", email: "carlos@startupx.com", phone: "(11) 99999-2222", type: "professional", lastContact: "1 semana atrás", birthday: null, avatar: "CO" },
  { id: 3, name: "Maria Santos", role: null, company: null, email: "maria@email.com", phone: "(11) 99999-3333", type: "personal", lastContact: "2 dias atrás", birthday: "22 Jan", avatar: "MS" },
  { id: 4, name: "João Pereira", role: "Desenvolvedor", company: "DevAgency", email: "joao@devagency.com", phone: "(11) 99999-4444", type: "professional", lastContact: "2 semanas atrás", birthday: null, avatar: "JP" },
  { id: 5, name: "Fernanda Lima", role: null, company: null, email: "fer@email.com", phone: "(11) 99999-5555", type: "personal", lastContact: "5 dias atrás", birthday: "08 Fev", avatar: "FL" },
  { id: 6, name: "Roberto Costa", role: "Diretor Comercial", company: "SalesForce", email: "roberto@salesforce.com", phone: "(11) 99999-6666", type: "professional", lastContact: "1 mês atrás", birthday: null, avatar: "RC" },
];

const upcomingBirthdays = contacts.filter((c) => c.birthday);

const followUps = [
  { id: 1, contact: "Carlos Oliveira", reason: "Follow-up proposta comercial", dueDate: "Hoje", priority: "high" },
  { id: 2, contact: "Roberto Costa", reason: "Agendar reunião mensal", dueDate: "Amanhã", priority: "medium" },
  { id: 3, contact: "João Pereira", reason: "Discutir novo projeto", dueDate: "Esta semana", priority: "low" },
];

const networkingSuggestions = [
  { contact: "Ana Silva", suggestion: "Enviar artigo sobre tendências de marketing", reason: "Baseado em interesses compartilhados" },
  { contact: "Carlos Oliveira", suggestion: "Parabenizar pelo aniversário da empresa", reason: "Evento importante" },
  { contact: "Roberto Costa", suggestion: "Reconectar - último contato há 1 mês", reason: "Manter relacionamento" },
];

const priorityColors = {
  high: "text-destructive bg-destructive/10",
  medium: "text-warning bg-warning/10",
  low: "text-muted-foreground bg-muted",
};

export default function Contatos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            Contatos & Networking
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus relacionamentos pessoais e profissionais
          </p>
        </div>
        <Button className="gradient-contacts text-contacts-foreground" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-contacts mb-2" />
            <p className="text-2xl font-bold">{contacts.length}</p>
            <p className="text-xs text-muted-foreground">Total de Contatos</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="p-4 text-center">
            <Briefcase className="w-8 h-8 mx-auto text-tasks mb-2" />
            <p className="text-2xl font-bold">{contacts.filter((c) => c.type === "professional").length}</p>
            <p className="text-xs text-muted-foreground">Profissionais</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-4 text-center">
            <Heart className="w-8 h-8 mx-auto text-health mb-2" />
            <p className="text-2xl font-bold">{contacts.filter((c) => c.type === "personal").length}</p>
            <p className="text-xs text-muted-foreground">Pessoais</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="p-4 text-center">
            <Bell className="w-8 h-8 mx-auto text-warning mb-2" />
            <p className="text-2xl font-bold">{followUps.length}</p>
            <p className="text-xs text-muted-foreground">Follow-ups</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Todos os Contatos</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar contato..." className="pl-9 w-48" />
                </div>
              </div>

              <Tabs defaultValue="all">
                <TabsList className="bg-muted/50 mb-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="professional">Profissionais</TabsTrigger>
                  <TabsTrigger value="personal">Pessoais</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <div className="space-y-2">
                    {contacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.03 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-contacts/10 text-contacts font-medium">
                            {contact.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{contact.name}</p>
                            {contact.type === "professional" ? (
                              <Briefcase className="w-3 h-3 text-tasks" />
                            ) : (
                              <Heart className="w-3 h-3 text-health" />
                            )}
                          </div>
                          {contact.role && (
                            <p className="text-xs text-muted-foreground">
                              {contact.role} @ {contact.company}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {contact.lastContact}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="mt-0">
                  <div className="space-y-2">
                    {contacts
                      .filter((c) => c.type === "professional")
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-contacts/10 text-contacts font-medium">
                              {contact.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {contact.role} @ {contact.company}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                <TabsContent value="personal" className="mt-0">
                  <div className="space-y-2">
                    {contacts
                      .filter((c) => c.type === "personal")
                      .map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-contacts/10 text-contacts font-medium">
                              {contact.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{contact.name}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Follow-ups */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-4">Follow-ups</h3>
              <div className="space-y-3">
                {followUps.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{item.contact}</p>
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          priorityColors[item.priority as keyof typeof priorityColors]
                        )}
                      >
                        {item.dueDate}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Birthdays */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <Gift className="w-4 h-4 text-accent" />
                Aniversários Próximos
              </h3>
              <div className="space-y-3">
                {upcomingBirthdays.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-accent/10 text-accent text-xs">
                        {contact.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.birthday}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Networking Suggestions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-5">
              <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Sugestões
              </h3>
              <div className="space-y-3">
                {networkingSuggestions.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg border border-border">
                    <p className="text-sm font-medium">{item.contact}</p>
                    <p className="text-xs text-primary mt-1">{item.suggestion}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}