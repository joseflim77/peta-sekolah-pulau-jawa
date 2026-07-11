import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin-sidebar";
import { IdleTimeout } from "@/components/idle-timeout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) {
    redirect("/login?error=Akun belum memiliki role aplikasi");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <IdleTimeout />
      <AdminSidebar profile={profile} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
