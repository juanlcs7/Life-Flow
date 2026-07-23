import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export type CardId = "finances" | "tasks" | "goals" | "health" | "agenda" | "history";
export type CardSize = "small" | "medium" | "large";

export interface DashboardPreferences {
  id: string;
  user_id: string;
  card_order: CardId[];
  visible_cards: CardId[];
  card_sizes: Record<CardId, CardSize>;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CARD_ORDER: CardId[] = ["finances", "tasks", "goals", "health", "agenda", "history"];
const DEFAULT_VISIBLE_CARDS: CardId[] = ["finances", "tasks", "goals", "health", "agenda", "history"];
const DEFAULT_CARD_SIZES: Record<CardId, CardSize> = {
  finances: "medium",
  tasks: "medium",
  goals: "medium",
  health: "small",
  agenda: "small",
  history: "small",
};

export function useDashboardPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard_preferences", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("dashboard_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Return defaults if no preferences exist
        return {
          card_order: DEFAULT_CARD_ORDER,
          visible_cards: DEFAULT_VISIBLE_CARDS,
          card_sizes: DEFAULT_CARD_SIZES,
        };
      }

      return {
        ...data,
        card_order: (data.card_order as unknown as CardId[]) || DEFAULT_CARD_ORDER,
        visible_cards: (data.visible_cards as unknown as CardId[]) || DEFAULT_VISIBLE_CARDS,
        card_sizes: (data.card_sizes as unknown as Record<CardId, CardSize>) || DEFAULT_CARD_SIZES,
      };
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (preferences: {
      card_order: CardId[];
      visible_cards: CardId[];
      card_sizes: Record<CardId, CardSize>;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("dashboard_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("dashboard_preferences")
          .update({
            card_order: preferences.card_order as unknown as Json,
            visible_cards: preferences.visible_cards as unknown as Json,
            card_sizes: preferences.card_sizes as unknown as Json,
          })
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("dashboard_preferences")
          .insert({
            user_id: user.id,
            card_order: preferences.card_order as unknown as Json,
            visible_cards: preferences.visible_cards as unknown as Json,
            card_sizes: preferences.card_sizes as unknown as Json,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard_preferences", user?.id] });
    },
  });

  const toggleCard = async (cardId: CardId) => {
    const currentVisible = query.data?.visible_cards || DEFAULT_VISIBLE_CARDS;
    const newVisible = currentVisible.includes(cardId)
      ? currentVisible.filter((id) => id !== cardId)
      : [...currentVisible, cardId];
    
    await saveMutation.mutateAsync({
      card_order: query.data?.card_order || DEFAULT_CARD_ORDER,
      visible_cards: newVisible,
      card_sizes: query.data?.card_sizes || DEFAULT_CARD_SIZES,
    });
  };

  const reorderCards = async (newOrder: CardId[]) => {
    await saveMutation.mutateAsync({
      card_order: newOrder,
      visible_cards: query.data?.visible_cards || DEFAULT_VISIBLE_CARDS,
      card_sizes: query.data?.card_sizes || DEFAULT_CARD_SIZES,
    });
  };

  const setCardSize = async (cardId: CardId, size: CardSize) => {
    const currentSizes = query.data?.card_sizes || DEFAULT_CARD_SIZES;
    await saveMutation.mutateAsync({
      card_order: query.data?.card_order || DEFAULT_CARD_ORDER,
      visible_cards: query.data?.visible_cards || DEFAULT_VISIBLE_CARDS,
      card_sizes: { ...currentSizes, [cardId]: size },
    });
  };

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    error: query.error,
    toggleCard,
    reorderCards,
    setCardSize,
    savePreferences: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
