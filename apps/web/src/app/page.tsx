/** Temporary landing page for Phase 1 — replaced by the public website in Phase 3. */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-slate-500 uppercase">
        Development build
      </p>
      <h1 className="text-3xl font-semibold">Kottakal Multispeciality Dental Clinic</h1>
      <p className="text-lg text-slate-700">
        Platform foundation is running. The public website and staff dashboard are built in the
        following phases.
      </p>
      <ul className="list-inside list-disc text-slate-700">
        <li>
          Web health:{' '}
          <a className="underline" href="/healthz">
            /healthz
          </a>
        </li>
        <li>
          API health (proxied):{' '}
          <a className="underline" href="/api/v1/health">
            /api/v1/health
          </a>
        </li>
      </ul>
    </main>
  );
}
