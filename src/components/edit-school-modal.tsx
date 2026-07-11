"use client";

import { Pencil, X } from "lucide-react";
import { useState } from "react";

import { updateSchoolAction } from "@/app/admin/sekolah/actions";
import { SchoolFormFields } from "@/components/school-form-fields";
import type { District, Province, Regency, School } from "@/lib/types";

export function EditSchoolModal({
  school,
  provinces,
  regencies,
  districts,
}: {
  school: School;
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition hover:bg-slate-50"
        onClick={() => setIsOpen(true)}
        title="Edit data"
        type="button"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
              <div className="text-left">
                <p className="text-sm font-medium text-emerald-700">Edit Data Sekolah</p>
                <h2 className="mt-1 max-w-3xl truncate text-2xl font-semibold text-slate-950">{school.nama_sekolah}</h2>
              </div>
              <button
                className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
                title="Tutup"
                type="button"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <form action={updateSchoolAction}>
              <div className="max-h-[calc(92vh-156px)] overflow-y-auto px-6 py-5">
                <div className="grid gap-4 lg:grid-cols-4">
                  <input name="id" type="hidden" value={school.id} />
                  <SchoolFormFields provinces={provinces} regencies={regencies} districts={districts} school={school} />
                </div>
              </div>
              <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
                <button
                  className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  Simpan Perubahan
                </button>
                <button
                  className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
