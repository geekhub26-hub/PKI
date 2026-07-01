import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCertificateRequest, userService } from '../services/api';
import { CheckSquare, Clock3, AlertTriangle, ArrowRight, FileText } from 'lucide-react';

export default function UserRequestPipelinePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<UserCertificateRequest[]>([]);

  useEffect(() => {
    userService
      .getMyRequests()
      .then(setRequests)
      .catch(() => setError('Impossible de charger vos demandes.'))
      .finally(() => setLoading(false));
  }, []);

  const inReviewRequests = requests.filter((r) => ['PENDING_REVIEW', 'PENDING'].includes((r.status || '').toUpperCase()));
  const waitingFinalRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'CSR_SUBMITTED');
  const correctionRequests = requests.filter((r) => ['NEEDS_CORRECTION', 'REJECTED'].includes((r.status || '').toUpperCase()));
  const csrReadyRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'REVIEW_APPROVED');

  if (loading) return <div className="py-10 text-slate-500 dark:text-slate-400">Chargement...</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Demandes en cours</h1>
            <p className="mt-1 text-sm text-white/70">
              Suivez chaque étape, gérez plusieurs demandes en parallèle.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/generate-csr?mode=new')} className="btn btn-green">
              <FileText size={15} /> Nouvelle demande
            </button>
            <button onClick={() => navigate('/certificates')} className="btn btn-primary">
              Mes certificats
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card blue p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">En vérification</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{inReviewRequests.length}</p>
          <Clock3 size={15} className="text-blue-400 mt-2" />
        </div>
        <div className="stat-card amber p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Attente signature</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{waitingFinalRequests.length}</p>
          <CheckSquare size={15} className="text-amber-400 mt-2" />
        </div>
        <div className="stat-card red p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">À corriger</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{correctionRequests.length}</p>
          <AlertTriangle size={15} className="text-red-400 mt-2" />
        </div>
        <div className="stat-card green p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Prêt CSR</p>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{csrReadyRequests.length}</p>
          <ArrowRight size={15} className="text-emerald-400 mt-2" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusList title="En vérification admin" items={inReviewRequests} empty="Aucune demande en vérification." />
        <StatusList title="En attente de signature finale" items={waitingFinalRequests} empty="Aucune demande en attente finale." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionList
          title="À corriger"
          items={correctionRequests}
          actionLabel="Corriger"
          onAction={(r) => navigate(`/generate-csr?mode=correction&id=${r.id}`)}
          empty="Aucune correction demandée."
          showReason
          actionClass="btn btn-primary"
        />
        <ActionList
          title="Prêtes pour l'étape CSR"
          items={csrReadyRequests}
          actionLabel="Continuer CSR"
          onAction={(r) => navigate(`/generate-csr?mode=csr&id=${r.id}`)}
          empty="Aucune demande prête pour CSR."
          actionClass="btn btn-green"
        />
      </div>
    </div>
  );
}

function getStatusClass(status?: string) {
  const value = (status || 'INCONNU').toUpperCase();
  if (['PENDING', 'PENDING_REVIEW'].includes(value)) return 'status-badge status-pending';
  if (['REVIEW_APPROVED', 'CSR_SUBMITTED'].includes(value)) return 'status-badge status-active';
  if (['NEEDS_CORRECTION', 'REJECTED'].includes(value)) return 'status-badge status-rejected';
  if (value === 'ISSUED') return 'status-badge status-active';
  return 'status-badge status-revoked';
}

function StatusList({ title, items, empty }: { title: string; items: UserCertificateRequest[]; empty: string }) {
  return (
    <div className="pki-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs text-slate-500 dark:text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.commonName || 'Demande'}</div>
                <span className={getStatusClass(r.status)}>{r.status}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.organization || 'Organisation non renseignée'}</div>
              <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {r.submittedAt ? `Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : r.id.slice(0, 8)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionList({
  title, items, actionLabel, onAction, empty, showReason = false, actionClass,
}: {
  title: string; items: UserCertificateRequest[]; actionLabel: string;
  onAction: (r: UserCertificateRequest) => void; empty: string;
  showReason?: boolean; actionClass: string;
}) {
  return (
    <div className="pki-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs text-slate-500 dark:text-slate-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.commonName || 'Demande'}</div>
                <span className={getStatusClass(r.status)}>{r.status}</span>
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.organization || 'Organisation non renseignée'}</div>
              <div className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                {r.submittedAt ? `Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : r.id.slice(0, 8)}
              </div>
              {showReason && r.rejectionReason && (
                <div className="mt-2 rounded bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                  {r.rejectionReason}
                </div>
              )}
              <div className="mt-3">
                <button onClick={() => onAction(r)} className={actionClass} style={{ padding: '6px 14px', fontSize: '13px' }}>
                  {actionLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
