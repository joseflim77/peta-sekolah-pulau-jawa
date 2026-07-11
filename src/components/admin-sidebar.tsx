"use client";

import { Database, FileClock, LogOut, Map, PanelLeftClose, PanelLeftOpen, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { logoutAction } from "@/app/login/actions";
import type { Profile } from "@/lib/types";

const menuItems = [
  { href: "/admin/sekolah", label: "Data Sekolah", icon: Database },
  { href: "/admin/peta", label: "Peta Sekolah", icon: Map },
  { href: "/admin/audit-log", label: "Audit Log", icon: FileClock },
];

export function AdminSidebar({ profile }: { profile: Profile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`flex min-h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="border-b border-slate-200 px-4 py-5">
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex size-10 items-center justify-center rounded-md bg-slate-950 text-white">
            <Shield className="size-5" aria-hidden="true" />
          </div>
          <div className={isCollapsed ? "hidden" : ""}>
            <p className="text-sm font-semibold text-slate-950">Peta Sekolah</p>
            <p className="text-xs text-slate-500">Pulau Jawa</p>
          </div>
        </div>
        <button
          className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          onClick={() => setIsCollapsed((value) => !value)}
          title={isCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          type="button"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="size-4" aria-hidden="true" />
          )}
          {isCollapsed ? null : "Collapse"}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {menuItems.map((item) => (
            <Link
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 ${
                isCollapsed ? "justify-center" : "gap-3"
              }`}
              href={item.href}
              key={item.href}
              title={item.label}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {isCollapsed ? null : item.label}
            </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className={`mb-3 rounded-md bg-slate-50 p-3 ${isCollapsed ? "hidden" : ""}`}>
          <p className="truncate text-sm font-medium text-slate-950">{profile.full_name ?? profile.email}</p>
          <p className="truncate text-xs text-slate-500">{profile.role}</p>
        </div>
        <form action={logoutAction}>
          <button
            className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            title="Keluar"
            type="submit"
          >
            {isCollapsed ? <LogOut className="mx-auto size-4" aria-hidden="true" /> : "Keluar"}
          </button>
        </form>
      </div>
    </aside>
  );
}
