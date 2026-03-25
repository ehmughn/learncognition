import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export function useObjects(moduleId) {
  const { user } = useAuth();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchObjects = useCallback(async () => {
    if (!moduleId) return;
    setLoading(true);
    const { data } = await supabase
      .from("objects")
      .select("*")
      .eq("module_id", moduleId)
      .order("order_index", { ascending: true });
    setObjects(data || []);
    setLoading(false);
  }, [moduleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchObjects();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  async function createObject(payload) {
    const maxOrder =
      objects.length > 0
        ? Math.max(...objects.map((o) => o.order_index || 0))
        : -1;
    const { data, error } = await supabase
      .from("objects")
      .insert({ ...payload, module_id: moduleId, order_index: maxOrder + 1 })
      .select()
      .single();
    if (!error) setObjects((prev) => [...prev, data]);
    return { data, error };
  }

  async function updateObject(id, payload) {
    const { data, error } = await supabase
      .from("objects")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (!error) setObjects((prev) => prev.map((o) => (o.id === id ? data : o)));
    return { data, error };
  }

  async function deleteObject(id) {
    const { error } = await supabase.from("objects").delete().eq("id", id);
    if (!error) setObjects((prev) => prev.filter((o) => o.id !== id));
    return { error };
  }

  async function reorderObjects(newOrder) {
    setObjects(newOrder);
    const updates = newOrder.map((obj, idx) => ({
      id: obj.id,
      order_index: idx,
    }));
    for (const u of updates) {
      await supabase
        .from("objects")
        .update({ order_index: u.order_index })
        .eq("id", u.id);
    }
  }

  async function uploadObjectImage(file) {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${moduleId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("object-images")
      .upload(path, file);
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("object-images").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  async function uploadObjectAudio(file) {
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${moduleId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("object-audio")
      .upload(path, file);
    if (error) return { url: null, error };
    const { data } = supabase.storage.from("object-audio").getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  }

  return {
    objects,
    loading,
    fetchObjects,
    createObject,
    updateObject,
    deleteObject,
    reorderObjects,
    uploadObjectImage,
    uploadObjectAudio,
  };
}
