import { z } from "zod";

const coordinateSchema = z
  .string()
  .trim()
  .min(1, "Koordinat wajib diisi")
  .transform((value, ctx) => {
    const parts = value.split(",").map((part) => part.trim());

    if (parts.length !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "Koordinat harus memakai format latitude, longitude",
      });
      return z.NEVER;
    }

    const latitude = Number(parts[0]);
    const longitude = Number(parts[1]);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      ctx.addIssue({
        code: "custom",
        message: "Latitude tidak valid",
      });
      return z.NEVER;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      ctx.addIssue({
        code: "custom",
        message: "Longitude tidak valid",
      });
      return z.NEVER;
    }

    return { latitude, longitude };
  });

export const schoolSchema = z.object({
  nama_sekolah: z.string().trim().min(3, "Nama sekolah wajib diisi"),
  npsn: z.string().trim().min(4, "NPSN wajib diisi"),
  bentuk_pendidikan: z.enum(["SMA", "SMK", "MA"]),
  status: z.enum(["Negeri", "Swasta"]),
  jumlah_siswa: z.coerce.number().int().min(0),
  jumlah_mahasiswa_stekom: z.coerce.number().int().min(0),
  ruang_kelas: z.coerce.number().int().min(0),
  koordinat: coordinateSchema,
  province_code: z.string().trim().min(1),
  regency_code: z.string().trim().min(1),
  district_code: z.string().trim().min(1),
  link_dapodik: z.string().trim().url().optional().or(z.literal("")),
  link_google_maps: z.string().trim().url().optional().or(z.literal("")),
}).transform(({ koordinat, ...values }) => ({
  ...values,
  latitude: koordinat.latitude,
  longitude: koordinat.longitude,
}));

export type SchoolFormValues = z.infer<typeof schoolSchema>;
