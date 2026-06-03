import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createDevice, getDeviceById, updateDevice } from '../lib/devices';
import { pb } from '../lib/pocketbase';
import { PB_COLLECTIONS } from '../lib/pbCollections';
import { getWorkspaceSummary } from '../lib/workspaces';
import { DEVICE_STATUSES, DEVICE_TYPES, STATUS_LABELS, TYPE_LABELS } from '../utils/inventory';
import { ErrorState, LoadingState, NoWorkspaceState } from '../components/StateBlocks';
import { useAuth } from '../hooks/useAuth';

const initialForm = {
  name: '',
  type: 'laptop',
  inventory_number: '',
  serial_number: '',
  status: 'available',
  assigned_to: '',
  description: '',
};

export function DeviceFormPage() {
  const { user, workspace, workspaceError, isWorkspaceReady, refreshWorkspace } = useAuth();
  const isAdmin = (user?.role || 'worker') === 'admin';

  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [workspaceSummary, setWorkspaceSummary] = useState(null);

  const pageTitle = useMemo(() => (isEdit ? 'Edit device' : 'Add device'), [isEdit]);

  async function loadData(workspaceId) {
    setIsLoading(true);
    setLoadError('');

    try {
      const usersPromise = pb.collection(PB_COLLECTIONS.USERS_COLLECTION).getList(1, 200, { sort: 'name' });
      const devicePromise = isEdit ? getDeviceById(id) : Promise.resolve(null);
      const workspacePromise = getWorkspaceSummary(workspaceId);

      const [usersResponse, device, workspaceData] = await Promise.all([usersPromise, devicePromise, workspacePromise]);
      setUsers(usersResponse.items);
      setWorkspaceSummary(workspaceData);

      if (device) {
        setForm({
          name: device.name || '',
          type: device.type || 'laptop',
          inventory_number: device.inventory_number || '',
          serial_number: device.serial_number || '',
          status: device.status || 'available',
          assigned_to: device.assigned_to || '',
          description: device.description || '',
        });
      }
    } catch (loadError) {
      setLoadError(loadError?.message || 'Failed to load form data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!isWorkspaceReady) {
      return;
    }

    if (!workspace?.id) {
      setIsLoading(false);
      return;
    }

    loadData(workspace.id);
  }, [id, isWorkspaceReady, workspace?.id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      ...form,
      assigned_to: form.assigned_to || null,
    };

    try {
      if (isEdit) {
        await updateDevice(id, payload);
      } else {
        const workspaceId = workspace?.id;

        if (!workspaceId) {
          throw new Error('Current user is not attached to a workspace.');
        }

        const summary = await getWorkspaceSummary(workspaceId);
        const limitReached = !summary.isUnlimited && summary.usedDevices >= summary.limit;

        if (limitReached) {
          throw new Error('Free plan allows up to 10 devices. Upgrade to Unlimited to add more.');
        }

        payload.workspace = workspaceId;
        await createDevice(payload);
      }

      navigate('/devices');
    } catch (submitError) {
      setError(submitError?.message || 'Failed to save device.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isWorkspaceReady || isLoading) {
    return <LoadingState message="Loading form..." />;
  }

  if (!workspace?.id) {
    return <NoWorkspaceState message={workspaceError} onRetry={refreshWorkspace} isAdmin={isAdmin} />;
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => loadData(workspace.id)} />;
  }

  const createLimitReached = Boolean(!isEdit && workspaceSummary && !workspaceSummary.isUnlimited && workspaceSummary.usedDevices >= workspaceSummary.limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{pageTitle}</h2>
          <p className="text-sm text-slate-400">Manage inventory metadata and ownership.</p>
        </div>
        <Link 
          to="/devices" 
          className="rounded-xl border border-[#30363d] bg-[#0d1117] px-4 py-2 text-sm font-medium text-slate-200 hover:bg-[#21262d] hover:text-white transition-colors"
        >
          Back to list
        </Link>
      </div>

      {createLimitReached ? (
        <div className="rounded-xl border border-[#5e4225] bg-[#2d2216] px-4 py-3 text-sm text-[#cfa06a]">
          <p>Free plan allows up to 10 devices. Upgrade to Unlimited to add more.</p>
          <Link to="/billing" className="mt-1.5 inline-block font-semibold text-[#e2a053] underline hover:text-[#db8b35]">
            Open billing
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[#2a323d] bg-[#1a1f26] p-6 shadow-soft">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Name</label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" 
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Type</label>
            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange} 
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
            >
              {DEVICE_TYPES.map((type) => (
                <option key={type} value={type} className="bg-[#1a1f26]">
                  {TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Inventory number</label>
            <input
              name="inventory_number"
              value={form.inventory_number}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Serial number</label>
            <input 
              name="serial_number" 
              value={form.serial_number} 
              onChange={handleChange} 
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors" 
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Status</label>
            <select 
              name="status" 
              value={form.status} 
              onChange={handleChange} 
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
            >
              {DEVICE_STATUSES.map((status) => (
                <option key={status} value={status} className="bg-[#1a1f26]">
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Assigned to</label>
            <select 
              name="assigned_to" 
              value={form.assigned_to} 
              onChange={handleChange} 
              className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
            >
              <option value="" className="bg-[#1a1f26]">Unassigned</option>
              {users.map((worker) => (
                <option key={worker.id} value={worker.id} className="bg-[#1a1f26]">
                  {worker.name || worker.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none transition-colors"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-950/20 border border-rose-900/50 px-3 py-2 text-sm text-rose-300">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || createLimitReached}
          className="rounded-xl bg-[#c27829] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create device'}
        </button>
      </form>
    </div>
  );
}