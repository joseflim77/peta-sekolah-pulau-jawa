import { ExternalLink } from "lucide-react";

import { DeleteSchoolButton } from "@/components/delete-school-button";
import { EditSchoolModal } from "@/components/edit-school-modal";
import { SchoolEntryPanel } from "@/components/school-entry-panel";
import { SchoolTableFilters } from "@/components/school-table-filters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { District, Province, Regency, School } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    importBatch?: string;
    q?: string;
    bentuk?: string;
    status?: string;
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const [{ data: provinces }, { data: regencies }, { data: districts }, importResult] = await Promise.all([
    supabase.from("provinces").select("code,name").order("name").returns<Province[]>(),
    supabase.from("regencies").select("code,name,province_code").order("name").returns<Regency[]>(),
    supabase.from("districts").select("code,name,regency_code").order("name").returns<District[]>(),
    params.importBatch ? getImportResult(supabase, params.importBatch) : Promise.resolve(null),
  ]);

  const allowedBentuk = ["SMA", "SMK", "MA"];
  const allowedStatus = ["Negeri", "Swasta"];

  const bentuk = allowedBentuk.includes(params.bentuk ?? "") ? params.bentuk : "";
  const status = allowedStatus.includes(params.status ?? "") ? params.status : "";

  const provinceCodes = new Set((provinces ?? []).map((p) => p.code));
  const provinsi = provinceCodes.has(params.provinsi ?? "") ? params.provinsi : "";

  const regencyData = (regencies ?? []).find((r) => r.code === params.kabupaten);
  let kabupaten = regencyData ? regencyData.code : "";
  if (provinsi && regencyData && regencyData.province_code !== provinsi) {
    kabupaten = ""; // mismatch
  }

  const districtData = (districts ?? []).find((d) => d.code === params.kecamatan);
  let kecamatan = districtData ? districtData.code : "";
  if (kabupaten && districtData && districtData.regency_code !== kabupaten) {
    kecamatan = ""; // mismatch
  } else if (!kabupaten && provinsi && districtData) {
    // If regency is empty but province is set, ensure district's regency belongs to this province
    const distRegency = (regencies ?? []).find((r) => r.code === districtData.regency_code);
    if (!distRegency || distRegency.province_code !== provinsi) {
      kecamatan = "";
    }
  }

  const rawQ = params.q?.trim() ?? "";
  const q = rawQ.substring(0, 80).replace(/[^\w\s.-]/g, "");

  let schoolsQuery = supabase
    .from("schools")
    .select(
      "id,nama_sekolah,npsn,bentuk_pendidikan,status,jumlah_siswa,jumlah_mahasiswa_stekom,ruang_kelas,latitude,longitude,link_dapodik,link_google_maps,province_code,regency_code,district_code,created_at,updated_at,districts(name,regencies(name,provinces(name)))",
    )
    .order("created_at", { ascending: false });

  if (q) {
    schoolsQuery = schoolsQuery.or(`nama_sekolah.ilike.%${q}%,npsn.ilike.%${q}%`);
  }

  if (bentuk) {
    schoolsQuery = schoolsQuery.eq("bentuk_pendidikan", bentuk);
  }

  if (status) {
    schoolsQuery = schoolsQuery.eq("status", status);
  }

  if (provinsi) {
    schoolsQuery = schoolsQuery.eq("province_code", provinsi);
  }

  if (kabupaten) {
    schoolsQuery = schoolsQuery.eq("regency_code", kabupaten);
  }

  if (kecamatan) {
    schoolsQuery = schoolsQuery.eq("district_code", kecamatan);
  }

  const { data: schools } = await schoolsQuery.returns<School[]>();

  const hasActiveFilter = !!(q || bentuk || status || provinsi || kabupaten || kecamatan);

  const totalStudents = (schools ?? []).reduce((sum, item) => sum + item.jumlah_siswa, 0);
  const totalStekomStudents = (schools ?? []).reduce((sum, item) => sum + item.jumlah_mahasiswa_stekom, 0);

  return (
    <div className="px-6 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Manajemen Data Sekolah</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Data Sekolah Kota Semarang</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Tambahkan sekolah secara manual, cek NPSN, dan kelola data dasar untuk marker peta.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Sekolah" value={schools?.length ?? 0} />
          <Metric label="Siswa" value={totalStudents} />
          <Metric label="Mahasiswa STEKOM" value={totalStekomStudents} />
          <Metric label="Kecamatan" value={districts?.length ?? 0} />
        </div>
      </header>

      {params.error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {params.error}
        </div>
      ) : null}
      {params.success ? (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {params.success}
        </div>
      ) : null}

      <SchoolEntryPanel
        provinces={provinces ?? []}
        regencies={regencies ?? []}
        districts={districts ?? []}
      />

      <SchoolTableFilters
        provinces={provinces ?? []}
        regencies={regencies ?? []}
        districts={districts ?? []}
        filters={{
          q: q || undefined,
          bentuk: bentuk || undefined,
          status: status || undefined,
          provinsi: provinsi || undefined,
          kabupaten: kabupaten || undefined,
          kecamatan: kecamatan || undefined,
        }}
      />

      {importResult ? (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-semibold text-slate-950">Hasil Proses File</p>
            <p className="mt-1 text-sm text-slate-600">
              {importResult.batch.filename}: {importResult.batch.success_rows} berhasil,{" "}
              {importResult.batch.failed_rows} gagal dari {importResult.batch.total_rows} baris.
            </p>
          </div>
          {importResult.rejectedRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Baris</th>
                    <th className="px-4 py-3">NPSN</th>
                    <th className="px-4 py-3">Nama Sekolah</th>
                    <th className="px-4 py-3">Alasan Ditolak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {importResult.rejectedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-slate-600">{row.row_number}</td>
                      <td className="px-4 py-3 text-slate-600">{row.npsn ?? "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{row.nama_sekolah ?? "-"}</td>
                      <td className="px-4 py-3 font-medium text-red-700">{row.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col max-h-[1000px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 px-5 py-4 bg-white">
          <h2 className="text-base font-semibold text-slate-950">Daftar Sekolah</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_#e2e8f0] text-xs uppercase text-slate-500">
              <tr>
                <th className="w-[320px] px-4 py-3">Nama Sekolah</th>
                <th className="px-4 py-3">NPSN</th>
                <th className="px-4 py-3">Bentuk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Siswa</th>
                <th className="px-4 py-3">Mahasiswa STEKOM</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Link</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(schools ?? []).length > 0 ? (
                (schools ?? []).map((school) => (
                  <tr key={school.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="w-[300px] truncate whitespace-nowrap font-medium text-slate-950">
                        {school.nama_sekolah}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{school.npsn}</td>
                    <td className="px-4 py-3 text-slate-600">{school.bentuk_pendidikan}</td>
                    <td className="px-4 py-3 text-slate-600">{school.status}</td>
                    <td className="px-4 py-3 text-slate-600">{school.jumlah_siswa}</td>
                    <td className="px-4 py-3 text-slate-600">{school.jumlah_mahasiswa_stekom}</td>
                    <td className="px-4 py-3 text-slate-600">{school.ruang_kelas}</td>
                    <td className="px-4 py-3 text-slate-600">{school.districts?.name ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {school.link_dapodik ? <TableLink href={school.link_dapodik} label="Dapodik" /> : null}
                        {school.link_google_maps ? <TableLink href={school.link_google_maps} label="Maps" /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <EditSchoolModal
                          provinces={provinces ?? []}
                          regencies={regencies ?? []}
                          districts={districts ?? []}
                          school={school}
                        />
                        <DeleteSchoolButton id={school.id} name={school.nama_sekolah} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={10}>
                    {hasActiveFilter ? "Tidak ada data sekolah yang cocok dengan filter." : "Belum ada data sekolah."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function getImportResult(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  batchId: string,
) {
  const [{ data: batch }, { data: rejectedRows }] = await Promise.all([
    supabase
      .from("import_batches")
      .select("id,filename,total_rows,success_rows,failed_rows,created_at")
      .eq("id", batchId)
      .single<{
        id: string;
        filename: string;
        total_rows: number;
        success_rows: number;
        failed_rows: number;
        created_at: string;
      }>(),
    supabase
      .from("import_rejected_rows")
      .select("id,row_number,npsn,nama_sekolah,reason")
      .eq("batch_id", batchId)
      .order("row_number")
      .returns<
        {
          id: string;
          row_number: number;
          npsn: string | null;
          nama_sekolah: string | null;
          reason: string;
        }[]
      >(),
  ]);

  if (!batch) {
    return null;
  }

  return {
    batch,
    rejectedRows: rejectedRows ?? [],
  };
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-28 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}

function TableLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}
