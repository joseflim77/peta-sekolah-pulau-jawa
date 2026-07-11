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
  "SMA NEGERI 1 SEMARANG",
  "20328895",
  "SMA",
  "Negeri",
  "1000",
  "120",
  "30",
  "-6.988881, 110.420826",
  "Jawa Tengah",
  "Kota Semarang",
  "Semarang Selatan",
  "https://dapo.kemendikdasmen.go.id/",
  "https://maps.google.com/",
];

export function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");

  if (format === "csv") {
    const csv = [headers, sample].map((row) => row.map(csvCell).join(",")).join("\r\n");

    return new Response(csv, {
      headers: {
        "Content-Disposition": 'attachment; filename="template-update-sekolah.csv"',
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
   <Row>${cell("Template ini dipakai untuk memperbarui data sekolah yang sudah ada di database.")}</Row>
   <Row>${cell("NPSN wajib sama dengan NPSN yang sudah tersimpan. Baris dengan NPSN baru akan ditolak.")}</Row>
   <Row>${cell("Semua kolom wajib diisi dengan format lengkap seperti template import.")}</Row>
   <Row>${cell("Nama provinsi, kabupaten_kota, dan kecamatan harus sama persis dengan master wilayah.")}</Row>
   <Row>${cell("Kolom koordinat wajib memakai format latitude, longitude.")}</Row>
  </Table>
 </Worksheet>
</Workbook>`;

  return new Response(workbook, {
    headers: {
      "Content-Disposition": 'attachment; filename="template-update-sekolah.xls"',
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
