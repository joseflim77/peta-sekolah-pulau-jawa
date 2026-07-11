import { readSheet } from "read-excel-file/node";

import { schoolSchema } from "@/lib/schools/schema";

export type ParsedImportRow = {
  rowNumber: number;
  raw: Record<string, string>;
};

export type ValidImportRow = {
  rowNumber: number;
  raw: Record<string, string>;
  values: ReturnType<typeof schoolSchema.parse>;
};

export type RejectedImportRow = {
  rowNumber: number;
  npsn: string | null;
  nama_sekolah: string | null;
  reason: string;
  raw_data: Record<string, string>;
};

const expectedHeaders = [
  "nama_sekolah",
  "npsn",
  "bentuk_pendidikan",
  "status",
  "jumlah_siswa",
  "jumlah_mahasiswa_stekom",
  "ruang_kelas",
  "koordinat",
  "provinsi",
  "kabupaten_kota",
  "kecamatan",
  "link_dapodik",
  "link_google_maps",
];

export async function parseImportFile(file: File): Promise<ParsedImportRow[]> {
  const lowerName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (lowerName.endsWith(".csv")) {
    return rowsToObjects(parseCsv(buffer.toString("utf8")));
  }

  if (lowerName.endsWith(".xlsx")) {
    const rows = await readSheet(buffer);
    return rowsToObjects(rows.map((row) => row.map((cellValue) => stringifyCell(cellValue))));
  }

  if (lowerName.endsWith(".xls")) {
    return rowsToObjects(parseSpreadsheetXml(buffer.toString("utf8")));
  }

  throw new Error("Format file harus CSV, XLS, atau XLSX");
}

export function validateImportRows(
  rows: ParsedImportRow[],
  provinceNameToCode: Map<string, string>,
  regencyKeyToCode: Map<string, string>,
  districtKeyToCode: Map<string, string>,
  existingNpsn: Set<string>,
) {
  const valid: ValidImportRow[] = [];
  const rejected: RejectedImportRow[] = [];
  const seenInFile = new Set<string>();

  for (const row of rows) {
    const npsn = normalizeValue(row.raw.npsn);
    const namaSekolah = normalizeValue(row.raw.nama_sekolah);
    const rawProvinsi = normalizeKey(row.raw.provinsi);
    const rawKabupaten = normalizeKey(row.raw.kabupaten_kota);
    const rawKecamatan = normalizeKey(row.raw.kecamatan);

    if (!npsn) {
      rejected.push(toRejected(row, "NPSN wajib diisi"));
      continue;
    }

    if (existingNpsn.has(npsn)) {
      rejected.push(toRejected(row, "NPSN sudah ada di database"));
      continue;
    }

    if (seenInFile.has(npsn)) {
      rejected.push(toRejected(row, "NPSN duplicate dalam file import"));
      continue;
    }

    const provinceCode = provinceNameToCode.get(rawProvinsi);
    if (!provinceCode) {
      rejected.push(toRejected(row, "Provinsi tidak cocok dengan master data"));
      continue;
    }

    const regencyKey = `${provinceCode}:${rawKabupaten}`;
    const regencyCode = regencyKeyToCode.get(regencyKey);
    if (!regencyCode) {
      rejected.push(toRejected(row, "Kabupaten/Kota tidak cocok dengan master data provinsi tersebut"));
      continue;
    }

    const districtKey = `${regencyCode}:${rawKecamatan}`;
    const districtCode = districtKeyToCode.get(districtKey);
    if (!districtCode) {
      rejected.push(toRejected(row, "Kecamatan tidak cocok dengan master data kabupaten/kota tersebut"));
      continue;
    }

    const parsed = schoolSchema.safeParse({
      nama_sekolah: namaSekolah,
      npsn,
      bentuk_pendidikan: normalizeValue(row.raw.bentuk_pendidikan).toUpperCase(),
      status: toTitleCase(normalizeValue(row.raw.status)),
      jumlah_siswa: normalizeValue(row.raw.jumlah_siswa),
      jumlah_mahasiswa_stekom: normalizeValue(row.raw.jumlah_mahasiswa_stekom),
      ruang_kelas: normalizeValue(row.raw.ruang_kelas),
      koordinat: normalizeValue(row.raw.koordinat),
      province_code: provinceCode,
      regency_code: regencyCode,
      district_code: districtCode,
      link_dapodik: normalizeValue(row.raw.link_dapodik),
      link_google_maps: normalizeValue(row.raw.link_google_maps),
    });

    if (!parsed.success) {
      rejected.push(toRejected(row, parsed.error.issues[0]?.message ?? "Data tidak valid"));
      continue;
    }

    seenInFile.add(npsn);
    valid.push({
      rowNumber: row.rowNumber,
      raw: row.raw,
      values: parsed.data,
    });
  }

  return { valid, rejected };
}

export function validateUpdateRows(
  rows: ParsedImportRow[],
  provinceNameToCode: Map<string, string>,
  regencyKeyToCode: Map<string, string>,
  districtKeyToCode: Map<string, string>,
  existingNpsn: Set<string>,
) {
  const valid: ValidImportRow[] = [];
  const rejected: RejectedImportRow[] = [];
  const seenInFile = new Set<string>();

  for (const row of rows) {
    const npsn = normalizeValue(row.raw.npsn);
    const namaSekolah = normalizeValue(row.raw.nama_sekolah);
    const rawProvinsi = normalizeKey(row.raw.provinsi);
    const rawKabupaten = normalizeKey(row.raw.kabupaten_kota);
    const rawKecamatan = normalizeKey(row.raw.kecamatan);

    if (!npsn) {
      rejected.push(toRejected(row, "NPSN wajib diisi"));
      continue;
    }

    if (!existingNpsn.has(npsn)) {
      rejected.push(toRejected(row, "NPSN tidak ditemukan di database"));
      continue;
    }

    if (seenInFile.has(npsn)) {
      rejected.push(toRejected(row, "NPSN duplicate dalam file update"));
      continue;
    }

    const provinceCode = provinceNameToCode.get(rawProvinsi);
    if (!provinceCode) {
      rejected.push(toRejected(row, "Provinsi tidak cocok dengan master data"));
      continue;
    }

    const regencyKey = `${provinceCode}:${rawKabupaten}`;
    const regencyCode = regencyKeyToCode.get(regencyKey);
    if (!regencyCode) {
      rejected.push(toRejected(row, "Kabupaten/Kota tidak cocok dengan master data provinsi tersebut"));
      continue;
    }

    const districtKey = `${regencyCode}:${rawKecamatan}`;
    const districtCode = districtKeyToCode.get(districtKey);
    if (!districtCode) {
      rejected.push(toRejected(row, "Kecamatan tidak cocok dengan master data kabupaten/kota tersebut"));
      continue;
    }

    const parsed = schoolSchema.safeParse({
      nama_sekolah: namaSekolah,
      npsn,
      bentuk_pendidikan: normalizeValue(row.raw.bentuk_pendidikan).toUpperCase(),
      status: toTitleCase(normalizeValue(row.raw.status)),
      jumlah_siswa: normalizeValue(row.raw.jumlah_siswa),
      jumlah_mahasiswa_stekom: normalizeValue(row.raw.jumlah_mahasiswa_stekom),
      ruang_kelas: normalizeValue(row.raw.ruang_kelas),
      koordinat: normalizeValue(row.raw.koordinat),
      province_code: provinceCode,
      regency_code: regencyCode,
      district_code: districtCode,
      link_dapodik: normalizeValue(row.raw.link_dapodik),
      link_google_maps: normalizeValue(row.raw.link_google_maps),
    });

    if (!parsed.success) {
      rejected.push(toRejected(row, parsed.error.issues[0]?.message ?? "Data tidak valid"));
      continue;
    }

    seenInFile.add(npsn);
    valid.push({
      rowNumber: row.rowNumber,
      raw: row.raw,
      values: parsed.data,
    });
  }

  return { valid, rejected };
}

function rowsToObjects(rows: string[][]) {
  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    return [];
  }

  const headers = headerRow.map((header) => normalizeHeader(header));
  const missingHeaders = expectedHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Kolom template tidak lengkap: ${missingHeaders.join(", ")}`);
  }

  return dataRows
    .map((row, index) => {
      const raw = Object.fromEntries(headers.map((header, cellIndex) => [header, normalizeValue(row[cellIndex])]));
      return {
        rowNumber: index + 2,
        raw,
      };
    })
    .filter((row) => Object.values(row.raw).some((value) => value.length > 0));
}

function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const nextChar = input[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function parseSpreadsheetXml(input: string) {
  const tableMatch = input.match(/<Worksheet[^>]*ss:Name="Template Sekolah"[\s\S]*?<Table>([\s\S]*?)<\/Table>/);
  const tableContent = tableMatch?.[1] ?? input;
  const rows = tableContent.match(/<Row[\s\S]*?<\/Row>/g) ?? [];

  return rows.map((row) => {
    const cells = row.match(/<Cell[\s\S]*?<\/Cell>/g) ?? [];
    return cells.map((cell) => {
      const data = cell.match(/<Data[^>]*>([\s\S]*?)<\/Data>/)?.[1] ?? "";
      return unescapeXml(data);
    });
  });
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function normalizeHeader(value: string) {
  return normalizeValue(value).toLowerCase().replace(/\s+/g, "_");
}

function normalizeValue(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeKey(value: unknown) {
  return normalizeValue(value).toLowerCase().replace(/\s+/g, " ");
}

function toTitleCase(value: string) {
  const lower = value.toLowerCase();
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
}

function toRejected(row: ParsedImportRow, reason: string): RejectedImportRow {
  return {
    rowNumber: row.rowNumber,
    npsn: normalizeValue(row.raw.npsn) || null,
    nama_sekolah: normalizeValue(row.raw.nama_sekolah) || null,
    reason,
    raw_data: row.raw,
  };
}

function unescapeXml(value: string) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}
