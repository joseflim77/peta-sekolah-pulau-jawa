import { MapPinned } from "lucide-react";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/login/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  if (user) {
    redirect("/admin/sekolah");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_420px]">
        <div className="flex min-h-[460px] flex-col justify-between bg-slate-900 p-8 text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-md bg-emerald-500">
              <MapPinned className="size-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm text-slate-300">Internal Tool</p>
              <h1 className="text-xl font-semibold">Peta Sekolah Pulau Jawa</h1>
            </div>
          </div>

          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
              Fokus awal Jawa Tengah
            </p>
            <p className="mt-4 text-3xl font-semibold leading-tight">
              Kelola data sekolah dan pantau sebarannya dari satu dashboard.
            </p>
          </div>
        </div>

        <form action={loginAction} className="flex flex-col gap-5 p-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Masuk Admin</h2>
            <p className="mt-2 text-sm text-slate-600">
              Gunakan akun yang sudah dibuat oleh owner.
            </p>
          </div>

          {params.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {params.error}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Email
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-slate-950"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              className="h-11 rounded-md border border-slate-300 px-3 text-slate-950"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            className="mt-2 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            Masuk
          </button>
        </form>
      </section>
    </main>
  );
}

