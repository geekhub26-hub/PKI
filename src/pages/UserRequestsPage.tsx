import { useEffect, useState } from 'react';
import { userService } from '../services/api';
import {
  FileText, Download, Eye, CalendarDays, Building2,
  CheckCircle, Clock, XCircle, AlertTriangle,
} from 'lucide-react';

interface RequestDocument {
  filename: string;
  requestId: string;
}

function statusBadgeClass(status?: string) {
  const v = (status || 'INCONNU').toUpperCase();
  switch (v) {
    case 'PENDING':
    case 'PENDING_REVIEW':      return 'status-badge status-pending';
    case 'REVIEW_APPROVED':
    case 'CSR_SUBMITTED':       return 'status-badge status-active';
    case 'NEEDS_CORRECTION':    return 'status-badge status-rejected';
    case 'ISSUED':              return 'status-badge status-active';
    case 'REJECTED':            return 'status-badge status-revoked';
    default:                    return 'status-badge status-pending';
  }
}

function statusLabel(status?: string) {
  const v = (status || 'INCONNU').toUpperCase();
  const map: Record<string, string> = {
    PENDING: 'En attente',
    PENDING_REVIEW: 'En vérification',
    REVIEW_APPROVED: 'Vérif. approuvée',
    CSR_SUBMITTED: 'CSR soumis',
    NEEDS_CORRECTION: 'Correction requise',
    ISSUED: 'Certifié',
    REJECTED: 'Rejeté',
  };
  return map[v] ?? v;
}

function statusIcon(status?: string) {
  const v = (status || '').toUpperCase();
  if (v === 'ISSUED')           return <CheckCircle size={13} />;
  if (v === 'REJECTED')         return <XCircle size={13} />;
  if (v === 'NEEDS_CORRECTION') return <AlertTriangle size={13} />;
  return <Clock size={13} />;
}

export default function UserRequestsPage() {
  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
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
      setError('Impossible de visualiser la pièce jointe.');
    }
  };

  const downloadDocument = async (doc: RequestDocument) => {
    let url = '';
    try {
      const blob = await userService.getRequestDocumentBlob(doc.requestId, doc.filename, false);
      url = URL.createObjectURL(blob);
    } catch {
      setError('Impossible de télécharger la pièce jointe.');
      return;
    }
    const link = document.createElement('a');
    link.href = url; link.download = doc.filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null); setPreviewType(null); setPreviewName('');
  };

  const issued  = requests.filter((r) => r.status === 'ISSUED').length;
  const pending = requests.filter((r) => ['PENDING', 'PENDING_REVIEW', 'CSR_SUBMITTED', 'REVIEW_APPROVED'].includes(r.status)).length;
  const rejected = requests.filter((r) => r.status === 'REJECTED' || r.status === 'NEEDS_CORRECTION').length;

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">PKI ANTIC</p>
            <h1 className="text-2xl font-bold text-white">Suivi de mes demandes</h1>
            <p className="mt-0.5 text-sm text-white/60">Consultez l'état de vos demandes et les pièces jointes.</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
              <div className="text-xl font-bold text-emerald-300">{issued}</div>
              <div className="text-[11px] text-white/60">Certifié{issued > 1 ? 's' : ''}</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
              <div className="text-xl font-bold text-amber-300">{pending}</div>
              <div className="text-[11px] text-white/60">En cours</div>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-center ring-1 ring-white/20">
              <div className="text-xl font-bold text-rose-300">{rejected}</div>
              <div className="text-[11px] text-white/60">Rejeté{rejected > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="pki-card p-12 text-center">
          <FileText size={36} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-500">Aucune demande trouvée.</p>
          <p className="mt-1 text-xs text-slate-400">Commencez par soumettre une demande de certificat.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="pki-card p-5">
              {/* Card header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                    <FileText size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-100">
                      {r.commonName || 'Sans titre'}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      {r.organization && (
                        <span className="flex items-center gap-1">
                          <Building2 size={11} /> {r.organization}
                        </span>
                      )}
                      {r.submittedAt && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} /> {r.submittedAt?.slice(0, 10)}
                        </span>
                      )}
                    </div>
                    {r.notes && String(r.notes).includes('RENEWAL_OF') && (
                      <span className="mt-1.5 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        Renouvellement
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`${statusBadgeClass(r.status)} inline-flex items-center gap-1`}>
                    {statusIcon(r.status)} {statusLabel(r.status)}
                  </span>
                </div>
              </div>

              {/* Rejection/correction banner */}
              {r.rejectionReason && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span><span className="font-semibold">Motif admin :</span> {r.rejectionReason}</span>
                </div>
              )}

              {/* Documents */}
              {r.documents && r.documents.length > 0 && (
                <div className="mt-4">
                  <div className="section-title mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-slate-400" />
                      <span>Pièces jointes ({r.documents.length})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {r.documents.map((d: string) => (
                      <div key={d} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <FileText size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate text-sm text-slate-700 dark:text-slate-300">{d}</span>
                        </div>
                        <div className="ml-2 flex shrink-0 gap-2">
                          <button
                            onClick={() => previewDocument({ filename: d, requestId: r.id })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                          >
                            <Eye size={12} /> Visualiser
                          </button>
                          <button
                            onClick={() => downloadDocument({ filename: d, requestId: r.id })}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <Download size={12} /> Télécharger
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Document preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-3">
              <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{previewName}</span>
              <button
                onClick={closePreview}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700"
              >
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
                  <p className="text-sm text-slate-600 dark:text-slate-300">Aperçu non supporté pour ce type de fichier.</p>
                  <a href={previewUrl} download={previewName} className="btn btn-primary inline-flex">
                    <Download size={14} /> Télécharger
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
