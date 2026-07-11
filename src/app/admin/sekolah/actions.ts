"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseImportFile, validateImportRows, validateUpdateRows } from "@/lib/import/school-import";
import { schoolSchema } from "@/lib/schools/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function emptyToNull(value: string | undefined) {
  return value && value.length > 0 ? value : null;
}

async function getActor() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  return { supabase, user };
}

async function validateRegionHierarchy(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  provinceCode: string,
  regencyCode: string,
  districtCode: string,
) {
  const { data: district } = await supabase
    .from("districts")
    .select("code,regency_code,regencies(code,province_code)")
    .eq("code", districtCode)
    .single<{
      code: string;
      regency_code: string;
      regencies: { code: string; province_code: string } | null;
    }>();

  return Boolean(
    district &&
      district.regency_code === regencyCode &&
      district.regencies?.code === regencyCode &&
      district.regencies.province_code === provinceCode,
  );
}

export async function createSchoolAction(formData: FormData) {
  const parsed = schoolSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Data tidak valid";
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  const { supabase, user } = await getActor();
  const values = parsed.data;

  const isValidRegion = await validateRegionHierarchy(
    supabase,
    values.province_code,
    values.regency_code,
    values.district_code,
  );

  if (!isValidRegion) {
    redirect("/admin/sekolah?error=Kombinasi provinsi, kabupaten/kota, dan kecamatan tidak valid");
  }

  const payload = {
    ...values,
    link_dapodik: emptyToNull(values.link_dapodik),
    link_google_maps: emptyToNull(values.link_google_maps),
    created_by: user.id,
    updated_by: user.id,
  };

  const { data, error } = await supabase.from("schools").insert(payload).select("*").single();

  if (error) {
    const message = error.code === "23505" ? "NPSN sudah ada" : error.message;
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "create_school",
    entity_type: "school",
    entity_id: data.id,
    after_data: data,
  });

  revalidatePath("/admin/sekolah");
  revalidatePath("/admin/peta");
  redirect("/admin/sekolah?success=Data sekolah berhasil ditambahkan");
}

export async function deleteSchoolAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/sekolah?error=ID sekolah tidak ditemukan");
  }

  const { supabase, user } = await getActor();
  const { data: beforeData } = await supabase.from("schools").select("*").eq("id", id).single();
  const { error } = await supabase.from("schools").delete().eq("id", id);

  if (error) {
    redirect(`/admin/sekolah?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "delete_school",
    entity_type: "school",
    entity_id: id,
    before_data: beforeData,
  });

  revalidatePath("/admin/sekolah");
  revalidatePath("/admin/peta");
  redirect("/admin/sekolah?success=Data sekolah berhasil dihapus");
}

export async function updateSchoolAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/admin/sekolah?error=ID sekolah tidak ditemukan");
  }

  const parsed = schoolSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Data tidak valid";
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  const { supabase, user } = await getActor();
  const { data: beforeData, error: beforeError } = await supabase.from("schools").select("*").eq("id", id).single();

  if (beforeError || !beforeData) {
    redirect("/admin/sekolah?error=Data sekolah tidak ditemukan");
  }

  const values = parsed.data;

  const isValidRegion = await validateRegionHierarchy(
    supabase,
    values.province_code,
    values.regency_code,
    values.district_code,
  );

  if (!isValidRegion) {
    redirect("/admin/sekolah?error=Kombinasi provinsi, kabupaten/kota, dan kecamatan tidak valid");
  }

  const payload = {
    ...values,
    link_dapodik: emptyToNull(values.link_dapodik),
    link_google_maps: emptyToNull(values.link_google_maps),
    updated_by: user.id,
  };

  const { data, error } = await supabase.from("schools").update(payload).eq("id", id).select("*").single();

  if (error) {
    const message = error.code === "23505" ? "NPSN sudah ada" : error.message;
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "update_school",
    entity_type: "school",
    entity_id: id,
    before_data: beforeData,
    after_data: data,
  });

  revalidatePath("/admin/sekolah");
  revalidatePath("/admin/peta");
  redirect("/admin/sekolah?success=Data sekolah berhasil diperbarui");
}

export async function importSchoolsAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/sekolah?error=File import wajib dipilih");
  }

  if (file.size > 5 * 1024 * 1024) {
    redirect("/admin/sekolah?error=Ukuran file import maksimal 5 MB");
  }

  const { supabase, user } = await getActor();
  let parsedRows;

  try {
    parsedRows = await parseImportFile(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "File import tidak valid";
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  const [{ data: provinces }, { data: regencies }, { data: districts }, { data: existingSchools }] = await Promise.all([
    supabase.from("provinces").select("code,name"),
    supabase.from("regencies").select("code,name,province_code"),
    supabase.from("districts").select("code,name,regency_code"),
    supabase.from("schools").select("npsn"),
  ]);

  const normalizeKey = (val: unknown) => String(val ?? "").trim().toLowerCase().replace(/\s+/g, " ");

  const provinceNameToCode = new Map(
    (provinces ?? []).map((p) => [normalizeKey(p.name), String(p.code)]),
  );
  const regencyKeyToCode = new Map(
    (regencies ?? []).map((r) => [`${r.province_code}:${normalizeKey(r.name)}`, String(r.code)]),
  );
  const districtKeyToCode = new Map(
    (districts ?? []).map((d) => [`${d.regency_code}:${normalizeKey(d.name)}`, String(d.code)]),
  );

  const existingNpsn = new Set((existingSchools ?? []).map((school) => String(school.npsn)));
  const { valid, rejected } = validateImportRows(
    parsedRows,
    provinceNameToCode,
    regencyKeyToCode,
    districtKeyToCode,
    existingNpsn,
  );

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      filename: file.name,
      total_rows: parsedRows.length,
      success_rows: 0,
      failed_rows: 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirect(`/admin/sekolah?error=${encodeURIComponent(batchError?.message ?? "Gagal membuat batch import")}`);
  }

  const rejectedRows = [...rejected];
  let successRows = 0;

  for (const row of valid) {
    const payload = {
      ...row.values,
      link_dapodik: emptyToNull(row.values.link_dapodik),
      link_google_maps: emptyToNull(row.values.link_google_maps),
      created_by: user.id,
      updated_by: user.id,
    };

    const { error } = await supabase.from("schools").insert(payload);

    if (error) {
      rejectedRows.push({
        rowNumber: row.rowNumber,
        npsn: row.values.npsn,
        nama_sekolah: row.values.nama_sekolah,
        reason: error.code === "23505" ? "NPSN sudah ada di database" : error.message,
        raw_data: row.raw,
      });
      continue;
    }

    successRows += 1;
  }

  if (rejectedRows.length > 0) {
    await supabase.from("import_rejected_rows").insert(
      rejectedRows.map((row) => ({
        batch_id: batch.id,
        row_number: row.rowNumber,
        npsn: row.npsn,
        nama_sekolah: row.nama_sekolah,
        reason: row.reason,
        raw_data: row.raw_data,
      })),
    );
  }

  await supabase
    .from("import_batches")
    .update({
      success_rows: successRows,
      failed_rows: rejectedRows.length,
    })
    .eq("id", batch.id);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "import_schools",
    entity_type: "import_batch",
    entity_id: batch.id,
    after_data: {
      filename: file.name,
      total_rows: parsedRows.length,
      success_rows: successRows,
      failed_rows: rejectedRows.length,
    },
  });

  revalidatePath("/admin/sekolah");
  revalidatePath("/admin/peta");
  redirect(
    `/admin/sekolah?success=${encodeURIComponent(
      `Import selesai: ${successRows} berhasil, ${rejectedRows.length} gagal`,
    )}&importBatch=${batch.id}`,
  );
}

export async function updateSchoolsFromFileAction(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/sekolah?error=File update wajib dipilih");
  }

  if (file.size > 5 * 1024 * 1024) {
    redirect("/admin/sekolah?error=Ukuran file update maksimal 5 MB");
  }

  const { supabase, user } = await getActor();
  let parsedRows;

  try {
    parsedRows = await parseImportFile(file);
  } catch (error) {
    const message = error instanceof Error ? error.message : "File update tidak valid";
    redirect(`/admin/sekolah?error=${encodeURIComponent(message)}`);
  }

  const [{ data: provinces }, { data: regencies }, { data: districts }, { data: existingSchools }] = await Promise.all([
    supabase.from("provinces").select("code,name"),
    supabase.from("regencies").select("code,name,province_code"),
    supabase.from("districts").select("code,name,regency_code"),
    supabase.from("schools").select("npsn"),
  ]);

  const normalizeKey = (val: unknown) => String(val ?? "").trim().toLowerCase().replace(/\s+/g, " ");

  const provinceNameToCode = new Map((provinces ?? []).map((p) => [normalizeKey(p.name), String(p.code)]));
  const regencyKeyToCode = new Map(
    (regencies ?? []).map((r) => [`${r.province_code}:${normalizeKey(r.name)}`, String(r.code)]),
  );
  const districtKeyToCode = new Map(
    (districts ?? []).map((d) => [`${d.regency_code}:${normalizeKey(d.name)}`, String(d.code)]),
  );

  const existingNpsn = new Set((existingSchools ?? []).map((school) => String(school.npsn)));
  const { valid, rejected } = validateUpdateRows(
    parsedRows,
    provinceNameToCode,
    regencyKeyToCode,
    districtKeyToCode,
    existingNpsn,
  );

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      filename: file.name,
      total_rows: parsedRows.length,
      success_rows: 0,
      failed_rows: 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirect(`/admin/sekolah?error=${encodeURIComponent(batchError?.message ?? "Gagal membuat batch update")}`);
  }

  const rejectedRows = [...rejected];
  let successRows = 0;

  for (const row of valid) {
    const payload = {
      ...row.values,
      link_dapodik: emptyToNull(row.values.link_dapodik),
      link_google_maps: emptyToNull(row.values.link_google_maps),
      updated_by: user.id,
    };

    const { error } = await supabase.from("schools").update(payload).eq("npsn", row.values.npsn);

    if (error) {
      rejectedRows.push({
        rowNumber: row.rowNumber,
        npsn: row.values.npsn,
        nama_sekolah: row.values.nama_sekolah,
        reason: error.message,
        raw_data: row.raw,
      });
      continue;
    }

    successRows += 1;
  }

  if (rejectedRows.length > 0) {
    await supabase.from("import_rejected_rows").insert(
      rejectedRows.map((row) => ({
        batch_id: batch.id,
        row_number: row.rowNumber,
        npsn: row.npsn,
        nama_sekolah: row.nama_sekolah,
        reason: row.reason,
        raw_data: row.raw_data,
      })),
    );
  }

  await supabase
    .from("import_batches")
    .update({
      success_rows: successRows,
      failed_rows: rejectedRows.length,
    })
    .eq("id", batch.id);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    actor_email: user.email,
    action: "update_schools_from_file",
    entity_type: "import_batch",
    entity_id: batch.id,
    after_data: {
      filename: file.name,
      total_rows: parsedRows.length,
      success_rows: successRows,
      failed_rows: rejectedRows.length,
    },
  });

  revalidatePath("/admin/sekolah");
  revalidatePath("/admin/peta");
  redirect(
    `/admin/sekolah?success=${encodeURIComponent(
      `Update selesai: ${successRows} berhasil, ${rejectedRows.length} gagal`,
    )}&importBatch=${batch.id}`,
  );
}
