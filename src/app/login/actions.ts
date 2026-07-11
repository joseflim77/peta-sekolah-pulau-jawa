"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { logAuthActivity } from "@/lib/auth-activity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Email dan password wajib diisi");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=Email atau password tidak valid");
  }

  if (data.user) {
    const requestHeaders = await headers();
    await logAuthActivity({
      supabase,
      eventType: "login",
      user: data.user,
      userAgent: requestHeaders.get("user-agent"),
    });
  }

  redirect("/admin/sekolah");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const requestHeaders = await headers();
    await logAuthActivity({
      supabase,
      eventType: "logout",
      user,
      userAgent: requestHeaders.get("user-agent"),
    });
  }

  await supabase.auth.signOut();
  redirect("/login");
}
