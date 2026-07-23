import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "LifeFlow — Sua visão geral do dia",
    description: "Acompanhe finanças, hábitos, metas e agenda em um só painel personalizado.",
  },
  "/financas": {
    title: "Finanças — LifeFlow",
    description: "Gerencie contas, transações, metas financeiras e investimentos com atualização em tempo real.",
  },
  "/agenda": {
    title: "Agenda — LifeFlow",
    description: "Organize tarefas, compromissos e prazos com um calendário simples e mobile-first.",
  },
  "/saude": {
    title: "Saúde e Bem-estar — LifeFlow",
    description: "Crie hábitos, acompanhe estatísticas e mantenha sua rotina saudável todos os dias.",
  },
  "/metas": {
    title: "Metas — LifeFlow",
    description: "Defina metas pessoais e financeiras e veja seu progresso conectado a hábitos e tarefas.",
  },
  "/historico": {
    title: "Histórico — LifeFlow",
    description: "Reveja transações, tarefas concluídas e hábitos registrados em um único histórico.",
  },
  "/documentos": {
    title: "Documentos — LifeFlow",
    description: "Armazene documentos importantes com segurança no seu espaço pessoal LifeFlow.",
  },
  "/contatos": {
    title: "Contatos — LifeFlow",
    description: "Organize contatos pessoais e profissionais com lembretes de aniversários e interações.",
  },
  "/configuracoes": {
    title: "Configurações — LifeFlow",
    description: "Personalize notificações, tema e preferências da sua conta no LifeFlow.",
  },
  "/auth": {
    title: "Entrar — LifeFlow",
    description: "Acesse sua conta LifeFlow para organizar finanças, hábitos, metas e agenda.",
  },
};

const DEFAULT = {
  title: "LifeFlow — Organize sua vida pessoal e financeira",
  description: "Finanças, hábitos, metas, agenda e estudos em um único app mobile-first.",
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = META[pathname] ?? DEFAULT;
    const url = new URL(pathname, window.location.origin).toString();
    document.title = meta.title;
    setMeta("description", meta.description);
    setMeta("og:title", meta.title, "property");
    setMeta("og:description", meta.description, "property");
    setMeta("og:url", url, "property");
    setMeta("twitter:title", meta.title);
    setMeta("twitter:description", meta.description);
    setLink("canonical", url);
  }, [pathname]);
  return null;
}
