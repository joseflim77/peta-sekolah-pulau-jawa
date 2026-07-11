export type AppRole = "owner" | "admin";
export type SchoolType = "SMA" | "SMK" | "MA";
export type SchoolStatus = "Negeri" | "Swasta";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
};

export type School = {
  id: string;
  nama_sekolah: string;
  npsn: string;
  bentuk_pendidikan: SchoolType;
  status: SchoolStatus;
  jumlah_siswa: number;
  jumlah_mahasiswa_stekom: number;
  ruang_kelas: number;
  latitude: number;
  longitude: number;
  link_dapodik: string | null;
  link_google_maps: string | null;
  province_code: string;
  regency_code: string;
  district_code: string;
  created_at: string;
  updated_at: string;
  districts?: {
    name: string;
    regencies?: {
      name: string;
      provinces?: {
        name: string;
      } | null;
    } | null;
  } | null;
};

export type Province = {
  code: string;
  name: string;
};

export type Regency = {
  code: string;
  province_code: string;
  name: string;
};

export type District = {
  code: string;
  regency_code: string;
  name: string;
};

export type DistrictBoundary = {
  id: string;
  district_code: string;
  regency_code: string;
  province_code: string;
  name: string;
  simplified_geojson: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  center_lat: number | null;
  center_lng: number | null;
  area_sqkm: number | string | null;
};

export type AuthActivityLog = {
  id: string;
  actor_email: string;
  event_type: "login" | "logout" | "timeout";
  user_agent: string | null;
  created_at: string;
};
