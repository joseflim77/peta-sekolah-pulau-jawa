import type { NextRequest } from "next/server";

import { logAuthActivity } from "@/lib/auth-activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await logAuthActivity({
      supabase,
      eventType: "timeout",
      user,
      userAgent: request.headers.get("user-agent"),
    });
  }

  await supabase.auth.signOut();

  return Response.json({ ok: true });
}
