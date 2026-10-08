"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Droplets, ExternalLink, Mail, MapPin, Phone, Search, SearchX, X } from "lucide-react";
import { isSafeExternalUrl } from "../lib/student";

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-[#5E806F]"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

type StudentProfile = {
  id: string;
  full_name: string | null;
  nickname: string | null;
  roll: number | string;
  image_url: string | null;
  email: string | null;
  blood_group: string | null;
  address: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
  facebook_url: string | null;
};

const details = [
  { key: "email", label: "Email", icon: Mail },
  { key: "blood_group", label: "Blood group", icon: Droplets },
  { key: "address", label: "Location", icon: MapPin },
  { key: "phone_number", label: "Phone Number", icon: Phone },
] as const;

function toWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  return digits;
}

export default function StudentDirectory({ profiles }: { profiles: StudentProfile[] }) {
  const [query, setQuery] = useState("");
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null);
  const imageDialog = useRef<HTMLDialogElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name?.toLocaleLowerCase().includes(normalizedQuery) ||
    profile.nickname?.toLocaleLowerCase().includes(normalizedQuery) ||
    String(profile.roll).includes(normalizedQuery)
  );

  useEffect(() => {
    const dialog = imageDialog.current;
    if (!dialog) return;
    if (expandedImage && !dialog.open) dialog.showModal();
    if (!expandedImage && dialog.open) dialog.close();
  }, [expandedImage]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5E806F]">Classmates</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#2F4858]">People in this section</h2>
        </div>
        <p aria-live="polite" className="text-sm text-[#2F4858]/60">
          Showing <span className="font-semibold text-[#2F4858]">{filteredProfiles.length}</span> of {profiles.length}
        </p>
      </div>

      <div className="relative mt-5">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2F4858]/45" size={19} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or roll number"
          aria-label="Search students by name or roll number"
          className="min-h-12 w-full rounded-xl border border-[#2F4858]/15 bg-[#F8FCF9] pl-12 pr-4 text-sm text-[#2F4858] shadow-sm outline-none transition placeholder:text-[#2F4858]/45 focus:border-[#527A64] focus:ring-4 focus:ring-[#527A64]/10"
        />
      </div>
      <p className="mt-2 text-xs text-[#2F4858]/55">Click a profile picture to view it larger.</p>

      {filteredProfiles.length === 0 ? (
        <div className="soft-card mt-6 flex flex-col items-center px-6 py-12 text-center">
          <SearchX aria-hidden="true" className="text-[#527A64]" size={31} strokeWidth={1.6} />
          <h3 className="mt-4 text-lg font-semibold">No classmates found</h3>
          <p className="mt-1 text-sm text-[#2F4858]/60">
            {query.trim() ? `Try another name or roll instead of “${query.trim()}”.` : "There are no profiles to show yet."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {filteredProfiles.map((profile) => (
            <article
              key={profile.id}
              className="group overflow-hidden rounded-2xl border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_10px_26px_rgba(47,72,88,0.055)] transition duration-150 hover:-translate-y-0.5 hover:border-[#5E9B7B]/40 hover:shadow-[0_18px_36px_rgba(47,72,88,0.1)]"
            >
              <div className="flex items-center gap-4 border-b border-[#2F4858]/[0.07] p-5">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#DDFBEF] ring-1 ring-[#2F4858]/10">
                  {profile.image_url ? (
                    <button
                      type="button"
                      onClick={() => setExpandedImage({
                        src: profile.image_url!,
                        alt: profile.full_name ? `${profile.full_name} profile photo` : "Student profile",
                      })}
                      aria-label={`View ${profile.full_name || "student"}'s profile picture larger`}
                      className="h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#527A64]"
                    >
                      <Image
                        src={profile.image_url}
                        alt={profile.full_name ? `${profile.full_name} profile photo` : "Student profile"}
                        width={136}
                        height={136}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ) : (
                    <span aria-hidden="true" className="text-2xl font-semibold text-[#2F4858]">
                      {profile.full_name?.trim().charAt(0).toLocaleUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-[#2F4858]">{profile.full_name || "Student"}</h3>
                  <p className="mt-1 text-sm text-[#2F4858]/60">Roll <span className="font-medium text-[#2F4858]/85">{profile.roll}</span></p>
                </div>
                {profile.nickname && (
                  <span
                    className="max-w-32 truncate rounded-lg bg-[#DDFBEF] px-2.5 py-1.5 text-xs font-semibold text-[#527A64]"
                    title={profile.nickname}
                  >
                    {profile.nickname}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 p-5 sm:grid-cols-2">
                {details.map(({ key, label, icon: Icon }) => {
                  const value = profile[key];
                  if (!value) return null;
                  return (
                    <div key={key} className="flex min-w-0 items-start gap-2.5">
                      <Icon aria-hidden="true" className="mt-0.5 shrink-0 text-[#5E806F]" size={15} strokeWidth={1.8} />
                      <div className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#2F4858]/45">{label}</dt>
                        <dd className="mt-0.5 break-words text-xs leading-5 text-[#2F4858]/85">
                          {key === "email" ? (
                            <a className="underline decoration-[#5E806F]/35 underline-offset-2 hover:text-[#426C55]" href={`mailto:${value}`}>{value}</a>
                          ) : key === "phone_number" ? (
                            <a className="underline decoration-[#5E806F]/35 underline-offset-2 hover:text-[#426C55]" href={`tel:${value.replace(/[^\d+]/g, "")}`}>{value}</a>
                          ) : value}
                        </dd>
                      </div>
                    </div>
                  );
                })}
                {profile.whatsapp_number && (
                  <div className="flex min-w-0 items-start gap-2.5">
                    <WhatsAppIcon />
                    <div className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.11em] text-[#2F4858]/45">WhatsApp</dt>
                      <dd className="mt-0.5 break-words text-xs leading-5 text-[#2F4858]/85">
                        <a
                          className="underline decoration-[#5E806F]/35 underline-offset-2 hover:text-[#426C55]"
                          href={`https://wa.me/${toWhatsAppNumber(profile.whatsapp_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {profile.whatsapp_number}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
              </dl>

              {profile.facebook_url && isSafeExternalUrl(profile.facebook_url) && (
                <div className="px-5 pb-5">
                  <a
                    href={profile.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#2F4858]/12 bg-white px-3.5 text-xs font-semibold text-[#2F4858] transition hover:border-[#527A64]/45 hover:bg-[#DDFBEF]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527A64]"
                  >
                    <ExternalLink aria-hidden="true" size={15} /> Facebook profile
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <dialog
        ref={imageDialog}
        aria-label={expandedImage?.alt || "Student profile picture"}
        onClose={() => setExpandedImage(null)}
        onClick={(event) => {
          if (event.target === imageDialog.current) setExpandedImage(null);
        }}
        className="m-auto max-h-[90vh] max-w-[min(92vw,64rem)] rounded-2xl border-0 bg-transparent p-0 backdrop:bg-[#10222B]/85"
      >
        {expandedImage && (
          <div className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center">
            <button
              type="button"
              autoFocus
              onClick={() => setExpandedImage(null)}
              aria-label="Close enlarged profile picture"
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#10222B]/80 text-white transition hover:bg-[#10222B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X aria-hidden="true" size={21} />
            </button>
            <Image
              src={expandedImage.src}
              alt={expandedImage.alt}
              width={1600}
              height={1600}
              unoptimized
              className="max-h-[85vh] max-w-[92vw] rounded-2xl object-contain"
            />
          </div>
        )}
      </dialog>
      <div className="sr-only" aria-live="polite">{filteredProfiles.length} student profiles shown.</div>
    </div>
  );
}
