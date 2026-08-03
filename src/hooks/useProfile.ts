import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  is_premium: boolean;
  premium_until: string | null;
  onboarding_completed_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "name" | "avatar_url" | "onboarding_completed_at">>) => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Usuário não autenticado");
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) throw new Error("Use uma imagem JPG, PNG ou WebP");
      if (file.size > 5 * 1024 * 1024) throw new Error("A foto deve ter no máximo 5 MB");

      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const folder = user.id;
      const { data: existing } = await supabase.storage.from("profile-photos").list(folder);
      const path = `${folder}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type });
      if (uploadError) throw uploadError;

      const obsoleteFiles = existing?.filter((item) => `${folder}/${item.name}` !== path) ?? [];
      if (obsoleteFiles.length) {
        await supabase.storage.from("profile-photos").remove(obsoleteFiles.map((item) => `${folder}/${item.name}`));
      }

      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
      await updateMutation.mutateAsync({ avatar_url: avatarUrl });
      return avatarUrl;
    },
  });

  const removeAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data: existing, error: listError } = await supabase.storage.from("profile-photos").list(user.id);
      if (listError) throw listError;
      if (existing?.length) {
        const { error } = await supabase.storage.from("profile-photos").remove(existing.map((item) => `${user.id}/${item.name}`));
        if (error) throw error;
      }
      await updateMutation.mutateAsync({ avatar_url: null });
    },
  });

  return {
    profile: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateProfile: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    completeOnboarding: () => updateMutation.mutateAsync({ onboarding_completed_at: new Date().toISOString() }),
    restartOnboarding: () => updateMutation.mutateAsync({ onboarding_completed_at: null }),
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    removeAvatar: removeAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending || removeAvatarMutation.isPending,
  };
}
