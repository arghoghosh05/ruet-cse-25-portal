"use client";

import { Check, Clock3, MapPin, X } from "lucide-react";
import { reviewStudentSubmission } from "../app/admin/actions";
import SubmitButton from "./SubmitButton";

type StudentSubmission = {
  id: string;
  full_name: string;
  nickname: string | null;
  roll: number;
  section: string;
  address: string;
  phone_number: string;
  whatsapp_number: string;
  blood_group: string | null;
  email: string | null;
  facebook_url: string | null;
  image_url: string | null;
  submitted_at: string;
};

export default function PendingSubmissions({ submissions }: { submissions: StudentSubmission[] }) {
  return (
    <section aria-labelledby="pending-submissions-heading" className="overflow-hidden rounded-[1.5rem] border border-[#2F4858]/10 bg-[#F8FCF9] shadow-[0_18px_48px_rgba(47,72,88,0.07)]">
      <div className="flex items-center justify-between gap-4 border-b border-[#2F4858]/[0.08] p-5 sm:p-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5E806F]">Needs review</p>
          <h2 id="pending-submissions-heading" className="mt-1 text-xl font-semibold tracking-tight text-[#2F4858]">Student submissions</h2>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-xl bg-[#DDFBEF] px-2.5 text-xs font-semibold text-[#2F4858]">
          <Clock3 aria-hidden="true" size={14} /> {submissions.length}
        </span>
      </div>

      {submissions.length ? (
        <div className="divide-y divide-[#2F4858]/[0.08]">
          {submissions.map((submission) => (
            <article
              key={submission.id}
              className="p-5 sm:p-6"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="mb-3 rounded-lg border border-[#C9AA70]/40 bg-[#FFF7E6] px-3 py-2 text-xs leading-5 text-[#624B24]">
                    Verify the student’s identity and roll before approval. Approval publishes these details and gives this account permission to edit the profile.
                  </p>
                  <h3 className="break-words text-base font-semibold text-[#2F4858]">{submission.full_name}</h3>
                  {submission.nickname && <p className="mt-0.5 text-xs text-[#527A64]">“{submission.nickname}”</p>}
                  <p className="mt-1 text-sm text-[#2F4858]/70">
                    Roll {submission.roll} <span className="px-1">·</span> Section {submission.section.toUpperCase()}
                  </p>
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-[#2F4858]/65">
                    <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={13} /> {submission.address}
                  </p>
                  <dl className="mt-3 grid gap-x-5 gap-y-1.5 text-xs sm:grid-cols-2">
                    <div><dt className="inline text-[#2F4858]/55">Phone: </dt><dd className="inline text-[#2F4858]">{submission.phone_number}</dd></div>
                    <div><dt className="inline text-[#2F4858]/55">WhatsApp: </dt><dd className="inline text-[#2F4858]">{submission.whatsapp_number}</dd></div>
                    {submission.email && <div><dt className="inline text-[#2F4858]/55">Verified email: </dt><dd className="inline break-all text-[#2F4858]">{submission.email}</dd></div>}
                    {submission.blood_group && <div><dt className="inline text-[#2F4858]/55">Blood group: </dt><dd className="inline text-[#2F4858]">{submission.blood_group}</dd></div>}
                    {submission.facebook_url && (
                      <div>
                        <dt className="inline text-[#2F4858]/55">Facebook: </dt>
                        <dd className="inline"><a href={submission.facebook_url} target="_blank" rel="noopener noreferrer" className="break-all text-[#2F4858] underline underline-offset-2">{submission.facebook_url}</a></dd>
                      </div>
                    )}
                    {submission.image_url && (
                      <div>
                        <dt className="inline text-[#2F4858]/55">Photo: </dt>
                        <dd className="inline"><a href={submission.image_url} target="_blank" rel="noopener noreferrer" className="text-[#2F4858] underline underline-offset-2">View submitted photo</a></dd>
                      </div>
                    )}
                  </dl>
                  <p className="mt-3 text-[11px] text-[#2F4858]/50">
                    Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <form action={reviewStudentSubmission}>
                    <input type="hidden" name="id" value={submission.id} />
                    <input type="hidden" name="decision" value="approved" />
                    <SubmitButton
                      pendingText="Approving…"
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#2F4858] px-3.5 text-xs font-semibold text-[#DDFBEF] transition hover:bg-[#243B49] disabled:opacity-60"
                    >
                      <Check aria-hidden="true" size={14} /> Approve
                    </SubmitButton>
                  </form>
                  <form
                    action={reviewStudentSubmission}
                    onSubmit={(event) => {
                      if (!window.confirm(`Reject the profile for ${submission.full_name}?`)) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="id" value={submission.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <SubmitButton
                      pendingText="Rejecting…"
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#A74343]/20 px-3.5 text-xs font-semibold text-[#934C43] transition hover:bg-[#FFF3EF] disabled:opacity-60"
                    >
                      <X aria-hidden="true" size={14} /> Reject
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-[#2F4858]/60">No student submissions are waiting for review.</p>
      )}
    </section>
  );
}
