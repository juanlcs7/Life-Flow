import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DocumentRow {
  id: string;
  user_id: string;
  name: string;
  folder: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number;
  expiry_date: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useDocuments() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["documents", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DocumentRow[];
    },
    enabled: !!user,
  });

  const upload = useMutation({
    mutationFn: async (input: {
      file: File;
      folder: string;
      expiry_date?: string | null;
      notes?: string | null;
      tags?: string[];
    }) => {
      if (!user) throw new Error("not auth");
      const safe = input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage
        .from("documents")
        .upload(path, input.file, {
          contentType: input.file.type || undefined,
          upsert: false,
        });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("documents").insert({
        user_id: user.id,
        name: input.file.name,
        folder: input.folder || "Geral",
        file_path: path,
        mime_type: input.file.type || null,
        size_bytes: input.file.size,
        expiry_date: input.expiry_date || null,
        notes: input.notes || null,
        tags: input.tags ?? [],
      });
      if (insErr) {
        await supabase.storage.from("documents").remove([path]);
        throw insErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const updateTags = useMutation({
    mutationFn: async (input: { id: string; tags: string[] }) => {
      const { error } = await supabase
        .from("documents")
        .update({ tags: input.tags })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  const remove = useMutation({
    mutationFn: async (doc: DocumentRow) => {
      await supabase.storage.from("documents").remove([doc.file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });

  async function getSignedUrl(path: string) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60 * 10);
    if (error) throw error;
    return data.signedUrl;
  }

  return {
    documents: query.data || [],
    isLoading: query.isLoading,
    upload: upload.mutateAsync,
    isUploading: upload.isPending,
    remove: remove.mutateAsync,
    getSignedUrl,
    updateTags: updateTags.mutateAsync,
  };
}