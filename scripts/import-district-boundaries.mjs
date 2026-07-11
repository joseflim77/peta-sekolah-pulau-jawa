import fs from "node:fs";
import readline from "node:readline";

const envPath = ".env.local";
const boundaryPath = "idn_admin_boundaries.geojson/idn_admin3.geojson";
const seedPath = "supabase/seed_jawa_tengah.sql";
const targetProvince = "Jawa Tengah";
const targetProvinceCode = "33";
const source = "HDX Indonesia administrative boundaries COD-AB GeoJSON";
const sourceYear = 2026;
const simplifyTolerance = 0.001;
const batchSize = 10;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

function loadEnv(filePath) {
  const env = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    env[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return env;
}

function parseMasterDistrictCodes() {
  const sql = fs.readFileSync(seedPath, "utf8");
  const start = sql.indexOf("insert into public.districts");
  const end = sql.indexOf(";", start);
  const section = sql.slice(start, end);
  const rows = new Map();
  const regex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g;
  for (const match of section.matchAll(regex)) {
    rows.set(match[1], { regencyCode: match[2], name: match[3] });
  }
  return rows;
}

function normalizePcode(pcode) {
  const code = pcode.replace(/^ID/, "");
  if (code.length === 7 && code.endsWith("0")) return code.slice(0, -1);
  return code;
}

function ringToWkt(ring) {
  const coordinates = ring.map(([lng, lat]) => `${lng} ${lat}`);
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  if (first !== last) coordinates.push(first);
  return `(${coordinates.join(",")})`;
}

function geometryToEwkt(geometry) {
  if (geometry.type === "Polygon") {
    const polygon = `(${geometry.coordinates.map(ringToWkt).join(",")})`;
    return `SRID=4326;MULTIPOLYGON(${polygon})`;
  }

  if (geometry.type === "MultiPolygon") {
    const polygons = geometry.coordinates.map((polygon) => `(${polygon.map(ringToWkt).join(",")})`);
    return `SRID=4326;MULTIPOLYGON(${polygons.join(",")})`;
  }

  throw new Error(`Unsupported geometry type: ${geometry.type}`);
}

function perpendicularDistance(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }
  return Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / Math.hypot(dx, dy);
}

function simplifyLine(points, tolerance) {
  if (points.length <= 3) return points;

  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], start, end);
    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance <= tolerance) {
    return [start, end];
  }

  const left = simplifyLine(points.slice(0, index + 1), tolerance);
  const right = simplifyLine(points.slice(index), tolerance);
  return left.slice(0, -1).concat(right);
}

function simplifyRing(ring) {
  const closed = ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];
  const openRing = closed ? ring.slice(0, -1) : ring;
  const simplified = simplifyLine([...openRing, openRing[0]], simplifyTolerance);
  const deduped = simplified.slice(0, -1);
  if (deduped.length < 4) return ring;
  deduped.push(deduped[0]);
  return deduped;
}

function simplifyGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return {
      type: "MultiPolygon",
      coordinates: [geometry.coordinates.map(simplifyRing)],
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((polygon) => polygon.map(simplifyRing)),
    };
  }

  return geometry;
}

async function flushRows(rows, env) {
  if (rows.length === 0) return;
  if (dryRun) return;

  const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/district_boundaries?on_conflict=district_code`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase upsert failed: ${response.status} ${body}`);
  }
}

const env = loadEnv(envPath);
const requiredEnv = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"];
for (const key of requiredEnv) {
  if (!env[key]) throw new Error(`${key} is missing in ${envPath}`);
}

const masterDistricts = parseMasterDistrictCodes();
let accepted = 0;
let skipped = 0;
let flushed = 0;
const batch = [];
const skippedRows = [];

const rl = readline.createInterface({
  input: fs.createReadStream(boundaryPath),
  crlfDelay: Infinity,
});

for await (const rawLine of rl) {
  let line = rawLine.trim();
  if (!line.startsWith('{"type":"Feature"')) continue;
  if (line.endsWith(",")) line = line.slice(0, -1);

  const feature = JSON.parse(line);
  const props = feature.properties;
  if (props.adm1_name !== targetProvince) continue;

  const districtCode = normalizePcode(props.adm3_pcode);
  const master = masterDistricts.get(districtCode);
  if (!master) {
    skipped += 1;
    skippedRows.push({
      districtCode,
      districtName: props.adm3_name,
      regencyName: props.adm2_name,
    });
    continue;
  }

  const row = {
    district_code: districtCode,
    regency_code: master.regencyCode,
    province_code: targetProvinceCode,
    name: master.name,
    geometry: geometryToEwkt(feature.geometry),
    simplified_geojson: simplifyGeometry(feature.geometry),
    center_lat: props.center_lat,
    center_lng: props.center_lon,
    area_sqkm: props.area_sqkm,
    source,
    source_year: sourceYear,
  };

  accepted += 1;
  batch.push(row);

  if (batch.length >= batchSize) {
    await flushRows(batch, env);
    flushed += batch.length;
    batch.length = 0;
  }

  if (accepted >= limit) break;
}

await flushRows(batch, env);
flushed += batch.length;

console.log(
  JSON.stringify(
    {
      dryRun,
      accepted,
      flushed: dryRun ? 0 : flushed,
      skipped,
      skippedRows,
    },
    null,
    2,
  ),
);
