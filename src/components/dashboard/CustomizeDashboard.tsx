import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, GripVertical, Eye, EyeOff, Check, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useDashboardPreferences, type CardId, type CardSize } from "@/hooks/useDashboardPreferences";
import { cn } from "@/lib/utils";

const cardLabels: Record<CardId, string> = {
  finances: "Finanças",
  tasks: "Tarefas",
  goals: "Metas",
  health: "Saúde",
  agenda: "Agenda",
  history: "Histórico",
};

const sizeLabels: Record<CardSize, string> = {
  small: "P",
  medium: "M",
  large: "G",
};

interface CustomizeDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizeDashboard({ isOpen, onClose }: CustomizeDashboardProps) {
  const { preferences, toggleCard, reorderCards, setCardSize, isSaving } = useDashboardPreferences();
  const [draggedItem, setDraggedItem] = useState<CardId | null>(null);
  const [localOrder, setLocalOrder] = useState<CardId[]>([]);

  const cardOrder = localOrder.length > 0 ? localOrder : (preferences?.card_order || []);
  const visibleCards = preferences?.visible_cards || [];
  const cardSizes = preferences?.card_sizes || {};

  const handleDragStart = (cardId: CardId) => {
    setDraggedItem(cardId);
    setLocalOrder(cardOrder);
  };

  const handleDragOver = (e: React.DragEvent, targetId: CardId) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...localOrder];
    const dragIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetId);
    
    newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, draggedItem);
    setLocalOrder(newOrder);
  };

  const handleDragEnd = async () => {
    if (localOrder.length > 0) {
      await reorderCards(localOrder);
    }
    setDraggedItem(null);
    setLocalOrder([]);
  };

  const handleToggleCard = async (cardId: CardId) => {
    await toggleCard(cardId);
  };

  const handleSizeChange = async (cardId: CardId, size: CardSize) => {
    await setCardSize(cardId, size);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">Personalizar Dashboard</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Arraste para reordenar, ative/desative cards e escolha o tamanho.
            </p>
            
            <div className="space-y-2">
              {cardOrder.map((cardId) => {
                const isVisible = visibleCards.includes(cardId);
                const currentSize = cardSizes[cardId] || "medium";
                
                return (
                  <div
                    key={cardId}
                    draggable
                    onDragStart={() => handleDragStart(cardId)}
                    onDragOver={(e) => handleDragOver(e, cardId)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border bg-card transition-all",
                      draggedItem === cardId && "opacity-50 border-primary",
                      !isVisible && "opacity-60"
                    )}
                  >
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Label className="text-sm font-medium">{cardLabels[cardId]}</Label>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Size selector */}
                      <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
                        {(["small", "medium", "large"] as CardSize[]).map((size) => (
                          <button
                            key={size}
                            onClick={() => handleSizeChange(cardId, size)}
                            className={cn(
                              "px-2 py-1 text-xs rounded transition-colors",
                              currentSize === size
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                            disabled={!isVisible}
                          >
                            {sizeLabels[size]}
                          </button>
                        ))}
                      </div>
                      
                      {/* Visibility toggle */}
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => handleToggleCard(cardId)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                Salvando...
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
