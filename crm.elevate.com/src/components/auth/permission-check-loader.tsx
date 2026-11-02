export function PermissionCheckLoader({ message = 'Checking your access…' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 px-6 text-center">
        <div aria-hidden="true" className="size-10 rounded-full border-4 border-muted border-t-primary motion-safe:animate-spin" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">Preparing your workspace.</p>
      </div>
    </div>
  );
}
