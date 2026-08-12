import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-muted/40">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2 text-2xl font-bold">
          <Image src="/logo.png" alt="" width={32} height={32} className="size-8" />
          <span>Homeland Tasks</span>
        </Link>
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          {children}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-8 text-sm text-muted-foreground">
        <span>Support</span>
        <span aria-hidden>|</span>
        <span>Resources</span>
        <span aria-hidden>|</span>
        <span>Guide</span>
        <span aria-hidden>|</span>
        <span>Pricing</span>
        <span aria-hidden>|</span>
        <span>Terms</span>
        <span aria-hidden>|</span>
        <span>Privacy</span>
      </footer>
    </div>
  );
}
