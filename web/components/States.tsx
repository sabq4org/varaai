import Link from "next/link";

export function EmptyState({ message }: { message: string }) {
  return <div className="px-6 py-12 text-center text-muted">{message}</div>;
}

export function ErrorState({
  message = "تعذّر الاتصال بـ VARA Edge",
  detail,
}: {
  message?: string;
  detail?: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-8 py-12 text-center">
      <span className="text-3xl">⚠️</span>
      <p className="text-base font-semibold text-text">{message}</p>
      {detail ? <p className="text-xs text-muted">{detail}</p> : null}
      <Link
        href=""
        className="mt-1 rounded-xl bg-accentDim px-4 py-2 text-sm font-semibold text-[#d8fff3]"
      >
        إعادة المحاولة
      </Link>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-6 px-1 text-sm font-bold text-muted">{children}</h2>;
}
