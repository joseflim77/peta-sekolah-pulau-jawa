import fs from "node:fs";
import readline from "node:readline";

const sql = fs.readFileSync("supabase/seed_jawa_tengah.sql", "utf8");

function parseTuples(sectionName) {
  const start = sql.indexOf(`insert into public.${sectionName}`);
  const end = sql.indexOf(";", start);
  const section = sql.slice(start, end);
  const rows = [];
  const regex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g;
  for (const match of section.matchAll(regex)) {
    rows.push({ code: match[1], parentCode: match[2], name: match[3] });
  }
  return rows;
}

const masterRegencies = parseTuples("regencies");
const masterDistricts = parseTuples("districts");
const masterRegencyCodes = new Set(masterRegencies.map((row) => row.code));
const masterDistrictCodes = new Set(masterDistricts.map((row) => row.code));

function normalizePcode(pcode) {
  const code = pcode.replace(/^ID/, "");
  if (code.length === 7 && code.endsWith("0")) return code.slice(0, -1);
  return code;
}

const boundaryRegencies = new Map();
const boundaryDistricts = new Map();
const unmatchedBoundary = [];

const rl = readline.createInterface({
  input: fs.createReadStream("idn_admin_boundaries.geojson/idn_admin3.geojson"),
  crlfDelay: Infinity,
});

for await (const rawLine of rl) {
  let line = rawLine.trim();
  if (!line.startsWith('{"type":"Feature"')) continue;
  if (line.endsWith(",")) line = line.slice(0, -1);

  const { properties: props } = JSON.parse(line);
  if (props.adm1_name !== "Jawa Tengah") continue;

  const regencyCode = normalizePcode(props.adm2_pcode);
  const districtCode = normalizePcode(props.adm3_pcode);
  boundaryRegencies.set(regencyCode, props.adm2_name);
  boundaryDistricts.set(districtCode, {
    name: props.adm3_name,
    regencyCode,
    regencyName: props.adm2_name,
  });

  if (!masterDistrictCodes.has(districtCode)) {
    unmatchedBoundary.push({
      districtCode,
      districtName: props.adm3_name,
      regencyCode,
      regencyName: props.adm2_name,
    });
  }
}

const missingBoundary = masterDistricts
  .filter((row) => !boundaryDistricts.has(row.code))
  .map((row) => ({
    districtCode: row.code,
    districtName: row.name,
    regencyCode: row.parentCode,
    regencyName: masterRegencies.find((regency) => regency.code === row.parentCode)?.name,
  }));

const unmatchedRegencies = [...boundaryRegencies]
  .filter(([code]) => !masterRegencyCodes.has(code))
  .map(([code, name]) => ({ code, name }));

console.log(
  JSON.stringify(
    {
      masterRegencies: masterRegencies.length,
      masterDistricts: masterDistricts.length,
      boundaryRegencies: boundaryRegencies.size,
      boundaryDistricts: boundaryDistricts.size,
      matchedDistricts: masterDistricts.length - missingBoundary.length,
      missingBoundaryCount: missingBoundary.length,
      unmatchedBoundaryCount: unmatchedBoundary.length,
      unmatchedRegencies,
      missingBoundary: missingBoundary.slice(0, 40),
      unmatchedBoundary: unmatchedBoundary.slice(0, 60),
    },
    null,
    2,
  ),
);
