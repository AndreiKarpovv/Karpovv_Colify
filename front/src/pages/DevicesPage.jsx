import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DeviceTable } from '../components/DeviceTable';
import { WorkersTable } from '../components/WorkersTable';
import { EmptyState, ErrorState, LoadingState, NoWorkspaceState } from '../components/StateBlocks';
import { deleteDevice, listDevices, listLegacyDevicesWithoutWorkspace, migrateLegacyDevicesToWorkspace } from '../lib/devices';
import { listWorkers } from '../lib/users';
import { getWorkspaceSummary } from '../lib/workspaces';
import { useAuth } from '../hooks/useAuth';

export function DevicesPage() {
  const { user, workspace, workspaceError, isWorkspaceReady, refreshWorkspace } = useAuth();
  const isAdmin = (user?.role || 'worker') === 'admin';

  const [items, setItems] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [legacyDevicesCount, setLegacyDevicesCount] = useState(0);
  const [isMigratingLegacy, setIsMigratingLegacy] = useState(false);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((device) => {
      return (
        device.name?.toLowerCase().includes(normalized) ||
        device.type?.toLowerCase().includes(normalized) ||
        device.inventory_number?.toLowerCase().includes(normalized) ||
        device.serial_number?.toLowerCase().includes(normalized)
      );
    });
  }, [items, query]);

  async function loadDevices(workspaceId) {
    setIsLoading(true);
    setError('');

    try {
      const devicesPromise = listDevices({ workspaceId });
      const workersPromise = isAdmin ? listWorkers() : Promise.resolve({ items: [] });
      const workspacePromise = getWorkspaceSummary(workspaceId);
      const legacyPromise = isAdmin ? listLegacyDevicesWithoutWorkspace({ page: 1, perPage: 1 }) : Promise.resolve({ totalItems: 0 });

      const [devicesResponse, workersResponse, workspaceData, legacyResponse] = await Promise.all([
        devicesPromise,
        workersPromise,
        workspacePromise,
        legacyPromise,
      ]);

      setItems(devicesResponse.items);
      setWorkers(workersResponse.items);
      setWorkspaceSummary(workspaceData);
      setLegacyDevicesCount(legacyResponse.totalItems || 0);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to fetch devices.');
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
      setItems([]);
      setWorkers([]);
      setWorkspaceSummary(null);
      setLegacyDevicesCount(0);
      return;
    }

    loadDevices(workspace.id);
  }, [isAdmin, isWorkspaceReady, workspace?.id]);

  async function handleMigrateLegacyDevices() {
    if (!workspace?.id || !legacyDevicesCount) {
      return;
    }

    setIsMigratingLegacy(true);

    try {
      const migrated = await migrateLegacyDevicesToWorkspace(workspace.id);
      window.alert(`Migrated ${migrated} legacy devices to current workspace.`);
      await loadDevices(workspace.id);
    } catch (migrationError) {
      window.alert(migrationError?.message || 'Failed to migrate legacy devices.');
    } finally {
      setIsMigratingLegacy(false);
    }
  }

  async function handleDelete(device) {
    const confirmed = window.confirm(`Delete device "${device.name}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteDevice(device.id);
      setItems((current) => current.filter((item) => item.id !== device.id));
    } catch (deleteError) {
      window.alert(deleteError?.message || 'Delete failed.');
    }
  }

  /* ТУТ ИСПРАВЛЕНО: оператор "not" заменен на валидный логический "!" */
  if (!isWorkspaceReady || isLoading) {
    return <LoadingState message="Loading devices..." />;
  }

  if (!workspace?.id) {
    return <NoWorkspaceState message={workspaceError} onRetry={refreshWorkspace} isAdmin={isAdmin} />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => loadDevices(workspace.id)} />;
  }

  const limitReached = Boolean(workspaceSummary && !workspaceSummary.isUnlimited && workspaceSummary.usedDevices >= workspaceSummary.limit);

  return (
    <div className="space-y-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Devices</h2>
          <p className="text-sm text-slate-400">Browse all office equipment and ownership details.</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, type, inventory..."
            className="w-72 rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
          />
          {isAdmin ? (
            limitReached ? (
              <Link to="/billing" className="rounded-xl bg-[#c27829] px-4 py-2 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors">
                Upgrade to add device
              </Link>
            ) : (
              <Link to="/devices/new" className="rounded-xl bg-[#c27829] px-4 py-2 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors">
                Add device
              </Link>
            )
          ) : null}
        </div>
      </div>

      {limitReached ? (
        <div className="rounded-xl border border-[#5e4225] bg-[#2d2216] px-4 py-3 text-sm text-[#cfa06a]">
          <p>Free plan allows up to 10 devices. Upgrade to Unlimited to add more.</p>
          <Link to="/billing" className="mt-1.5 inline-block font-semibold text-[#e2a053] underline hover:text-[#db8b35]">
            Open billing
          </Link>
        </div>
      ) : null}

      {isAdmin && legacyDevicesCount > 0 ? (
        <div className="rounded-xl border border-[#384459] bg-[#1c212b] px-4 py-3 text-sm text-slate-300">
          <p>
            Found {legacyDevicesCount} legacy device{legacyDevicesCount > 1 ? 's' : ''} without workspace assignment.
          </p>
          <button
            type="button"
            onClick={handleMigrateLegacyDevices}
            disabled={isMigratingLegacy}
            className="mt-2 rounded-lg border border-[#3a4454] bg-[#222933] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-[#2d3745] hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMigratingLegacy ? 'Migrating...' : 'Attach legacy devices'}
          </button>
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <EmptyState title="No devices found" message="Try adjusting search filters or add a new device." />
      ) : (
        <DeviceTable devices={filteredItems} isAdmin={isAdmin} onDelete={handleDelete} />
      )}

      {isAdmin ? (
        <section className="space-y-4 pt-4 border-t border-[#21262d]">
          <div>
            <h3 className="text-xl font-bold text-white">Workers</h3>
            <p className="text-sm text-slate-400">Visible only for admin users.</p>
          </div>

          {workers.length === 0 ? (
            <EmptyState title="No workers found" message="Create users in PocketBase auth collection." />
          ) : (
            <WorkersTable workers={workers} />
          )}
        </section>
      ) : null}
    </div>
  );
}