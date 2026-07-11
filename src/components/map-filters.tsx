"use client";

import Link from "next/link";
import { useState } from "react";
import type { District, Province, Regency } from "@/lib/types";

export type MapFiltersProps = {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
  filters: {
    provinsi?: string;
    kabupaten?: string;
    kecamatan?: string;
    bentuk?: string;
    status?: string;
  };
};

export function MapFilters({ provinces, regencies, districts, filters }: MapFiltersProps) {
  const [selectedProvinsi, setSelectedProvinsi] = useState(filters.provinsi ?? "");
  const [selectedKabupaten, setSelectedKabupaten] = useState(filters.kabupaten ?? "");
  const [selectedKecamatan, setSelectedKecamatan] = useState(filters.kecamatan ?? "");

  const filteredRegencies = regencies.filter((r) => r.province_code === selectedProvinsi);
  const filteredDistricts = districts.filter((d) => d.regency_code === selectedKabupaten);

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <form method="GET" action="/admin/peta" className="flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-auto">
          <label htmlFor="filter-provinsi" className="mb-1.5 block text-sm font-medium text-slate-700">
            Provinsi
          </label>
          <select
            id="filter-provinsi"
            name="provinsi"
            value={selectedProvinsi}
            onChange={(e) => {
              setSelectedProvinsi(e.target.value);
              setSelectedKabupaten("");
              setSelectedKecamatan("");
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Semua Provinsi</option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-kabupaten" className="mb-1.5 block text-sm font-medium text-slate-700">
            Kabupaten/Kota
          </label>
          <select
            id="filter-kabupaten"
            name="kabupaten"
            value={selectedKabupaten}
            onChange={(e) => {
              setSelectedKabupaten(e.target.value);
              setSelectedKecamatan("");
            }}
            disabled={!selectedProvinsi}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Semua Kabupaten</option>
            {filteredRegencies.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-kecamatan" className="mb-1.5 block text-sm font-medium text-slate-700">
            Kecamatan
          </label>
          <select
            id="filter-kecamatan"
            name="kecamatan"
            value={selectedKecamatan}
            onChange={(e) => setSelectedKecamatan(e.target.value)}
            disabled={!selectedKabupaten}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Semua Kecamatan</option>
            {filteredDistricts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-bentuk" className="mb-1.5 block text-sm font-medium text-slate-700">
            Bentuk
          </label>
          <select
            id="filter-bentuk"
            name="bentuk"
            defaultValue={filters.bentuk}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Semua Bentuk</option>
            <option value="SMA">SMA</option>
            <option value="SMK">SMK</option>
            <option value="MA">MA</option>
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="filter-status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            id="filter-status"
            name="status"
            defaultValue={filters.status}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Semua Status</option>
            <option value="Negeri">Negeri</option>
            <option value="Swasta">Swasta</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Terapkan
          </button>
          <Link
            href="/admin/peta"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </Link>
        </div>
      </form>
    </section>
  );
}
