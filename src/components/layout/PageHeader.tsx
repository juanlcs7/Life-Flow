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

const variants: Record<HeaderVariant, { icon: string; glow: string; accent: string; line: string }> = {
  finance: {
    icon: "bg-violet-500/10 text-violet-700 dark:bg-violet-400/15 dark:text-violet-200",
    glow: "bg-violet-400/20",
    accent: "text-violet-700 dark:text-violet-200",
    line: "from-violet-400 via-fuchsia-400 to-cyan-300",
  },
  tasks: {
    icon: "bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200",
    glow: "bg-sky-400/20",
    accent: "text-sky-700 dark:text-sky-200",
    line: "from-sky-400 via-cyan-300 to-blue-400",
  },
  goals: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200",
    glow: "bg-emerald-400/20",
    accent: "text-emerald-700 dark:text-emerald-200",
    line: "from-emerald-400 via-lime-300 to-cyan-300",
  },
  health: {
    icon: "bg-green-500/10 text-green-700 dark:bg-green-400/15 dark:text-green-200",
    glow: "bg-green-400/20",
    accent: "text-green-700 dark:text-green-200",
    line: "from-green-400 via-emerald-300 to-teal-300",
  },
  neutral: {
    icon: "bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-200",
    glow: "bg-cyan-400/20",
    accent: "text-cyan-700 dark:text-cyan-200",
    line: "from-cyan-400 via-teal-300 to-violet-400",
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
      className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#07111f] p-6 text-white shadow-[0_34px_100px_-48px_rgba(2,12,27,.8)] sm:p-8 lg:p-10"
    >
      <div className="flow-grid pointer-events-none absolute inset-0 opacity-20" />
      <div className={cn("pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-3xl", style.glow)} />
      <div className={cn("pointer-events-none absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r", style.line)} />
      <div className="pointer-events-none absolute -bottom-20 right-12 font-display text-[11rem] font-extrabold leading-none text-white/[0.025]">LF</div>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div className={cn("mt-0.5 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.08] text-white shadow-2xl", style.icon)}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,.8)]" />{eyebrow}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
      </div>
    </motion.header>
    );
}
