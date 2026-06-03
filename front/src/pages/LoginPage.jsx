import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { isAuthenticated, loginWithPassword, loginWithOAuth, oauthProviders } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await loginWithPassword(email, password);
      navigate(from, { replace: true });
    } catch (submitError) {
      setError(submitError?.message || 'Failed to login. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOAuthLogin(providerName) {
    setError('');

    try {
      await loginWithOAuth(providerName);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError?.message || 'OAuth login failed.');
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#0d1117] lg:grid-cols-2">
      {/* Левая декоративная панель */}
      <div className="hidden bg-[#161b22] border-r border-[#21262d] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Office Device Inventory</p>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight text-white tracking-wide">
            Smart inventory tracking for modern office teams.
          </h1>
        </div>
        <p className="text-slate-400 text-sm">Track devices, ownership, and maintenance notes in one place.</p>
      </div>

      {/* Правая панель с формой */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md rounded-3xl bg-[#1a1f26] border border-[#2a323d] p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-400">Use your account to access the inventory dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>

            {error ? (
              <p className="rounded-lg bg-rose-950/20 border border-rose-900/50 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#c27829] px-4 py-2.5 font-semibold text-white hover:bg-[#db8b35] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {oauthProviders.length > 0 ? (
            <div className="mt-6 pt-6 border-t border-[#21262d]">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Or continue with</p>
              <div className="flex flex-wrap gap-2">
                {oauthProviders.map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    onClick={() => handleOAuthLogin(provider.name)}
                    className="rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-[#21262d] hover:text-white transition-colors"
                  >
                    {provider.displayName || provider.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <p className="mt-6 text-sm text-slate-400">
            No account?{' '}
            <Link className="font-semibold text-amber-500 hover:text-amber-400 underline transition-colors" to="/register">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}