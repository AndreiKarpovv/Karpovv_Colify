import { useEffect, useState } from 'react';
import { activateWorkspaceSubscription, createSubscriptionCheckoutSession, confirmBillingSession, getHostedPaymentLink, hasHostedPaymentLink } from '../lib/billing';
import { activateWorkspaceDirect, getWorkspaceSummary } from '../lib/workspaces';
import { pb } from '../lib/pocketbase';
import { ErrorState, LoadingState, NoWorkspaceState } from '../components/StateBlocks';
import { useAuth } from '../hooks/useAuth';
import { devLog } from '../utils/devLogger';
import { PB_COLLECTIONS } from '../lib/pbCollections';

export function BillingPage() {
  const { user, workspace, workspaceError, isWorkspaceReady, refreshWorkspace } = useAuth();
  const isAdmin = (user?.role || 'worker') === 'admin';

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const pendingWorkspaceStorageKey = 'billing_pending_workspace_id';

  async function loadSummary(workspaceId) {
    setIsLoading(true);
    setError('');
    devLog('billing.load.start', { workspaceId, user: pb.authStore.model });

    try {
      const nextSummary = await getWorkspaceSummary(workspaceId);
      setSummary(nextSummary);
      devLog('billing.load.summary', nextSummary);
    } catch (loadError) {
      setError(loadError?.message || 'Failed to load billing data.');
      devLog('billing.load.error', {
        message: loadError?.message,
        status: loadError?.status,
        data: loadError?.data,
        configuredCollections: PB_COLLECTIONS,
      });
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
      setSummary(null);
      return;
    }

    loadSummary(workspace.id);
  }, [isWorkspaceReady, workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      return;
    }

    let cancelled = false;

    async function confirmAndRefresh() {
      setIsConfirming(true);

      try {
        await confirmBillingSession({
          sessionId,
          workspaceId: workspace.id,
        });

        if (!cancelled) {
          await loadSummary(workspace.id);
          const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch (confirmError) {
        if (!cancelled) {
          setError(confirmError?.message || 'Failed to confirm subscription payment.');
        }
      } finally {
        if (!cancelled) {
          setIsConfirming(false);
        }
      }
    }

    confirmAndRefresh();

    return () => {
      cancelled = true;
    };
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) {
      return;
    }

    const pendingWorkspaceId = window.localStorage.getItem(pendingWorkspaceStorageKey);

    if (pendingWorkspaceId !== workspace.id) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    let cancelled = false;

    async function syncAfterHostedPayment() {
      setIsConfirming(true);

      try {
        if (sessionId) {
          await confirmBillingSession({
            sessionId,
            workspaceId: workspace.id,
          });
        }

        try {
          await activateWorkspaceSubscription({ workspaceId: workspace.id });
        } catch (apiError) {
          devLog('billing.activate.api.error', {
            message: apiError?.message,
          });

          await activateWorkspaceDirect(workspace.id);
        }

        const nextSummary = await getWorkspaceSummary(workspace.id);

        if (!cancelled) {
          setSummary(nextSummary);

          if (nextSummary.status === 'active' || nextSummary.status === 'trialing') {
            window.localStorage.removeItem(pendingWorkspaceStorageKey);
          }
        }
      } catch (syncError) {
        if (!cancelled) {
          setError(syncError?.message || 'Failed to confirm subscription status.');
        }
      } finally {
        if (!cancelled) {
          setIsConfirming(false);
        }
      }
    }

    syncAfterHostedPayment();

    return () => {
      cancelled = true;
    };
  }, [workspace?.id]);

  async function handleUpgrade() {
    if (!summary?.workspace?.id) {
      return;
    }

    setIsRedirecting(true);
    setError('');

    try {
      // Никаких проверок хостинг-ссылок. Стучимся СТРОГО на твой Express-бэк
      const payload = await createSubscriptionCheckoutSession({
        workspaceId: summary.workspace.id,
        userEmail: pb.authStore.record?.email,
      });

      const url = payload?.url;

      if (!url) {
        throw new Error('Checkout URL was not returned from the backend.');
      }

      window.localStorage.setItem(pendingWorkspaceStorageKey, summary.workspace.id);
      window.location.href = url;
    } catch (upgradeError) {
      setError(upgradeError?.message || 'Failed to start Stripe Checkout.');
      setIsRedirecting(false);
    }
  }

  if (!isWorkspaceReady || isLoading || isConfirming) {
    return <LoadingState message="Loading billing..." />;
  }

  if (!workspace?.id) {
    return <NoWorkspaceState message={workspaceError} onRetry={refreshWorkspace} isAdmin={isAdmin} />;
  }

  if (error && !summary) {
    return <ErrorState message={error} onRetry={() => loadSummary(workspace.id)} />;
  }

  const planName = summary.isUnlimited ? 'Unlimited' : 'Free';
  const usageText = summary.isUnlimited ? `${summary.usedDevices} / Unlimited` : `${summary.usedDevices} / ${summary.limit}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Billing</h2>
        <p className="text-sm text-slate-400">Workspace-level subscription and device usage limits.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Workspace" value={summary.workspace.name || '-'} />
        <Card label="Plan" value={planName} />
        <Card label="Subscription status" value={summary.status} isStatus />
        <Card label="Device usage" value={usageText} />
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-6">
        {!summary.isUnlimited ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Free plan allows up to 10 devices. Upgrade to Unlimited to remove the cap.
            </p>
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isRedirecting}
              className="rounded-xl bg-[#c27829] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRedirecting ? 'Redirecting to Stripe...' : 'Upgrade to Unlimited'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-400">Subscription active</p>
            <p className="text-sm text-slate-400">Your workspace can create unlimited devices.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, isStatus = false }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a323d] bg-[#1a1f26]">
      <div className="p-5">
        <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
        <p 
          className={`mt-2 text-xl font-bold ${
            isStatus && (value === 'active' || value === 'trialing') 
              ? 'text-emerald-400 capitalize' 
              : 'text-white'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}