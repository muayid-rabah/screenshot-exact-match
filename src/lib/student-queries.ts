import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function must<T>(p: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data as T;
}

export const dashboardQuery = queryOptions({
  queryKey: ["student-dashboard"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("غير مسجل الدخول");
    const [profile, records, terms, exams, deadlines, notifications] = await Promise.all([
      must(supabase.from("profiles").select("*").eq("id", u.user.id).single()),
      must(supabase.from("student_records").select("*, course:courses(id, code, name, credits, category, course_sessions(*))")),
      must(supabase.from("academic_terms").select("*").order("code")),
      must(supabase.from("exams").select("*, course:courses(code, name)").order("starts_at")),
      must(supabase.from("deadlines").select("*").order("due_at")),
      must(supabase.from("notifications").select("*").order("created_at", { ascending: false })),
    ]);
    return { profile, records, terms, exams, deadlines, notifications, fetchedAt: new Date().toISOString() };
  },
});
