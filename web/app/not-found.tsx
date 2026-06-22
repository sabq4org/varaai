import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="ltr text-5xl font-extrabold">
        <span className="text-text">4</span>
        <span className="text-accent">0</span>
        <span className="text-text">4</span>
      </div>
      <p className="text-muted">الصفحة غير موجودة</p>
      <Link
        href="/"
        className="rounded-xl bg-accentDim px-4 py-2 text-sm font-semibold text-[#d8fff3]"
      >
        العودة للرئيسية
      </Link>
    </div>
  );
}
