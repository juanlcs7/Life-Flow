import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LucideIcon, ExternalLink, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  children: ReactNode;
  variant?: "finance" | "tasks" | "goals" | "health" | "agenda" | "history";
  size?: CardSize;
  delay?: number;
  isDragging?: boolean;
  dragHandleProps?: object;
  isCustomizing?: boolean;
}

const variantStyles = {
  finance: "before:bg-finance",
  tasks: "before:bg-tasks",
  goals: "before:bg-primary",
  health: "before:bg-health",
  agenda: "before:bg-info",
  history: "before:bg-muted-foreground",
};

const sizeStyles = {
  small: "min-h-[120px]",
  medium: "min-h-[180px]",
  large: "min-h-[260px]",
};

export function DashboardCard({
  title,
  icon: Icon,
  href,
  children,
  variant = "finance",
  size = "medium",
  delay = 0,
  isDragging = false,
  dragHandleProps,
  isCustomizing = false,
}: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={cn(isDragging && "opacity-70")}
    >
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden border-white/70 bg-card/90 shadow-card backdrop-blur-sm transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-1 hover:shadow-xl dark:border-white/5",
          variantStyles[variant],
          sizeStyles[size],
          isCustomizing && "ring-2 ring-primary/20"
        )}
        onClick={() => !isCustomizing && navigate(href)}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5">
          <div className="flex items-center gap-2">
            {isCustomizing && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/70">
              <Icon className="h-4 w-4 text-foreground/75" />
            </div>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          {!isCustomizing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                navigate(href);
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
