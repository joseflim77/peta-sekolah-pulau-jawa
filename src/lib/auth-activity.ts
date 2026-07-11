import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthActivityEvent = "login" | "logout" | "timeout";

export async function logAuthActivity({
  supabase,
  eventType,
  user,
  userAgent,
}: {
  supabase: SupabaseClient;
  eventType: AuthActivityEvent;
  user: User;
  userAgent?: string | null;
}) {
  await supabase.from("auth_activity_logs").insert({
    actor_id: user.id,
    actor_email: user.email ?? "unknown",
    event_type: eventType,
    user_agent: userAgent ?? null,
  });
}
