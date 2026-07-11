"use client";

import { AdvancedMarker, APIProvider, InfoWindow, Map } from "@vis.gl/react-google-maps";
import { ExternalLink } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { BoundaryPolygons, type DistrictAggregation } from "@/components/boundary-polygons";
import type { DistrictBoundary, School } from "@/lib/types";

const jawaTengahCenter = { lat: -7.150975, lng: 110.140259 };

export function SchoolMap({
  schools,
  boundaries = [],
  aggregations = {},
}: {
  schools: School[];
  boundaries?: DistrictBoundary[];
  aggregations?: Record<string, DistrictAggregation>;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedBoundaryCode, setSelectedBoundaryCode] = useState<string | null>(null);
  
  const selectedSchool = schools.find((school) => school.id === selectedSchoolId);
  const selectedBoundary = boundaries.find((b) => b.district_code === selectedBoundaryCode);
  const selectedBoundaryStats = selectedBoundary ? aggregations[selectedBoundary.district_code] : null;

  const handleBoundaryClick = useCallback((boundary: DistrictBoundary) => {
    setSelectedBoundaryCode(boundary.district_code);
    setSelectedSchoolId(null);
  }, []);

  const viewport = useMemo(() => {
    if (schools.length === 0) {
      const boundaryCenters = boundaries.filter((boundary) => boundary.center_lat !== null && boundary.center_lng !== null);
      if (boundaryCenters.length > 0) {
        const total = boundaryCenters.reduce(
          (sum, boundary) => ({
            lat: sum.lat + Number(boundary.center_lat),
            lng: sum.lng + Number(boundary.center_lng),
          }),
          { lat: 0, lng: 0 },
        );

        return {
          center: {
            lat: total.lat / boundaryCenters.length,
            lng: total.lng / boundaryCenters.length,
          },
          zoom: boundaryCenters.length === 1 ? 13 : 11,
        };
      }

      return { center: jawaTengahCenter, zoom: 8 };
    }

    const total = schools.reduce(
      (sum, school) => ({
        lat: sum.lat + school.latitude,
        lng: sum.lng + school.longitude,
      }),
      { lat: 0, lng: 0 },
    );

    const center = {
      lat: total.lat / schools.length,
      lng: total.lng / schools.length,
    };

    if (schools.length === 1) {
      return { center, zoom: 14 };
    }

    const latitudes = schools.map((school) => school.latitude);
    const longitudes = schools.map((school) => school.longitude);
    const latSpread = Math.max(...latitudes) - Math.min(...latitudes);
    const lngSpread = Math.max(...longitudes) - Math.min(...longitudes);
    const maxSpread = Math.max(latSpread, lngSpread);

    return {
      center,
      zoom: maxSpread > 1.2 ? 8 : maxSpread > 0.45 ? 10 : 12,
    };
  }, [schools, boundaries]);

  const mapKey = `${schools.length}-${viewport.center.lat.toFixed(5)}-${viewport.center.lng.toFixed(5)}-${viewport.zoom}`;

  if (!apiKey) {
    return (
      <div className="flex h-[620px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <div>
          <p className="text-base font-semibold text-slate-950">Google Maps API key belum diisi</p>
          <p className="mt-2 max-w-md text-sm text-slate-600">
            Isi `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` di `.env.local`, lalu restart dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative h-[620px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {schools.length === 0 && (
          <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 shadow-sm">
            Tidak ada sekolah yang cocok dengan filter.
          </div>
        )}

        <Map
          key={mapKey}
          defaultZoom={viewport.zoom}
          gestureHandling="greedy"
          mapId="peta-sekolah"
          style={{ width: "100%", height: "100%" }}
          defaultCenter={viewport.center}
        >
          <BoundaryPolygons
            boundaries={boundaries}
            aggregations={aggregations}
            onPolygonClick={handleBoundaryClick}
          />

          {schools.map((school) => (
            <AdvancedMarker
              key={school.id}
              position={{ lat: school.latitude, lng: school.longitude }}
              onClick={() => {
                setSelectedSchoolId(school.id);
                setSelectedBoundaryCode(null);
              }}
              zIndex={10}
            >
              <div className="flex -translate-y-2 flex-col items-center">
                <div className="mb-1 min-w-7 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-center text-xs font-semibold text-emerald-700 shadow-md">
                  {school.jumlah_mahasiswa_stekom.toLocaleString("id-ID")}
                </div>
                <div className="relative size-8">
                  <div className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[50%_50%_50%_0] border-2 border-white bg-emerald-600 shadow-md" />
                  <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                </div>
              </div>
            </AdvancedMarker>
          ))}

          {selectedSchool ? (
            <InfoWindow
              position={{ lat: selectedSchool.latitude, lng: selectedSchool.longitude }}
              onCloseClick={() => setSelectedSchoolId(null)}
            >
              <div className="max-w-sm text-sm text-slate-700 p-1">
                <p className="font-semibold text-slate-950 text-base mb-1">{selectedSchool.nama_sekolah}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                  <p><span className="text-slate-500">NPSN:</span> {selectedSchool.npsn}</p>
                  <p><span className="text-slate-500">Bentuk:</span> {selectedSchool.bentuk_pendidikan}</p>
                  <p><span className="text-slate-500">Status:</span> {selectedSchool.status}</p>
                  <p><span className="text-slate-500">Siswa:</span> {selectedSchool.jumlah_siswa.toLocaleString("id-ID")}</p>
                  <p><span className="text-slate-500">Kelas:</span> {selectedSchool.ruang_kelas}</p>
                </div>
                <div className="mb-3">
                  <p><span className="text-slate-500">Kecamatan:</span> {selectedSchool.districts?.name ?? "-"}</p>
                  <p><span className="text-slate-500">Kabupaten/Kota:</span> {selectedSchool.districts?.regencies?.name ?? "-"}</p>
                </div>
                
                <div className="flex gap-2">
                  {selectedSchool.link_dapodik ? (
                    <PopupLink href={selectedSchool.link_dapodik} label="Dapodik" />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-50">Dapodik <ExternalLink className="size-3" /></span>
                  )}
                  {selectedSchool.link_google_maps ? (
                    <PopupLink href={selectedSchool.link_google_maps} label="Maps" />
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-400 bg-slate-50">Maps <ExternalLink className="size-3" /></span>
                  )}
                </div>
              </div>
            </InfoWindow>
          ) : null}

          {selectedBoundary ? (
            <InfoWindow
              position={{ 
                lat: selectedBoundary.center_lat ?? viewport.center.lat, 
                lng: selectedBoundary.center_lng ?? viewport.center.lng 
              }}
              onCloseClick={() => setSelectedBoundaryCode(null)}
            >
              <div className="min-w-[200px] text-sm text-slate-700 p-1">
                <p className="font-semibold text-slate-950 text-base mb-2">Kecamatan {selectedBoundary.name}</p>
                <div className="grid gap-1 mb-1">
                  <p><span className="text-slate-500">Total Sekolah:</span> {selectedBoundaryStats?.total ?? 0}</p>
                  <p><span className="text-slate-500">Total Siswa:</span> {(selectedBoundaryStats?.students ?? 0).toLocaleString("id-ID")}</p>
                  <p>
                    <span className="text-slate-500">Mahasiswa STEKOM:</span>{" "}
                    {(selectedBoundaryStats?.stekomStudents ?? 0).toLocaleString("id-ID")}
                  </p>
                  {selectedBoundary.area_sqkm ? (
                    <p><span className="text-slate-500">Luas Area:</span> {formatArea(selectedBoundary.area_sqkm)} km2</p>
                  ) : null}
                </div>
              </div>
            </InfoWindow>
          ) : null}
        </Map>
      </div>
    </APIProvider>
  );
}

function formatArea(area: DistrictBoundary["area_sqkm"]) {
  const value = Number(area);
  if (!Number.isFinite(value)) return String(area);

  return value.toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  });
}

function PopupLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden="true" />
    </a>
  );
}
