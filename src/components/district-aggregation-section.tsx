"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

type DistrictAggregationRow = {
  districtName: string;
  regencyName: string;
  total: number;
  students: number;
  stekomStudents: number;
};

export function DistrictAggregationSection({ rows }: { rows: DistrictAggregationRow[] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        className="flex w-full items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 text-left"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-950">Agregasi Kecamatan</h2>
          <p className="mt-1 text-sm text-slate-500">{rows.length.toLocaleString("id-ID")} kecamatan ditampilkan</p>
        </div>
        <ChevronDown className={`size-5 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Kabupaten/Kota</th>
                <th className="px-4 py-3 text-right">Sekolah</th>
                <th className="px-4 py-3 text-right">Siswa</th>
                <th className="px-4 py-3 text-right">Mahasiswa STEKOM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, idx) => (
                <tr key={`${row.regencyName}-${row.districtName}-${idx}`}>
                  <td className="px-4 py-3 font-medium text-slate-950">{row.districtName}</td>
                  <td className="px-4 py-3 text-slate-600">{row.regencyName}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.total.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{row.students.toLocaleString("id-ID")}</td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {row.stekomStudents.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
