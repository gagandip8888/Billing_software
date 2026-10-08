'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20 text-rose-400">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Something went wrong!</h1>
          <p className="text-slate-400 text-sm">
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-500 bg-slate-900 p-2 rounded border border-slate-800">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Button asChild variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Go to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
