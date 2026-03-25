import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { subDays, format } from "date-fns";

export function useAnalytics(moduleId = null) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessionsByDay, setSessionsByDay] = useState([]);
  const [topModules, setTopModules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch modules owned by teacher
    const { data: teacherModules } = await supabase
      .from("modules")
      .select("id, title")
      .eq("teacher_id", user.id);

    const moduleIds = (teacherModules || []).map((m) => m.id);
    if (!moduleIds.length) {
      setStats({
        totalModules: 0,
        publishedModules: 0,
        totalSessions: 0,
        discoveriesLast7Days: 0,
      });
      setLoading(false);
      return;
    }

    const targetIds = moduleId ? [moduleId] : moduleIds;

    const { data: allModules } = await supabase
      .from("modules")
      .select("id, status")
      .eq("teacher_id", user.id);

    const published = (allModules || []).filter(
      (m) => m.status === "published",
    ).length;

    const { data: allSessions } = await supabase
      .from("student_sessions")
      .select(
        "*, module_id, student_name, started_at, completed_at, object_discoveries(count)",
      )
      .in("module_id", targetIds)
      .order("started_at", { ascending: false });

    const sevenDaysAgo = subDays(new Date(), 7).toISOString();
    const { data: recentDiscoveries } = await supabase
      .from("object_discoveries")
      .select("id, discovered_at, session_id")
      .gte("discovered_at", sevenDaysAgo);

    const sessionIdsInScope = new Set((allSessions || []).map((s) => s.id));
    const discoveriesLast7Days = (recentDiscoveries || []).filter((d) =>
      sessionIdsInScope.has(d.session_id),
    ).length;

    setStats({
      totalModules: (allModules || []).length,
      publishedModules: published,
      totalSessions: (allSessions || []).length,
      discoveriesLast7Days,
    });

    setSessions(allSessions || []);

    // Build sessions-per-day for last 30 days
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i);
      return {
        date: format(d, "MMM d"),
        dateStr: format(d, "yyyy-MM-dd"),
        count: 0,
      };
    });

    (allSessions || []).forEach((s) => {
      const key = s.started_at?.slice(0, 10);
      const day = days.find((d) => d.dateStr === key);
      if (day) day.count += 1;
    });
    setSessionsByDay(days);

    // Top modules by session count
    const countByModule = {};
    (allSessions || []).forEach((s) => {
      countByModule[s.module_id] = (countByModule[s.module_id] || 0) + 1;
    });
    const topList = Object.entries(countByModule)
      .map(([id, count]) => ({
        id,
        title: teacherModules?.find((m) => m.id === id)?.title || "Unknown",
        sessions: count,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 5);
    setTopModules(topList);

    setLoading(false);
  }, [user, moduleId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!cancelled) await fetchAnalytics();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, moduleId]);

  return { stats, sessionsByDay, topModules, sessions, loading };
}
