import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d1117] p-6">
      <div className="w-full max-w-lg rounded-3xl bg-[#1a1f26] border border-[#2a323d] p-10 text-center shadow-2xl">
        <p className="text-sm uppercase tracking-[0.2em] text-[#e2a053] font-semibold">404</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">The page you are looking for does not exist.</p>
        <Link 
          to="/dashboard" 
          className="mt-6 inline-block rounded-xl bg-[#c27829] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}