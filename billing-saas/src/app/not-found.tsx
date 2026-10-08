import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20 text-indigo-400">
          <FileQuestion className="w-10 h-10" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">404</h1>
          <h2 className="text-xl font-semibold text-slate-200">Page Not Found</h2>
          <p className="text-slate-400 text-sm">
            Sorry, we couldn&apos;t find the page you are looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild variant="default" className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Link href="/" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Go to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
