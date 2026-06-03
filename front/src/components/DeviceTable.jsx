import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge';

export function DeviceTable({ devices, isAdmin, onDelete }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a323d] bg-[#1a1f26]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2a323d] text-sm">
          <thead className="bg-[#13171c] text-left text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Inventory</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Assigned To</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a323d]">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-[#222933] transition-colors duration-150">
                <td className="px-4 py-3 font-medium text-white">{device.name}</td>
                <td className="px-4 py-3 text-slate-300">{device.type}</td>
                <td className="px-4 py-3 text-slate-300">{device.inventory_number}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={device.status} />
                </td>
                <td className="px-4 py-3 text-slate-300">{device.expand?.assigned_to?.name || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      to={`/devices/${device.id}`}
                      className="rounded-lg border border-[#3a4454] px-3 py-1.5 font-medium text-slate-200 bg-[#222933] hover:bg-[#2d3745] hover:text-white transition-colors"
                    >
                      Open
                    </Link>
                    {isAdmin ? (
                      <>
                        <Link
                          to={`/devices/${device.id}/edit`}
                          className="rounded-lg border border-cyan-900/50 bg-cyan-950/30 px-3 py-1.5 font-medium text-cyan-400 hover:bg-cyan-900/40 hover:text-cyan-300 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(device)}
                          className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-3 py-1.5 font-medium text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}