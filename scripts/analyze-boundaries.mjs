import fs from "node:fs";
import readline from "node:readline";

const filePath = "idn_admin_boundaries.geojson/idn_admin3.geojson";
const targetProvince = "Jawa Tengah";
const targetRegency = "Kota Semarang";

const provinceDistricts = new Set();
const provinceRegencies = new Set();
const semarangSample = [];
let provinceFeatures = 0;
let semarangFeatures = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(filePath),
  crlfDelay: Infinity,
});

for await (const rawLine of rl) {
  let line = rawLine.trim();
  if (!line.startsWith('{"type":"Feature"')) continue;
  if (line.endsWith(",")) line = line.slice(0, -1);

  const feature = JSON.parse(line);
  const props = feature.properties;
  if (props.adm1_name !== targetProvince) continue;

  provinceFeatures += 1;
  provinceDistricts.add(props.adm3_name);
  provinceRegencies.add(props.adm2_name);

  if (props.adm2_name === targetRegency) {
    semarangFeatures += 1;
    if (semarangSample.length < 20) {
      semarangSample.push({
        kecamatan: props.adm3_name,
        kodeKecamatan: props.adm3_pcode,
        kabupaten: props.adm2_name,
        kodeKabupaten: props.adm2_pcode,
        lat: props.center_lat,
        lng: props.center_lon,
      });
    }
  }
}

console.log(
  JSON.stringify(
    {
      filePath,
      targetProvince,
      provinceFeatures,
      uniqueDistrictNames: provinceDistricts.size,
      regencies: provinceRegencies.size,
      targetRegency,
      semarangFeatures,
      semarangSample,
    },
    null,
    2,
  ),
);
