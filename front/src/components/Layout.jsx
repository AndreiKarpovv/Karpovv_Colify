import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const currentRole = user?.role || 'worker';
  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/devices', label: 'Devices' },
    ...(currentRole === 'admin' ? [{ to: '/users', label: 'Users' }, { to: '/billing', label: 'Billing' }] : []),
  ];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-200">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[260px_1fr] lg:p-6">
        <aside className="rounded-3xl bg-[#161b22] p-4 border border-[#21262d] flex flex-col justify-between lg:p-6">
          <div>
            {/* Блок заголовка из нового дизайна */}
            <div className="mb-8 rounded-2xl border border-[#30363d] bg-[#0d1117] p-5 text-center">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inventuurisusteem</p>
              <h1 className="mt-1 text-xl font-bold text-white tracking-wide">Office Inventory</h1>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative block rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#21262d] text-white before:absolute before:left-0 before:top-1/4 before:h-1/2 before:w-1 before:rounded-r before:bg-amber-500'
                        : 'text-slate-400 hover:bg-[#1f242c] hover:text-slate-200'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div>
            {/* Профиль пользователя */}
            <div className="mt-8 rounded-xl bg-[#0d1117] border border-[#21262d] p-3 text-sm flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#21262d] flex items-center justify-center text-xs font-bold text-amber-500 uppercase border border-[#30363d]">
                {user?.name?.[0] || user?.email?.[0] || 'W'}
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-white truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-slate-400 capitalize">Role: {currentRole}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-[#21262d] hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex min-h-[80vh] flex-col rounded-3xl bg-[#161b22] p-4 border border-[#21262d] lg:p-6">
          {/* Хедер рабочей области */}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#21262d] bg-[#0d1117] px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Workspace</p>
              <p className="text-sm font-semibold text-white">Office Device Inventory</p>
            </div>
            <p className="text-sm text-slate-400">{new Date().toLocaleDateString()}</p>
          </header>

          <div className="animate-fade-up flex-1 flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}