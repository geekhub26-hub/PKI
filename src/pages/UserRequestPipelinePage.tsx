import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCertificateRequest, userService } from '../services/api';
import {
  CheckSquare, AlertTriangle, ArrowRight,
  FileText, Eye, ChevronRight,
} from 'lucide-react';

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

  const inReviewRequests     = requests.filter((r) => ['PENDING_REVIEW', 'PENDING'].includes((r.status || '').toUpperCase()));
  const waitingFinalRequests = requests.filter((r) => (r.status || '').toUpperCase() === 'CSR_SUBMITTED');
  const correctionRequests   = requests.filter((r) => ['NEEDS_CORRECTION', 'REJECTED'].includes((r.status || '').toUpperCase()));
  const csrReadyRequests     = requests.filter((r) => (r.status || '').toUpperCase() === 'REVIEW_APPROVED');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Banner */}
      <div className="page-header-bar">
        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="text-2xl font-bold text-white">Demandes en cours</h1>
            <p className="mt-0.5 text-sm text-white/60">
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

      {/* 4 KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Eye size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{inReviewRequests.length}</div>
            <div className="kpi-label">En vérification</div>
          </div>
        </div>
        <div className="kpi-card amber">
          <div className="kpi-icon amber"><CheckSquare size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{waitingFinalRequests.length}</div>
            <div className="kpi-label">Attente signature</div>
          </div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-icon red"><AlertTriangle size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{correctionRequests.length}</div>
            <div className="kpi-label">À corriger</div>
          </div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-icon green"><ArrowRight size={22} /></div>
          <div className="kpi-body">
            <div className="kpi-value">{csrReadyRequests.length}</div>
            <div className="kpi-label">Prêt CSR</div>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatusList
          title="En vérification admin"
          icon={<Eye size={15} className="text-blue-500" />}
          items={inReviewRequests}
          empty="Aucune demande en vérification."
        />
        <StatusList
          title="En attente de signature finale"
          icon={<CheckSquare size={15} className="text-amber-500" />}
          items={waitingFinalRequests}
          empty="Aucune demande en attente finale."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActionList
          title="À corriger"
          icon={<AlertTriangle size={15} className="text-red-500" />}
          items={correctionRequests}
          actionLabel="Corriger"
          onAction={(r) => navigate(`/generate-csr?mode=correction&id=${r.id}`)}
          empty="Aucune correction demandée."
          showReason
          actionClass="btn btn-primary"
        />
        <ActionList
          title="Prêtes pour l'étape CSR"
          icon={<ArrowRight size={15} className="text-emerald-500" />}
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

function StatusList({
  title, icon, items, empty,
}: {
  title: string; icon: React.ReactNode; items: UserCertificateRequest[]; empty: string;
}) {
  return (
    <div className="pki-card p-5">
      <div className="section-title">
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-5 text-xs text-slate-500 dark:text-slate-400 text-center">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {r.commonName || 'Demande'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {r.organization || 'Organisation non renseignée'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {r.submittedAt ? `Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : r.id.slice(0, 8)}
                  </p>
                </div>
                <span className={`${getStatusClass(r.status)} shrink-0`}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionList({
  title, icon, items, actionLabel, onAction, empty, showReason = false, actionClass,
}: {
  title: string; icon: React.ReactNode; items: UserCertificateRequest[];
  actionLabel: string; onAction: (r: UserCertificateRequest) => void;
  empty: string; showReason?: boolean; actionClass: string;
}) {
  return (
    <div className="pki-card p-5">
      <div className="section-title">
        <div className="flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-700/60 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-5 text-xs text-slate-500 dark:text-slate-400 text-center">
          {empty}
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30 p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {r.commonName || 'Demande'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {r.organization || 'Organisation non renseignée'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    {r.submittedAt ? `Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : r.id.slice(0, 8)}
                  </p>
                  {showReason && r.rejectionReason && (
                    <div className="mt-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                      {r.rejectionReason}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onAction(r)}
                  className={`${actionClass} shrink-0`}
                  style={{ padding: '5px 12px', fontSize: '12px' }}
                >
                  {actionLabel} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
