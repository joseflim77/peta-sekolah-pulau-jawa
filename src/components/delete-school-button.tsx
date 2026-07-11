"use client";

import { Trash2 } from "lucide-react";

import { deleteSchoolAction } from "@/app/admin/sekolah/actions";

export function DeleteSchoolButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteSchoolAction}
      onSubmit={(event) => {
        if (!window.confirm(`Hapus permanen data ${name}?`)) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      <button
        className="inline-flex size-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
        title="Hapus data"
        type="submit"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </form>
  );
}

