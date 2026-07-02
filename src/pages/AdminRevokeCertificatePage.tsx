import { useEffect, useState } from 'react';
import { AdminCertificate, adminService } from '../services/api';
import { ShieldOff, Filter, CheckCircle } from 'lucide-react';

export default function AdminRevokeCertificatePage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [page, setPage]         = useState(1);
  const [pageSize]              = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [reasons, setReasons]   = useState<Record<string, string>>({});
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getCertificates(statusFilter, page - 1, pageSize);
      setCertificates(res.items || []);
      setTotalPages(res.totalPages || 1);
      if (page > (res.totalPages || 1)) setPage(res.totalPages || 1);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(); }, [statusFilter]);
  useEffect(() => { load(); }, [page]);

  async function handleRevoke(id: string) {
    setActionMessage(null);
    setError(null);
    try {
      await adminService.revokeCertificate(id, reasons[id]);
      setActionMessage('Certificat révoqué avec succès.');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la révocation.');
    }
  }

  const statuses = ['ALL', 'ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED'];

  function statusBadgeClass(s: string) {
    switch (s) {
      case 'ACTIVE':    return 'status-badge status-active';
      case 'REVOKED':   return 'status-badge status-revoked';
      case 'EXPIRED':   return 'status-badge status-rejected';
      case 'SUSPENDED': return 'status-badge status-pending';
      default:          return 'status-badge status-pending';
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
            <ShieldOff size={22} /> Révoquer un certificat
          </h1>
          <p className="mt-0.5 text-sm text-white/60">
            Révoquez un certificat actif et publiez automatiquement la nouvelle CRL.
          </p>
        </div>
      </div>

      {/* Filter + pagination */}
      <div className="pki-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Filter size={12} /> Filtrer
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pki-input py-1.5 text-sm"
              style={{ width: 'auto', minWidth: '140px' }}
            >
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Préc
            </button>
            <span className="min-w-[56px] text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ padding: '6px 14px', fontSize: '13px' }}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Suiv →
            </button>
          </div>
        </div>
      </div>

      {/* Banners */}
      {actionMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle size={16} /> {actionMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        <div className="pki-card overflow-hidden">
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="pki-table" style={{ minWidth: '660px' }}>
              <thead>
                <tr>
                  <th>Sujet / Titulaire</th>
                  <th>Numéro de série</th>
                  <th>Statut</th>
                  <th>Raison / Motif</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-slate-400">
                      Aucun certificat trouvé.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>
                        <div className="font-semibold">
                          {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{cert.userEmail || cert.userId}</div>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-slate-500">{cert.serialNumber}</span>
                      </td>
                      <td>
                        <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
                      </td>
                      <td>
                        {cert.status === 'ACTIVE' ? (
                          <input
                            type="text"
                            className="pki-input text-xs"
                            style={{ padding: '5px 10px' }}
                            placeholder="Raison (optionnel)"
                            value={reasons[cert.id] || ''}
                            onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                          />
                        ) : (
                          <span className="text-xs text-slate-500">{cert.revocationReason || '—'}</span>
                        )}
                      </td>
                      <td className="text-center">
                        {cert.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                          >
                            <ShieldOff size={12} /> Révoquer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50 md:hidden">
            {certificates.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">Aucun certificat trouvé.</div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                        {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{cert.userEmail || cert.userId}</div>
                    </div>
                    <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">Série : {cert.serialNumber}</div>
                  {cert.status === 'ACTIVE' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="pki-input text-xs"
                        placeholder="Raison (optionnel)"
                        value={reasons[cert.id] || ''}
                        onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleRevoke(cert.id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        <ShieldOff size={14} /> Révoquer
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Révocation : {cert.revocationReason || '—'}</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
