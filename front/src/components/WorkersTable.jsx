export function WorkersTable({ workers }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a323d] bg-[#1a1f26]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2a323d] text-sm">
          <thead className="bg-[#13171c] text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a323d]">
            {workers.map((worker) => (
              <tr key={worker.id} className="hover:bg-[#222933] transition-colors duration-150">
                <td className="px-4 py-3 font-medium text-white">{worker.name || '-'}</td>
                <td className="px-4 py-3 text-slate-300">{worker.email}</td>
                <td className="px-4 py-3 text-slate-300 capitalize">{worker.role}</td>
                <td className="px-4 py-3 text-slate-300">
                  {new Date(worker.created).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}