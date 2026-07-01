import { useEffect, useState } from 'react';
import { AdminCertificate, adminService } from '../services/api';

export default function AdminRevokeCertificatePage() {
  const [certificates, setCertificates] = useState<AdminCertificate[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [reasons, setReasons] = useState<Record<string, string>>({});
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

  useEffect(() => {
    setPage(1);
    load();
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [page]);

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
      case 'ACTIVE': return 'status-badge status-active';
      case 'REVOKED': return 'status-badge status-revoked';
      case 'EXPIRED': return 'status-badge status-rejected';
      case 'SUSPENDED': return 'status-badge status-pending';
      default: return 'status-badge status-pending';
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar">
        <h1 className="text-2xl font-bold text-white">Révoquer un certificat</h1>
        <p className="mt-1 text-sm text-white/70">
          Révoquez un certificat actif et publiez automatiquement la nouvelle CRL.
        </p>
      </div>

      {/* Filter bar */}
      <div className="pki-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">Filtrer :</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pki-input !py-1.5 !text-sm w-auto"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-primary !py-1.5 !px-3 !text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Préc
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{page} / {totalPages}</span>
          <button
            className="btn btn-primary !py-1.5 !px-3 !text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suiv
          </button>
        </div>
      </div>

      {/* Action / error banners */}
      {actionMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {actionMessage}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Certificate list */}
      {loading ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
      ) : (
        <div className="pki-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <th className="px-5 py-3">Sujet / CN</th>
                  <th className="px-5 py-3">Numéro de série</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3">Raison</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Aucun certificat trouvé.
                    </td>
                  </tr>
                ) : (
                  certificates.map((cert) => (
                    <tr key={cert.id} className="border-t border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{cert.userEmail || cert.userId}</div>
                      </td>
                      <td className="px-5 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{cert.serialNumber}</td>
                      <td className="px-5 py-3">
                        <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
                      </td>
                      <td className="px-5 py-3">
                        {cert.status === 'ACTIVE' ? (
                          <input
                            type="text"
                            className="pki-input !py-1 !text-xs"
                            placeholder="Raison (optionnel)"
                            value={reasons[cert.id] || ''}
                            onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                          />
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">{cert.revocationReason || 'N/A'}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {cert.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevoke(cert.id)}
                            className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
                          >
                            Révoquer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
            {certificates.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun certificat trouvé.
              </div>
            ) : (
              certificates.map((cert) => (
                <div key={cert.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {cert.subjectDN?.split(',')[0]?.replace('CN=', '') || cert.id}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{cert.userEmail || cert.userId}</div>
                    </div>
                    <span className={statusBadgeClass(cert.status)}>{cert.status}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Série : {cert.serialNumber}</div>
                  {cert.status === 'ACTIVE' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        className="pki-input !text-xs"
                        placeholder="Raison de révocation (optionnel)"
                        value={reasons[cert.id] || ''}
                        onChange={(e) => setReasons((prev) => ({ ...prev, [cert.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleRevoke(cert.id)}
                        className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors w-full"
                      >
                        Révoquer
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Révocation : {cert.revocationReason || 'N/A'}
                    </div>
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
