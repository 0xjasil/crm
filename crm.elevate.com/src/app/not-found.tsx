import Link from 'next/link';
import { IconArrowLeft, IconHome } from '@tabler/icons-react';
import { APP_CONFIG } from '@/config/app';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16 text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-40 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-24 size-[30rem] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl text-center">
        <Link href="/" className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm font-semibold shadow-sm backdrop-blur transition-colors hover:bg-accent">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">Z</span>
          {APP_CONFIG.name}
        </Link>

        <p className="mt-10 text-8xl font-bold leading-none tracking-tight text-primary sm:text-9xl">404</p>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">We can’t find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          The page may have moved, or the address may be incorrect. Check the URL or return to your dashboard.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/dashboard">
              <IconHome aria-hidden="true" />
              Go to dashboard
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">
              <IconArrowLeft aria-hidden="true" />
              Back to home
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
