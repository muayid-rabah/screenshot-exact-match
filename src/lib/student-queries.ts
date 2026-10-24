import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

async function must<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

async function getUser() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("غير مسجل الدخول");
  return u.user;
}

export const dashboardQuery = queryOptions({
  queryKey: ["student-dashboard"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records, terms, exams, deadlines, notifications] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
      must(supabase.from("academic_terms").select("*").order("code")),
      must(supabase.from("exams").select("*, course:courses(code, name)").order("starts_at")),
      must(supabase.from("deadlines").select("*").order("due_at")),
      must(supabase.from("notifications").select("*").order("created_at", { ascending: false })),
    ]);
    return { profile: profile as unknown as Tables<"profiles">, records, terms, exams, deadlines, notifications, fetchedAt: new Date().toISOString() };
  },
});

export const scheduleQuery = queryOptions({
  queryKey: ["student-schedule"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))").eq("status", "current")),
    ]);
    const { data: currentTerm } = await supabase.from("academic_terms").select("*").eq("is_current", true).maybeSingle();
    const notifications = await must(supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false));
    return { profile: profile as unknown as Tables<"profiles">, records, currentTerm, unread: notifications.length };
  },
});

export const gradesQuery = queryOptions({
  queryKey: ["student-grades"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records, terms] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
      must(supabase.from("academic_terms").select("*").order("code")),
    ]);
    const notifications = await must(supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false));
    return { profile: profile as unknown as Tables<"profiles">, records, terms, unread: notifications.length };
  },
});

export const planQuery = queryOptions({
  queryKey: ["student-plan"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records, allCourses, terms] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
      must(supabase.from("courses").select("*").order("code")),
      must(supabase.from("academic_terms").select("*").order("code")),
    ]);
    const notifications = await must(supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false));
    return { profile: profile as unknown as Tables<"profiles">, records, allCourses, terms, unread: notifications.length };
  },
});

export const profileQuery = queryOptions({
  queryKey: ["student-profile"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
    ]);
    const notifications = await must(supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false));
    return { profile: profile as unknown as Tables<"profiles">, records, unread: notifications.length };
  },
});

export const registrationQuery = queryOptions({
  queryKey: ["student-registration"],
  queryFn: async () => {
    const user = await getUser();
    const [profile, records, allCourses, terms] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
      must(supabase.from("courses").select("*").order("code")),
      must(supabase.from("academic_terms").select("*").order("code")),
    ]);
    const notifications = await must(supabase.from("notifications").select("*").eq("user_id", user.id).eq("is_read", false));
    return { profile: profile as unknown as Tables<"profiles">, records, allCourses, terms, unread: notifications.length };
  },
});

