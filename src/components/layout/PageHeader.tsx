import { type ComponentType, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type HeaderVariant = "finance" | "tasks" | "goals" | "health" | "neutral";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow: string;
  icon: ComponentType<{ className?: string }>;
  variant?: HeaderVariant;
  actions?: ReactNode;
}

const variants: Record<HeaderVariant, { icon: string; glow: string; accent: string }> = {
  finance: {
    icon: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
    glow: "bg-violet-400/20",
    accent: "text-violet-700 dark:text-violet-200",
  },
  tasks: {
    icon: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
    glow: "bg-sky-400/20",
    accent: "text-sky-700 dark:text-sky-200",
  },
  goals: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    glow: "bg-emerald-400/20",
    accent: "text-emerald-700 dark:text-emerald-200",
  },
  health: {
    icon: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-200",
    glow: "bg-green-400/20",
    accent: "text-green-700 dark:text-green-200",
  },
  neutral: {
    icon: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200",
    glow: "bg-cyan-400/20",
    accent: "text-cyan-700 dark:text-cyan-200",
  },
};

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  variant = "neutral",
  actions,
}: PageHeaderProps) {
  const style = variants[variant];

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[1.6rem] border border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 text-foreground shadow-[0_22px_65px_-42px_rgba(15,23,42,.35)] dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 dark:text-white dark:shadow-[0_22px_65px_-40px_rgba(15,23,42,.9)] sm:p-7"
    >
      <div className={cn("pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl", style.glow)} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-border/60 shadow-sm dark:border-white/10", style.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className={cn("mb-1.5 text-xs font-semibold uppercase tracking-[0.16em]", style.accent)}>
              {eyebrow}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-foreground dark:text-white sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-slate-400 sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
    </motion.header>
    );
}
