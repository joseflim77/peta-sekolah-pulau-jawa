import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthActivityLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditLogPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: systemLogs }, { data: authLogs }] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id,actor_email,action,entity_type,entity_id,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("auth_activity_logs")
      .select("id,actor_email,event_type,user_agent,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<AuthActivityLog[]>(),
  ]);

  return (
    <div className="px-6 py-6">
      <p className="text-sm font-medium text-emerald-700">Audit Log</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-950">Riwayat Aktivitas</h1>

      <section className="mt-6 flex flex-col max-h-[400px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4 bg-white">
          <h2 className="text-base font-semibold text-slate-950">Aktivitas di Dalam Sistem</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(systemLogs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.actor_email ?? "-"}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ""}
                  </td>
                </tr>
              ))}
              {(systemLogs ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                    Belum ada aktivitas sistem.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 flex flex-col max-h-[400px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4 bg-white">
          <h2 className="text-base font-semibold text-slate-950">Riwayat Login & Logout Akun</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0] text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Akun</th>
                <th className="px-4 py-3">Aktivitas</th>
                <th className="px-4 py-3">Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(authLogs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(log.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.actor_email}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{formatAuthEvent(log.event_type)}</td>
                  <td className="max-w-md truncate px-4 py-3 text-slate-600" title={log.user_agent ?? undefined}>
                    {log.user_agent ?? "-"}
                  </td>
                </tr>
              ))}
              {(authLogs ?? []).length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={4}>
                    Belum ada riwayat login atau logout.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatAuthEvent(eventType: AuthActivityLog["event_type"]) {
  if (eventType === "login") return "Login";
  if (eventType === "logout") return "Logout";
  return "Logout otomatis";
}
