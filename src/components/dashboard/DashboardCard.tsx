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
  finance: "border-l-4 border-l-finance",
  tasks: "border-l-4 border-l-tasks",
  goals: "border-l-4 border-l-primary",
  health: "border-l-4 border-l-health",
  agenda: "border-l-4 border-l-info",
  history: "border-l-4 border-l-muted-foreground",
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
          "shadow-card hover:shadow-lg transition-all duration-300 cursor-pointer group",
          variantStyles[variant],
          sizeStyles[size],
          isCustomizing && "ring-2 ring-primary/20"
        )}
        onClick={() => !isCustomizing && navigate(href)}
      >
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {isCustomizing && (
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 -ml-1">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <Icon className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
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
