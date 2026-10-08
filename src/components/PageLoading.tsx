export default function PageLoading({ label = "page" }: { label?: string }) {
  return (
    <main
      aria-busy="true"
      aria-label={`Loading ${label}`}
      className="min-h-screen bg-transparent"
    >
      <div className="loading-skeleton h-[76px]" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 sm:pt-10">
        <div className="loading-skeleton h-36 rounded-[1.75rem]" aria-hidden="true" />
        <div className="mt-7 grid gap-5 md:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl border border-[#2F4858]/10 bg-white p-5">
              <div className="loading-skeleton h-5 w-2/3 rounded-md" />
              <div className="loading-skeleton mt-4 h-4 w-full rounded-md" />
              <div className="loading-skeleton mt-2 h-4 w-4/5 rounded-md" />
              <div className="loading-skeleton mt-6 h-10 w-1/3 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading {label}…</span>
    </main>
  );
}
