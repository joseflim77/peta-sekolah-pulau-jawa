import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const API_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";
const PROVINCE_ID = "33";

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SECRET_KEY wajib tersedia di .env.local");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function normalizeCode(code) {
  return String(code).replaceAll(".", "");
}

function normalizeDistrictCode(code) {
  const normalized = normalizeCode(code);
  return normalized.length === 7 && normalized.endsWith("0") ? normalized.slice(0, -1) : normalized;
}

function toTitleCaseName(name) {
  return String(name)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function fetchJson(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Gagal fetch ${path}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function upsertChunk(table, rows, onConflict) {
  const size = 500;

  for (let index = 0; index < rows.length; index += size) {
    const chunk = rows.slice(index, index + size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });

    if (error) {
      throw new Error(`Gagal upsert ${table}: ${error.message}`);
    }
  }
}

function toSqlValues(rows, columns) {
  return rows
    .map((row) => `(${columns.map((column) => quoteSql(row[column])).join(", ")})`)
    .join(",\n");
}

function quoteSql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const province = {
  code: "33",
  name: "Jawa Tengah",
};

const regenciesSource = await fetchJson(`/regencies/${PROVINCE_ID}.json`);
const regencies = regenciesSource.map((regency) => ({
  code: normalizeCode(regency.id),
  province_code: province.code,
  name: toTitleCaseName(regency.name),
}));

const districts = [];

for (const regency of regenciesSource) {
  const districtSource = await fetchJson(`/districts/${regency.id}.json`);
  districts.push(
    ...districtSource.map((district) => ({
      code: normalizeDistrictCode(district.id),
      regency_code: normalizeCode(regency.id),
      name: toTitleCaseName(district.name),
    })),
  );
}

await upsertChunk("provinces", [province], "code");
await upsertChunk("regencies", regencies, "code");
await upsertChunk("districts", districts, "code");

await fs.mkdir("supabase", { recursive: true });
await fs.writeFile(
  "supabase/seed_jawa_tengah.sql",
  `insert into public.provinces (code, name)
values
${toSqlValues([province], ["code", "name"])}
on conflict (code) do update set name = excluded.name;

insert into public.regencies (code, province_code, name)
values
${toSqlValues(regencies, ["code", "province_code", "name"])}
on conflict (code) do update
set province_code = excluded.province_code,
    name = excluded.name;

insert into public.districts (code, regency_code, name)
values
${toSqlValues(districts, ["code", "regency_code", "name"])}
on conflict (code) do update
set regency_code = excluded.regency_code,
    name = excluded.name;
`,
);

console.log(
  JSON.stringify(
    {
      source: "https://emsifa.github.io/api-wilayah-indonesia/",
      province: 1,
      regencies: regencies.length,
      districts: districts.length,
      sampleRegencies: regencies.slice(0, 5),
      sampleDistricts: districts.slice(0, 5),
    },
    null,
    2,
  ),
);
