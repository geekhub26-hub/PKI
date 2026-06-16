import { useEffect, useState } from 'react';
import { userService } from '../services/api';

interface RequestDocument {
  filename: string;
  requestId: string;
}

export default function UserRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  useEffect(() => {
    userService
      .getMyRequests()
      .then(setRequests)
      .catch(() => setError('Erreur lors du chargement des demandes.'))
      .finally(() => setLoading(false));
  }, []);

  const previewDocument = async (doc: RequestDocument) => {
    try {
      const blob = await userService.getRequestDocumentBlob(doc.requestId, doc.filename, true);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewType(blob.type || null);
      setPreviewName(doc.filename);
    } catch {
      setError("Impossible de visualiser la piece jointe.");
    }
  };

  const downloadDocument = async (doc: RequestDocument) => {
    let url = '';
    try {
      const blob = await userService.getRequestDocumentBlob(doc.requestId, doc.filename, false);
      url = URL.createObjectURL(blob);
    } catch {
      setError("Impossible de telecharger la piece jointe.");
      return;
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewName('');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-h3 font-semibold text-[var(--text-1)]">Suivi de mes demandes</h2>
            <p className="text-sm text-[var(--text-3)]">Consultez l'etat de vos demandes et les pieces jointes.</p>
          </div>
          <div className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {requests.length} demande(s)
          </div>
        </div>
      </header>
      {loading ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
          Chargement...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
          Aucune demande trouvee.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-[var(--text-1)]">{r.commonName}</div>
                  <div className="text-sm text-[var(--text-3)]">{r.organization}</div>
                  <div className="text-xs text-[var(--text-3)]">Soumis le: {r.submittedAt?.slice(0, 10)}</div>
                  {r.notes && String(r.notes).includes('RENEWAL_OF') && (
                    <div className="mt-2 inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                      Renouvellement
                    </div>
                  )}
                  {r.rejectionReason && (
                    <div className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                      Motif admin: {r.rejectionReason}
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusMeta(r.status).className}`}>
                    {getStatusMeta(r.status).label}
                  </span>
                </div>
              </div>
              {r.documents && r.documents.length > 0 && (
                <div className="mt-3">
                  <div className="mb-2 text-sm font-semibold text-[var(--text-1)]">Pieces jointes</div>
                  <ul className="space-y-2">
                    {r.documents.map((d: string) => (
                      <li key={d} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-2 dark:border-neutral-800 dark:bg-neutral-950/40">
                        <div className="flex-1 truncate text-sm text-neutral-700 dark:text-neutral-300">{d}</div>
                        <div className="ml-2 flex gap-2">
                          <button
                            onClick={() => previewDocument({ filename: d, requestId: r.id })}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50"
                          >
                            Visualiser
                          </button>
                          <button
                            onClick={() => downloadDocument({ filename: d, requestId: r.id })}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
                          >
                            Telecharger
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
                <div className="truncate text-sm font-semibold dark:text-neutral-100">{previewName}</div>
              <button onClick={closePreview} className="rounded bg-neutral-100 px-3 py-1 text-sm dark:bg-neutral-800 dark:text-neutral-100">
                Fermer
              </button>
            </div>
            <div className="max-h-[80vh] overflow-auto p-3">
              {previewType?.startsWith('image/') ? (
                <img src={previewUrl} alt={previewName} className="mx-auto max-h-[75vh] w-auto rounded" />
              ) : previewType === 'application/pdf' ? (
                <iframe src={previewUrl} className="h-[75vh] w-full rounded" title={previewName} />
              ) : (
                <div className="space-y-3 p-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">Apercu non supporte pour ce type de fichier.</p>
                  <a href={previewUrl} download={previewName} className="inline-block rounded bg-primary-700 px-4 py-2 text-sm text-white">
                    Telecharger le fichier
                  </a>
                </div>
              )}
            </div>
          </div>
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
      return {
        label: value,
        className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
      };
    case 'ISSUED':
      return {
        label: value,
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
      };
    case 'REJECTED':
      return {
        label: value,
        className: 'bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
      };
    default:
      return {
        label: value,
        className: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
      };
  }
}
