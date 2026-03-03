import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-app p-4 text-center">
      <p className="text-7xl font-bold text-primary-400">404</p>
      <h1 className="mt-4 text-xl font-bold text-text-primary">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-text-muted max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
