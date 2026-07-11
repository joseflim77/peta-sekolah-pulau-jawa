import type { NextRequest } from "next/server";

const headers = [
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

const sample = [
  "SMA Contoh Kota Semarang",
  "99900001",
  "SMA",
  "Negeri",
  "100",
  "12",
  "6",
  "-6.966667, 110.416664",
  "Jawa Tengah",
  "Kota Semarang",
  "Semarang Tengah",
  "https://dapo.kemendikdasmen.go.id/",
  "https://maps.google.com/",
];

export function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (format === "csv") {
    const csv = [headers, sample].map((row) => row.map(csvCell).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="template-import-sekolah-v2.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  const workbook = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Template Sekolah">
  <Table>
   <Row>${headers.map(cell).join("")}</Row>
   <Row>${sample.map(cell).join("")}</Row>
  </Table>
 </Worksheet>
 <Worksheet ss:Name="Petunjuk">
  <Table>
   <Row>${cell("Nama provinsi, kabupaten_kota, dan kecamatan harus sama persis dengan master wilayah.")}</Row>
   <Row>${cell("Kolom koordinat wajib memakai format latitude, longitude.")}</Row>
   <Row>${cell("Bentuk pendidikan hanya boleh SMA, SMK, atau MA.")}</Row>
   <Row>${cell("Status hanya boleh Negeri atau Swasta.")}</Row>
   <Row>${cell("Kolom jumlah_mahasiswa_stekom wajib ada dan berisi jumlah siswa/alumni sekolah tersebut yang menjadi mahasiswa Univ STEKOM. Isi 0 jika belum ada data.")}</Row>
   <Row>${cell("NPSN yang sudah ada akan ditolak saat import.")}</Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return new Response(workbook, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="template-import-sekolah-v2.xls"',
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
    },
  });
}

function cell(value: string) {
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function csvCell(value: string) {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
