import type { LucideIcon } from "lucide-react";

export function PageShell({
  title,
  eyebrow,
  description,
  icon: Icon,
  children
}: {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.24em] text-bullion">
              <Icon className="h-4 w-4" />
              {eyebrow}
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-white md:text-6xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{description}</p>
          </div>
        </div>
        {children}
      </section>
    </main>
  );
}
