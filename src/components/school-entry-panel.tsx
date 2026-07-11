"use client";

import { ChevronDown, Download, Plus, RefreshCw, Upload } from "lucide-react";
import { useState } from "react";

import { createSchoolAction, importSchoolsAction, updateSchoolsFromFileAction } from "@/app/admin/sekolah/actions";
import { SchoolFormFields } from "@/components/school-form-fields";
import type { District, Province, Regency } from "@/lib/types";

export function SchoolEntryPanel({
  provinces,
  regencies,
  districts,
}: {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "massal" | "otomatis">("manual");

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <button
          className="flex items-center gap-2 text-left text-base font-semibold text-slate-950"
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          <Plus className="size-4 text-slate-600" aria-hidden="true" />
          Tambah Data
          <ChevronDown
            className={`size-4 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1">
          <button
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeTab === "manual" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => {
              setActiveTab("manual");
              setIsOpen(true);
            }}
            type="button"
          >
            Tambah Data Manual
          </button>
          <button
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeTab === "massal" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => {
              setActiveTab("massal");
              setIsOpen(true);
            }}
            type="button"
          >
            Tambah Data Massal
          </button>
          <button
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              activeTab === "otomatis" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"
            }`}
            onClick={() => {
              setActiveTab("otomatis");
              setIsOpen(true);
            }}
            type="button"
          >
            Update Data Otomatis
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="p-5">
          {activeTab === "manual" ? (
            <form action={createSchoolAction} className="grid gap-4 lg:grid-cols-4">
              <SchoolFormFields provinces={provinces} regencies={regencies} districts={districts} />
              <div className="lg:col-span-4">
                <button
                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          ) : activeTab === "massal" ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
                  <Upload className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Import CSV/XLSX</h3>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Menu import massal akan memvalidasi NPSN, mencatat baris duplicate yang ditolak, lalu menyimpan
                    baris valid.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                      href="/api/templates/schools"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download Excel
                    </a>
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      href="/api/templates/schools?format=csv"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download CSV
                    </a>
                  </div>
                  <form action={importSchoolsAction} className="mt-5 grid gap-3">
                    <label className="grid max-w-xl gap-1 text-left text-sm font-medium text-slate-700">
                      Upload file CSV/XLS/XLSX
                      <input
                        accept=".csv,.xls,.xlsx"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                        name="file"
                        required
                        type="file"
                      />
                    </label>
                    <div>
                      <button
                        className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        type="submit"
                      >
                        Upload dan Import
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
                  <RefreshCw className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">Update Data Otomatis</h3>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Upload file Excel/CSV untuk memperbarui data sekolah yang sudah ada. Sistem memakai NPSN sebagai
                    kunci pencocokan, sehingga baris dengan NPSN yang belum ada di database akan ditolak.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                      href="/api/templates/school-updates"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download Excel
                    </a>
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      href="/api/templates/school-updates?format=csv"
                    >
                      <Download className="size-4" aria-hidden="true" />
                      Download CSV
                    </a>
                  </div>
                  <form action={updateSchoolsFromFileAction} className="mt-5 grid gap-3">
                    <label className="grid max-w-xl gap-1 text-left text-sm font-medium text-slate-700">
                      Upload file update CSV/XLS/XLSX
                      <input
                        accept=".csv,.xls,.xlsx"
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950"
                        name="file"
                        required
                        type="file"
                      />
                    </label>
                    <div>
                      <button
                        className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                        type="submit"
                      >
                        Upload dan Update
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
