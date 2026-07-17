import type { PropsWithChildren } from "react";

type PageShellProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
