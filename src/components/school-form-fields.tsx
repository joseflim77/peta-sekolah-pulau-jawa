"use client";

import { useState } from "react";
import type { District, Province, Regency, School } from "@/lib/types";

export function SchoolFormFields({
  provinces,
  regencies,
  districts,
  school,
}: {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
  school?: School;
}) {
  const koordinat = school ? `${school.latitude}, ${school.longitude}` : "";

  const [selectedProvince, setSelectedProvince] = useState(school?.province_code ?? "33");
  const [selectedRegency, setSelectedRegency] = useState(school?.regency_code ?? "");
  const [selectedDistrict, setSelectedDistrict] = useState(school?.district_code ?? "");

  const filteredRegencies = regencies.filter((r) => r.province_code === selectedProvince);
  const filteredDistricts = districts.filter((d) => d.regency_code === selectedRegency);

  return (
    <>
      <TextInput
        className="lg:col-span-2"
        defaultValue={school?.nama_sekolah}
        label="Nama Sekolah"
        name="nama_sekolah"
        required
      />
      <TextInput defaultValue={school?.npsn} label="NPSN" name="npsn" required />
      <SelectInput
        defaultValue={school?.bentuk_pendidikan}
        label="Bentuk Pendidikan"
        name="bentuk_pendidikan"
        options={["SMA", "SMK", "MA"]}
      />
      <SelectInput
        defaultValue={school?.status}
        label="Status"
        name="status"
        options={["Negeri", "Swasta"]}
      />
      <NumberInput defaultValue={school?.jumlah_siswa ?? 0} label="Jumlah Siswa" min={0} name="jumlah_siswa" />
      <NumberInput
        defaultValue={school?.jumlah_mahasiswa_stekom ?? 0}
        label="Mahasiswa STEKOM"
        min={0}
        name="jumlah_mahasiswa_stekom"
      />
      <NumberInput defaultValue={school?.ruang_kelas ?? 0} label="Ruang Kelas" min={0} name="ruang_kelas" />
      <TextInput
        className="lg:col-span-2"
        defaultValue={koordinat}
        label="Koordinat"
        name="koordinat"
        placeholder="-6.966667, 110.416664"
        required
      />
      
      <label className="grid gap-1 text-left text-sm font-medium text-slate-700">
        Provinsi
        <select
          className="h-10 rounded-md border border-slate-300 px-3 text-slate-950"
          value={selectedProvince}
          onChange={(e) => {
            setSelectedProvince(e.target.value);
            setSelectedRegency("");
            setSelectedDistrict("");
          }}
          name="province_code"
          required
        >
          <option value="">Pilih provinsi</option>
          {provinces.map((province) => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-left text-sm font-medium text-slate-700">
        Kabupaten/Kota
        <select
          className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 disabled:bg-slate-50 disabled:text-slate-500"
          value={selectedRegency}
          onChange={(e) => {
            setSelectedRegency(e.target.value);
            setSelectedDistrict("");
          }}
          name="regency_code"
          required
          disabled={!selectedProvince}
        >
          <option value="">Pilih kabupaten/kota</option>
          {filteredRegencies.map((regency) => (
            <option key={regency.code} value={regency.code}>
              {regency.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1 text-left text-sm font-medium text-slate-700">
        Kecamatan
        <select
          className="h-10 rounded-md border border-slate-300 px-3 text-slate-950 disabled:bg-slate-50 disabled:text-slate-500"
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          name="district_code"
          required
          disabled={!selectedRegency}
        >
          <option value="">Pilih kecamatan</option>
          {filteredDistricts.map((district) => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </select>
      </label>
      
      <TextInput
        className="lg:col-span-2"
        defaultValue={school?.link_dapodik ?? ""}
        label="Link Dapodik"
        name="link_dapodik"
        type="url"
      />
      <TextInput
        className="lg:col-span-2"
        defaultValue={school?.link_google_maps ?? ""}
        label="Link Google Maps"
        name="link_google_maps"
        type="url"
      />
    </>
  );
}

function TextInput({
  label,
  name,
  className,
  type = "text",
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  className?: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className={`grid gap-1 text-left text-sm font-medium text-slate-700 ${className ?? ""}`}>
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950"
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function NumberInput({
  label,
  name,
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  min: number;
  defaultValue: number;
}) {
  return (
    <label className="grid gap-1 text-left text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950"
        defaultValue={defaultValue}
        min={min}
        name={name}
        type="number"
      />
    </label>
  );
}

function SelectInput({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
}) {
  return (
    <label className="grid gap-1 text-left text-sm font-medium text-slate-700">
      {label}
      <select
        className="h-10 rounded-md border border-slate-300 px-3 text-slate-950"
        defaultValue={defaultValue}
        name={name}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
