import { useMemo, useState, useEffect } from 'react';
import { listUsers, updateUserRole } from '../lib/users';
import { EmptyState, ErrorState, LoadingState } from '../components/StateBlocks';
import { UsersTable } from '../components/UsersTable';
import { useAuth } from '../hooks/useAuth';

export function UsersPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role || 'worker') === 'admin';

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [nextRole, setNextRole] = useState('worker');
  const [isSavingRole, setIsSavingRole] = useState(false);

  async function loadUsers() {
    setIsLoading(true);
    setError('');

    try {
      const response = await listUsers();
      setUsers(response.items);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmins = users.filter((record) => record.role === 'admin').length;
    const totalWorkers = users.filter((record) => record.role === 'worker').length;

    return { totalUsers, totalAdmins, totalWorkers };
  }, [users]);

  function handleOpenEditRole(user) {
    setEditingUser(user);
    setNextRole(user.role || 'worker');
  }

  function handleCloseModal() {
    if (isSavingRole) {
      return;
    }

    setEditingUser(null);
    setNextRole('worker');
  }

  async function handleSaveRole(event) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    setIsSavingRole(true);
    setError('');

    try {
      await updateUserRole(editingUser.id, nextRole);
      await loadUsers();
      handleCloseModal();
    } catch (saveError) {
      setError(saveError?.message || 'Failed to update user role.');
    } finally {
      setIsSavingRole(false);
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading users..." />;
  }

  if (error && users.length === 0) {
    return <ErrorState message={error} onRetry={loadUsers} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Users</h2>
          <p className="text-sm text-slate-400">Manage access roles and account verification status.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard label="Total users" value={summary.totalUsers} />
        <SummaryCard label="Total admins" value={summary.totalAdmins} />
        <SummaryCard label="Total workers" value={summary.totalWorkers} />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      {users.length === 0 ? (
        <EmptyState title="No users found" message="Create users through registration or PocketBase dashboard." />
      ) : (
        <UsersTable users={users} canEditRole={isAdmin} onEditRole={handleOpenEditRole} />
      )}

      {editingUser ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d1117]/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1f26] border border-[#2a323d] p-6 shadow-2xl animate-fade-up">
            <h3 className="text-lg font-bold text-white">Edit role</h3>
            <p className="mt-1 text-sm text-slate-400">
              Update role for {editingUser.name || editingUser.emailDisplay || 'Email hidden'}.
            </p>

            <form onSubmit={handleSaveRole} className="mt-4 space-y-4">
              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-300">
                  Role
                </label>
                <select
                  id="role"
                  value={nextRole}
                  onChange={(event) => setNextRole(event.target.value)}
                  className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
                >
                  <option value="worker" className="bg-[#1a1f26]">worker</option>
                  <option value="admin" className="bg-[#1a1f26]">admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSavingRole}
                  className="rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-[#21262d] hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRole}
                  className="rounded-xl bg-[#c27829] px-4 py-2 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingRole ? 'Saving...' : 'Save role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a323d] bg-[#1a1f26]">
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}