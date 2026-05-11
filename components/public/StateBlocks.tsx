export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3" aria-label="Cargando contenido">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-lg border border-labora-ui bg-white p-5">
          <div className="h-4 w-24 animate-pulse rounded bg-labora-ui" />
          <div className="mt-4 h-3 w-full animate-pulse rounded bg-labora-ui" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-labora-ui" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-labora-ui bg-white p-6 text-center text-sm text-labora-gray">
      {message}
    </div>
  );
}

export function SuccessState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {message}
    </div>
  );
}
