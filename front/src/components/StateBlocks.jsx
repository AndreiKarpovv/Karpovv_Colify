export function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="rounded-2xl border border-[#21262d] bg-[#161b22] p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-amber-500" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-900/50 bg-rose-950/20 p-6 text-rose-300">
      <p className="font-medium text-rose-400">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition-colors"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title = 'No data yet', message = 'Add your first record to get started.' }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#30363d] bg-[#161b22] p-10 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function NoWorkspaceState({ message, onRetry, isAdmin }) {
  const normalizedMessage = String(message || '');
  const schemaMissing = normalizedMessage.includes("PocketBase collection 'workspaces' is missing");

  return (
    <div className="rounded-2xl border border-[#5e4225] bg-[#2d2216] p-6">
      <h3 className="text-lg font-semibold text-[#e2a053]">Workspace required</h3>
      <p className="mt-2 text-sm text-[#cfa06a]">
        {message || 'Your account is not attached to a workspace. Contact administrator.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[#c27829] px-4 py-2 text-sm font-semibold text-white hover:bg-[#db8b35] transition-colors"
        >
          {schemaMissing ? 'Retry after schema setup' : isAdmin ? 'Recover workspace' : 'Retry'}
        </button>
      ) : null}
    </div>
  );
}