import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { UserCertificateRequest, userService } from '../services/api';

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

  if (loading) return <div className="py-10 text-neutral-500 dark:text-neutral-300">Chargement...</div>;

  const stats = [
    { label: 'En verification', value: inReviewRequests.length },
    { label: 'En attente signature', value: waitingFinalRequests.length },
    { label: 'A corriger', value: correctionRequests.length },
    { label: 'Pret CSR', value: csrReadyRequests.length },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-8">
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.18),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_55%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
              Suivi utilisateur
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Demandes en cours</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              Suivez chaque etape, gerez plusieurs demandes en parallele et reprenez une correction ou l'envoi CSR.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate('/generate-csr?mode=new')}>Nouvelle demande</Button>
            <Button onClick={() => navigate('/certificates')} variant="outline">
              Mes certificats
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusList title="Demandes en verification admin" items={inReviewRequests} empty="Aucune demande en verification." />
        <StatusList title="Demandes en attente de signature finale" items={waitingFinalRequests} empty="Aucune demande en attente finale." />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionList
          title="Demandes a corriger"
          items={correctionRequests}
          actionLabel="Corriger"
          onAction={(r) => navigate(`/generate-csr?mode=correction&id=${r.id}`)}
          empty="Aucune correction demandee."
          showReason
        />
        <ActionList
          title="Demandes pretes pour etape CSR"
          items={csrReadyRequests}
          actionLabel="Continuer CSR"
          onAction={(r) => navigate(`/generate-csr?mode=csr&id=${r.id}`)}
          empty="Aucune demande prete pour CSR."
        />
      </div>
    </div>
  );
}

function StatusList({
  title,
  items,
  empty,
}: {
  title: string;
  items: UserCertificateRequest[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const meta = getStatusMeta(r.status);
            return (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.commonName || 'Demande'}</div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{r.organization || 'Organisation non renseignee'}</div>
                <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  ID: {r.id} {r.submittedAt ? `• Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActionList({
  title,
  items,
  actionLabel,
  onAction,
  empty,
  showReason = false,
}: {
  title: string;
  items: UserCertificateRequest[];
  actionLabel: string;
  onAction: (request: UserCertificateRequest) => void;
  empty: string;
  showReason?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          {empty}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => {
            const meta = getStatusMeta(r.status);
            return (
              <div key={r.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-950/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{r.commonName || 'Demande'}</div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{r.organization || 'Organisation non renseignee'}</div>
                <div className="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                  ID: {r.id} {r.submittedAt ? `• Soumis le ${new Date(r.submittedAt).toLocaleDateString('fr-FR')}` : ''}
                </div>
                {showReason && r.rejectionReason && (
                  <div className="mt-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                    {r.rejectionReason}
                  </div>
                )}
                <div className="mt-3">
                  <Button onClick={() => onAction(r)}>{actionLabel}</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getStatusMeta(status?: string) {
  const value = (status || 'INCONNU').toUpperCase();
  switch (value) {
    case 'PENDING':
    case 'PENDING_REVIEW':
      return {
        label: value,
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
      };
    case 'REVIEW_APPROVED':
    case 'CSR_SUBMITTED':
      return {
        label: value,
        className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
      };
    case 'NEEDS_CORRECTION':
    case 'REJECTED':
      return {
        label: value,
        className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      };
    case 'ISSUED':
      return {
        label: value,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      };
    default:
      return {
        label: value,
        className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      };
  }
}
