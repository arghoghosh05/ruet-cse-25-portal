"use client";

import { useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";

type ApprovedStudentAccount = {
  roll: number;
  email: string;
  has_profile: boolean;
};

export default function ApprovedStudentAccounts({
  accounts,
}: {
  accounts: ApprovedStudentAccount[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredAccounts = useMemo(
    () =>
      accounts.filter(
        (account) =>
          String(account.roll).includes(normalizedQuery) ||
          account.email.toLocaleLowerCase().includes(normalizedQuery),
      ),
    [accounts, normalizedQuery],
  );

  return (
    <section
      aria-labelledby="approved-accounts-heading"
      className="overflow-hidden rounded-[1.5rem] border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_18px_48px_rgba(47,72,88,0.07)]"
    >
      <div className="border-b border-[#2F4858]/[0.08] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E806F]">
              Student access
            </p>
            <h2
              id="approved-accounts-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-[#2F4858]"
            >
              Approved student accounts
            </h2>
          </div>
          <span className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl bg-[#DDFBEF] px-2.5 text-xs font-semibold text-[#2F4858]">
            <UsersRound aria-hidden="true" size={14} /> {accounts.length}
          </span>
        </div>

        <div className="relative mt-5">
          <Search
            aria-hidden="true"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2F4858]/45"
            size={17}
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search approved accounts by roll or email"
            aria-label="Search approved student accounts by roll number or email"
            className="min-h-11 w-full rounded-xl border border-[#2F4858]/12 bg-white pl-10 pr-3 text-sm text-[#2F4858] outline-none transition placeholder:text-[#2F4858]/45 focus:border-[#527A64] focus:ring-4 focus:ring-[#527A64]/10"
          />
        </div>
        <p aria-live="polite" className="mt-3 text-xs text-[#2F4858]/55">
          Showing {filteredAccounts.length} of {accounts.length} approved accounts
        </p>
      </div>

      {filteredAccounts.length > 0 ? (
        <div className="divide-y divide-[#2F4858]/[0.08]">
          {filteredAccounts.map((account) => (
            <article
              key={account.roll}
              className="flex flex-col gap-1.5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#2F4858]">
                  Roll {account.roll}
                </h3>
                <p className="mt-1 break-all text-xs text-[#2F4858]/65">
                  {account.email}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  account.has_profile
                    ? "bg-[#DDFBEF] text-[#426C55]"
                    : "bg-[#FFF7E6] text-[#624B24]"
                }`}
              >
                {account.has_profile ? "Profile listed" : "No profile"}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-[#2F4858]">
            {accounts.length
              ? "No approved accounts match your search."
              : "No approved student accounts yet."}
          </p>
          {accounts.length > 0 && (
            <p className="mt-1 text-xs text-[#2F4858]/55">
              Try another roll number or email address.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
