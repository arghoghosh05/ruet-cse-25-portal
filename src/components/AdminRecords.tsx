"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FilePenLine, Search, Trash2, UsersRound } from "lucide-react";
import { deleteStudent } from "../app/admin/actions";
import SubmitButton from "./SubmitButton";

type AdminRecord = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  roll: number | string;
  section: string;
  email: string | null;
  blood_group: string | null;
  image_url: string | null;
};

export default function AdminRecords({ records }: { records: AdminRecord[] }) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredRecords = useMemo(
    () => records.filter((record) =>
      record.full_name?.toLocaleLowerCase().includes(normalizedQuery) ||
      record.nickname?.toLocaleLowerCase().includes(normalizedQuery) ||
      record.email?.toLocaleLowerCase().includes(normalizedQuery) ||
      String(record.roll).includes(normalizedQuery)
    ),
    [normalizedQuery, records],
  );

  return (
    <section aria-labelledby="student-records-heading" className="overflow-hidden rounded-[1.5rem] border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_18px_48px_rgba(47,72,88,0.07)]">
      <div className="border-b border-[#2F4858]/[0.08] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E806F]">Directory</p>
            <h2 id="student-records-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#2F4858]">Student records</h2>
          </div>
          <span className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl bg-[#DDFBEF] px-2.5 text-xs font-semibold text-[#2F4858]">
            <UsersRound aria-hidden="true" size={14} /> {records.length}
          </span>
        </div>
        <div className="relative mt-5">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F4858]/45" size={17} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records to edit by name, roll, or email"
            aria-label="Search student records by name, roll number, nickname, or email"
            className="min-h-11 w-full rounded-xl border border-[#2F4858]/12 bg-white pl-10 pr-3 text-sm text-[#2F4858] outline-none transition placeholder:text-[#2F4858]/45 focus:border-[#527A64] focus:ring-4 focus:ring-[#527A64]/10"
          />
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-[#2F4858]/55">
          Showing {filteredRecords.length} of {records.length} records
        </p>
      </div>

      {filteredRecords.length ? (
        <div className="divide-y divide-[#2F4858]/[0.08]">
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className="flex flex-col gap-4 p-4 transition-colors duration-150 hover:bg-[#DDFBEF]/25 sm:flex-row sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#DDFBEF] text-lg font-semibold text-[#2F4858]">
                  {record.image_url ? (
                    <Image src={record.image_url} alt="" width={48} height={48} unoptimized className="h-full w-full object-cover" />
                  ) : (
                    record.full_name?.trim().charAt(0).toLocaleUpperCase() || "?"
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[#2F4858]">{record.full_name || "Unnamed student"}</h3>
                  {record.nickname && <p className="mt-0.5 truncate text-xs text-[#527A64]">“{record.nickname}”</p>}
                  <p className="mt-1 text-xs text-[#2F4858]/60">Roll {record.roll} <span className="px-1">·</span> Section {record.section.toUpperCase()}</p>
                  {(record.email || record.blood_group) && (
                    <p className="mt-1 truncate text-xs text-[#2F4858]/55">
                      {record.email}{record.email && record.blood_group ? " · " : ""}{record.blood_group}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-[62px] sm:pl-0">
                <Link
                  href={`/admin/edit/${record.id}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#2F4858]/12 bg-white px-3 text-xs font-semibold text-[#2F4858] transition hover:border-[#527A64]/50 hover:bg-[#DDFBEF]/45"
                >
                  <FilePenLine aria-hidden="true" size={14} /> Edit
                </Link>
                <form
                  action={deleteStudent}
                  onSubmit={(event) => {
                    if (!window.confirm(`Delete ${record.full_name || "this student"} from the directory?`)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <input type="hidden" name="id" value={record.id} />
                  <SubmitButton
                    pendingText="Deleting…"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#A74343]/20 px-3 text-xs font-semibold text-[#934C43] transition hover:bg-[#FFF3EF] disabled:opacity-60"
                  >
                    <Trash2 aria-hidden="true" size={14} /> Delete
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-[#2F4858]">{records.length ? "No records match your search." : "No student records yet."}</p>
          <p className="mt-1 text-xs text-[#2F4858]/55">{records.length ? "Try another name or roll number." : "Add a profile with the form to get the directory started."}</p>
        </div>
      )}
    </section>
  );
}
