import { DistrictAggregationSection } from "@/components/district-aggregation-section";
import { MapFilters } from "@/components/map-filters";
import { SchoolMap } from "@/components/school-map";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { District, Province, Regency, School, DistrictBoundary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    bentuk?: string;
    status?: string;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const params = await searchParams;

  const [{ data: provinces }, { data: regencies }, { data: districts }] = await Promise.all([
    supabase.from("provinces").select("code,name").order("name").returns<Province[]>(),
    supabase.from("regencies").select("code,name,province_code").order("name").returns<Regency[]>(),
    supabase.from("districts").select("code,name,regency_code").order("name").returns<District[]>(),
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
    const distRegency = (regencies ?? []).find((r) => r.code === districtData.regency_code);
    if (!distRegency || distRegency.province_code !== provinsi) {
      kecamatan = "";
    }
  }

  let schoolsQuery = supabase
    .from("schools")
    .select(
      "id,nama_sekolah,npsn,bentuk_pendidikan,status,jumlah_siswa,jumlah_mahasiswa_stekom,ruang_kelas,latitude,longitude,link_dapodik,link_google_maps,province_code,regency_code,district_code,created_at,updated_at,districts(name,regencies(name,provinces(name)))",
    )
    .order("nama_sekolah");

  if (provinsi) schoolsQuery = schoolsQuery.eq("province_code", provinsi);
  if (kabupaten) schoolsQuery = schoolsQuery.eq("regency_code", kabupaten);
  if (kecamatan) schoolsQuery = schoolsQuery.eq("district_code", kecamatan);
  if (bentuk) schoolsQuery = schoolsQuery.eq("bentuk_pendidikan", bentuk);
  if (status) schoolsQuery = schoolsQuery.eq("status", status);

  const { data: schools } = await schoolsQuery.returns<School[]>();
  const items = schools ?? [];

  let boundaries: DistrictBoundary[] = [];
  if (kabupaten || kecamatan) {
    let boundaryQuery = supabase
      .from("district_boundaries")
      .select("id,district_code,regency_code,province_code,name,simplified_geojson,center_lat,center_lng,area_sqkm");
    
    if (kecamatan) {
      boundaryQuery = boundaryQuery.eq("district_code", kecamatan);
    } else if (kabupaten) {
      boundaryQuery = boundaryQuery.eq("regency_code", kabupaten);
    }
    
    const { data: bData } = await boundaryQuery.returns<DistrictBoundary[]>();
    boundaries = bData ?? [];
  }

  const totalSchools = items.length;
  const totalStudents = items.reduce((sum, school) => sum + school.jumlah_siswa, 0);
  const totalStekomStudents = items.reduce((sum, school) => sum + school.jumlah_mahasiswa_stekom, 0);

  const byType = items.reduce<Record<string, number>>((acc, school) => {
    acc[school.bentuk_pendidikan] = (acc[school.bentuk_pendidikan] ?? 0) + 1;
    return acc;
  }, {});

  const byStatus = items.reduce<Record<string, number>>((acc, school) => {
    acc[school.status] = (acc[school.status] ?? 0) + 1;
    return acc;
  }, {});

  const byDistrict = items
    .reduce<
      Record<
        string,
        {
          districtName: string;
          regencyName: string;
          total: number;
          students: number;
          stekomStudents: number;
        }
      >
    >((acc, school) => {
      const key = school.district_code;
      if (!acc[key]) {
        acc[key] = {
          districtName: school.districts?.name ?? "-",
          regencyName: school.districts?.regencies?.name ?? "-",
          total: 0,
          students: 0,
          stekomStudents: 0,
        };
      }

      acc[key].total += 1;
      acc[key].students += school.jumlah_siswa;
      acc[key].stekomStudents += school.jumlah_mahasiswa_stekom;
      return acc;
    }, {});

  const districtAggregations = Object.values(byDistrict).sort((a, b) => b.total - a.total);

  return (
    <div className="px-6 py-6">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700">Peta Sekolah</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">Sebaran Sekolah Jawa Tengah</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Marker diambil dari koordinat sekolah yang diinput admin.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <Metric label="Total Sekolah" value={totalSchools} />
          <Metric label="Total Siswa" value={totalStudents} />
          <Metric label="Mahasiswa STEKOM" value={totalStekomStudents} />
          <Metric label="SMA" value={byType.SMA ?? 0} />
          <Metric label="SMK" value={byType.SMK ?? 0} />
          <Metric label="MA" value={byType.MA ?? 0} />
          <Metric label="Negeri" value={byStatus.Negeri ?? 0} />
          <Metric label="Swasta" value={byStatus.Swasta ?? 0} />
        </div>
      </header>

      <MapFilters
        provinces={provinces ?? []}
        regencies={regencies ?? []}
        districts={districts ?? []}
        filters={{
          provinsi: provinsi || undefined,
          kabupaten: kabupaten || undefined,
          kecamatan: kecamatan || undefined,
          bentuk: bentuk || undefined,
          status: status || undefined,
        }}
      />

      <div className="mb-6">
        <SchoolMap schools={items} boundaries={boundaries} aggregations={byDistrict} />
      </div>

      {districtAggregations.length > 0 ? <DistrictAggregationSection rows={districtAggregations} /> : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm min-w-24">
      <p className="text-xs text-slate-500 whitespace-nowrap">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-950">{value.toLocaleString("id-ID")}</p>
    </div>
  );
}
