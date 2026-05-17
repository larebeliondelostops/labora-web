"use client";

export function ResultLoadingSkeleton() {
  return (
    <div className="grid gap-5" aria-live="polite" aria-busy="true">
      <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
        <div className="h-4 w-36 animate-pulse rounded bg-labora-ui" />
        <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-labora-ui" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-labora-ui" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-labora-ui bg-white p-6 shadow-panel">
          <div className="h-4 w-32 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-labora-ui" />
        </div>
        <div className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
          <div className="h-32 w-32 animate-pulse rounded-full bg-labora-ui" />
          <div className="mt-4 h-6 w-44 animate-pulse rounded bg-labora-ui" />
          <div className="mt-3 h-4 w-full animate-pulse rounded bg-labora-ui" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="rounded-2xl border border-labora-ui bg-white p-5 shadow-panel">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-labora-ui" />
            <div className="mt-4 h-4 w-28 animate-pulse rounded bg-labora-ui" />
            <div className="mt-3 h-7 w-36 animate-pulse rounded bg-labora-ui" />
          </div>
        ))}
      </div>
    </div>
  );
}
