function RoleBadge({ role }) {
  const classes =
    role === 'admin'
      ? 'bg-violet-950/40 text-violet-400 border border-violet-900/50'
      : 'bg-sky-950/40 text-sky-400 border border-sky-900/50';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{role}</span>;
}

function VerifiedBadge({ verified }) {
  const classes = verified
    ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50'
    : 'bg-amber-950/40 text-amber-400 border border-amber-900/50';
  const label = verified ? 'Verified' : 'Unverified';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>{label}</span>;
}

export function UsersTable({ users, canEditRole, onEditRole }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a323d] bg-[#1a1f26]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2a323d] text-sm">
          <thead className="bg-[#13171c] text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Verified</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a323d]">
            {users.map((record) => (
              <tr key={record.id} className="hover:bg-[#222933] transition-colors duration-150">
                <td className="px-4 py-3 font-medium text-white">{record.name || '-'}</td>
                <td className="px-4 py-3 text-slate-300">{record.emailDisplay}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={record.role} />
                </td>
                <td className="px-4 py-3">
                  <VerifiedBadge verified={record.verified} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {record.created ? new Date(record.created).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  {canEditRole ? (
                    <button
                      type="button"
                      onClick={() => onEditRole(record)}
                      className="rounded-lg border border-[#3a4454] bg-[#222933] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#2d3745] hover:text-white transition-colors"
                    >
                      Edit role
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}