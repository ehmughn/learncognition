import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModules = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("*, objects(count)")
      .eq("teacher_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setModules(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchModules();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function createModule(payload) {
    const { data, error } = await supabase
      .from("modules")
      .insert({ ...payload, teacher_id: user.id })
      .select()
      .single();
    if (!error) setModules((prev) => [data, ...prev]);
    return { data, error };
  }

  async function updateModule(id, payload) {
    const { data, error } = await supabase
      .from("modules")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (!error) setModules((prev) => prev.map((m) => (m.id === id ? data : m)));
    return { data, error };
  }

  async function deleteModule(id) {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (!error) setModules((prev) => prev.filter((m) => m.id !== id));
    return { error };
  }

  async function duplicateModule(id) {
    const original = modules.find((m) => m.id === id);
    if (!original) return { error: { message: "Module not found" } };

    const { data: newModule, error: modErr } = await supabase
      .from("modules")
      .insert({
        teacher_id: user.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        subject: original.subject,
        difficulty: original.difficulty,
        cover_image_url: original.cover_image_url,
        is_sequential: original.is_sequential,
        status: "draft",
      })
      .select()
      .single();

    if (modErr) return { error: modErr };

    const { data: originalObjects } = await supabase
      .from("objects")
      .select("*")
      .eq("module_id", id);

    if (originalObjects?.length) {
      // eslint-disable-next-line no-unused-vars
      const copies = originalObjects.map(
        ({ id: _i, module_id: _m, ...rest }) => ({
          ...rest,
          module_id: newModule.id,
        }),
      );
      await supabase.from("objects").insert(copies);
    }

    setModules((prev) => [
      { ...newModule, objects: [{ count: originalObjects?.length || 0 }] },
      ...prev,
    ]);
    return { data: newModule };
  }

  async function uploadCoverImage(file) {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("module-covers")
      .upload(path, file);
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("module-covers").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    duplicateModule,
    uploadCoverImage,
  };
}

export function useModuleDetail(id) {
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModule = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("id", id)
      .single();
    if (error) setError(error.message);
    else setModule(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchModule();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { module, setModule, loading, error, refetch: fetchModule };
}
