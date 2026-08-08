import { Cloud, Command, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

const pageNames: Record<string, { title: string; context: string }> = {
  "/": { title: "Meu dia", context: "Visão geral" },
  "/financas": { title: "Finanças", context: "Dinheiro e patrimônio" },
  "/agenda": { title: "Agenda", context: "Compromissos" },
  "/planejamento": { title: "Planejamento", context: "Semana em movimento" },
  "/saude": { title: "Saúde", context: "Hábitos e bem-estar" },
  "/metas": { title: "Metas", context: "Objetivos pessoais" },
  "/historico": { title: "Histórico", context: "Tudo o que aconteceu" },
  "/documentos": { title: "Documentos", context: "Arquivos importantes" },
  "/contatos": { title: "Contatos", context: "Pessoas e relações" },
  "/configuracoes": { title: "Configurações", context: "Seu LifeFlow" },
};

export function AppTopbar() {
  const location = useLocation();
  const page = pageNames[location.pathname] ?? { title: "LifeFlow", context: "Central pessoal" };
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date());

  return (
    <div className="sticky top-0 z-30 hidden h-[76px] items-center justify-between border-b border-border/60 bg-background/80 px-8 backdrop-blur-2xl lg:flex">
      <div className="flex items-center gap-4">
        <span className="grid h-10 w-10 place-items-center rounded-2xl border border-border/70 bg-card text-primary shadow-sm"><Command className="h-4 w-4" /></span>
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-muted-foreground">{page.context}</p><h2 className="font-display text-lg font-extrabold tracking-[-.035em]">{page.title}</h2></div>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[11px] font-semibold capitalize text-muted-foreground">{date}</span>
        <span className="flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"><Cloud className="h-3.5 w-3.5" />Tudo sincronizado</span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-violet-600 text-white shadow-lg shadow-primary/20"><Sparkles className="h-4 w-4" /></span>
      </div>
    </div>
  );
}
