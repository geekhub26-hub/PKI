import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { adminService } from '../services/api';

export default function AdminRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState<number>(365);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPemModal, setShowPemModal] = useState(false);
  const [pemText, setPemText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const { addToast } = useToast();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminService.getCertificateRequest(id);
      setRequest(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDownload = async (filename: string) => {
    if (!id) return;
    try {
      const blob = await adminService.getRequestDocumentBlob(id, filename);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewType(blob.type || null);
      setPreviewName(filename);
    } catch (e: any) {
      addToast({ type: 'error', message: e?.message || 'Impossible de visualiser la piece jointe' });
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewName('');
  };

  const confirmApprove = async () => {
    if (!id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const resp = await adminService.approveRequest(id, validityDays);
      setPemText(resp?.certificate || null);
      setShowApproveModal(false);
      if (resp?.certificate) setShowPemModal(true);
      addToast({ type: 'success', message: 'Demande approuvee.' });
    } catch (e: any) {
      setErrorMsg(e?.message || "Impossible d'approuver");
      addToast({ type: 'error', message: e?.message || "Impossible d'approuver" });
    } finally {
      setBusy(false);
    }
  };

  const confirmReviewApprove = async () => {
    if (!id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await adminService.reviewApprove(id);
      addToast({
        type: 'success',
        message: 'Verification admin approuvee. Utilisateur autorise a soumettre le CSR.',
      });
      setShowApproveModal(false);
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "Impossible d'approuver la verification");
      addToast({ type: 'error', message: e?.message || "Impossible d'approuver la verification" });
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    if (!id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await adminService.rejectRequest(id, rejectReason);
      setShowRejectModal(false);
      addToast({ type: 'success', message: 'Demande rejetee.' });
      navigate('/admin/requests');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de rejeter');
      addToast({ type: 'error', message: e?.message || 'Impossible de rejeter' });
    } finally {
      setBusy(false);
    }
  };

  const confirmReviewReject = async () => {
    if (!id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      await adminService.reviewReject(id, rejectReason);
      setShowRejectModal(false);
      addToast({ type: 'success', message: 'Demande renvoyee en correction.' });
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de renvoyer en correction');
      addToast({ type: 'error', message: e?.message || 'Impossible de renvoyer en correction' });
    } finally {
      setBusy(false);
    }
  };

  const handleGenererRecepisse = async () => {
    if (!id) return;
    setBusy(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(
        `${(import.meta as any).env.VITE_API_URL || 'http://localhost:8080/api'}/admin/recepisses/generer/${id}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur');
      addToast({ type: 'success', message: `Récépissé ${data.numero} généré avec succès.` });
      await load();
    } catch (e: any) {
      addToast({ type: 'error', message: e?.message || 'Impossible de générer le récépissé.' });
    } finally {
      setBusy(false);
    }
  };

  const copyPemToClipboard = async () => {
    if (!pemText) return;
    await navigator.clipboard.writeText(pemText);
  };

  const downloadPem = (filename = `certificate-${request?.id || 'cert'}.pem`) => {
    if (!pemText) return;
    const blob = new Blob([pemText], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="mx-auto max-w-6xl py-10 text-sm text-slate-500 dark:text-slate-400">Chargement...</div>
    );
  if (error)
    return (
      <div className="mx-auto max-w-6xl py-10 text-sm text-rose-600 dark:text-rose-300">{error}</div>
    );
  if (!request)
    return (
      <div className="mx-auto max-w-6xl py-10 text-sm text-slate-500 dark:text-slate-400">
        Aucune demande trouvée
      </div>
    );

  const statusClass =
    request.status === 'ISSUED'
      ? 'status-badge status-active'
      : request.status === 'REJECTED'
      ? 'status-badge status-revoked'
      : request.status === 'NEEDS_CORRECTION'
      ? 'status-badge status-rejected'
      : 'status-badge status-pending';

  const isPendingReview = request.status === 'PENDING_REVIEW' || request.status === 'PENDING';
  const isCsrStage = request.status === 'CSR_SUBMITTED' || request.status === 'REVIEW_APPROVED';
  const hasActions =
    isPendingReview || isCsrStage || request.status === 'REVIEW_APPROVED' || request.status === 'ISSUED';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Page header */}
      <div className="page-header-bar flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Détail demande #{id?.slice(0, 8)}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <span className={statusClass}>{request.status}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/admin/requests')}
          className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 backdrop-blur-sm"
        >
          ← Retour
        </button>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — 2 cols wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations de la demande */}
          <div className="pki-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              Informations de la demande
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <Info label="Utilisateur" value={request.userFullName || request.userEmail || request.userId} />
              <Info label="Email" value={request.userEmail} />
              <Info label="Prénom" value={request.firstName || '-'} />
              <Info label="Nom" value={request.lastName || '-'} />
              <Info label="Date de naissance" value={request.birthDate || '-'} />
              <Info label="Lieu de naissance" value={request.birthPlace || '-'} />
              <Info label="Nationalité" value={request.nationality || '-'} />
              <Info label="Type de pièce" value={request.identityDocumentType || '-'} />
              <Info label="Numéro de pièce" value={request.identityDocumentNumber || '-'} />
              <Info label="Expiration pièce" value={request.identityDocumentExpiry || '-'} />
              <Info label="Soumis le" value={request.submittedAt || '-'} />
              <Info label="Statut" value={request.status} />
            </div>

            {/* CSR subject fields if available */}
            {request.csrContent && (
              <>
                <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-4">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                    Sujet du certificat
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                    <Info label="CN" value={request.commonName} />
                    <Info label="Organisation (O)" value={request.organization} />
                    <Info label="Unité (OU)" value={request.organizationalUnit || '-'} />
                    <Info label="Ville (L)" value={request.locality || '-'} />
                    <Info label="Région (ST)" value={request.state || '-'} />
                    <Info label="Pays (C)" value={request.country || '-'} />
                    <Info label="Email CSR" value={request.email || '-'} />
                  </div>
                </div>
              </>
            )}

            {!request.csrContent && (
              <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 p-4 text-sm text-slate-500 dark:text-slate-400">
                Étape CSR non soumise par l'utilisateur. Seules les informations du premier formulaire sont disponibles
                pour l'instant.
              </div>
            )}
          </div>

          {/* Documents joints */}
          <div className="pki-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">Documents joints</div>
            {request.documents && request.documents.length > 0 ? (
              <ul className="space-y-2">
                {request.documents.map((d: string) => (
                  <li
                    key={d}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2"
                  >
                    <span className="truncate text-sm text-slate-700 dark:text-slate-300">{d}</span>
                    <button
                      onClick={() => handleDownload(d)}
                      className="btn btn-primary py-1 px-3 text-xs ml-3 shrink-0"
                    >
                      Visualiser
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/50 p-4 text-sm text-slate-500 dark:text-slate-400">
                Aucune pièce jointe
              </div>
            )}
          </div>

          {/* CSR PEM content */}
          {request.csrContent && (
            <div className="pki-card p-6">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">CSR (PEM)</div>
              <pre className="max-h-64 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
                {request.csrContent}
              </pre>
            </div>
          )}
        </div>

        {/* Right — 1 col */}
        <div className="space-y-4">
          {/* Actions card */}
          <div className="pki-card p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              Actions administrateur
            </div>

            {!hasActions && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/50 p-4 text-sm text-slate-500 dark:text-slate-400">
                Aucune action disponible pour le statut actuel.
              </div>
            )}

            {isPendingReview && (
              <div className="space-y-3">
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="btn btn-green w-full"
                >
                  Vérification OK (ouvrir étape CSR)
                </button>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Motif de correction
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="pki-input h-20 w-full resize-none"
                    placeholder="Décrivez la correction demandée..."
                  />
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    Demander correction
                  </button>
                </div>
              </div>
            )}

            {isCsrStage && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Validité (jours)
                  </label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="pki-input w-full"
                  />
                </div>
                <button
                  onClick={() => setShowApproveModal(true)}
                  className="btn btn-green w-full"
                >
                  Approuver &amp; Signer
                </button>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                    Raison du rejet final
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="pki-input h-20 w-full resize-none"
                    placeholder="Raison du rejet..."
                  />
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="mt-2 w-full inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            )}

            {(request.status === 'REVIEW_APPROVED' || request.status === 'ISSUED') && (
              <div className="mt-3">
                <button
                  disabled={busy}
                  onClick={handleGenererRecepisse}
                  className="w-full inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {busy ? 'Génération...' : 'Générer récépissé'}
                </button>
              </div>
            )}
          </div>

          {/* Comments / notes card */}
          <div className="pki-card p-5">
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">Commentaires</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pki-input h-24 w-full resize-none"
              placeholder="Notes internes sur cette demande..."
            />
            <button
              className="btn btn-primary w-full mt-2"
              onClick={() => addToast({ type: 'success', message: 'Notes enregistrées.' })}
            >
              Enregistrer les notes
            </button>
          </div>
        </div>
      </div>

      {/* Approve modal */}
      <Modal
        open={showApproveModal}
        title={isPendingReview ? 'Confirmer la vérification' : "Confirmer l'approbation"}
        onClose={() => setShowApproveModal(false)}
        footer={
          <>
            <Button onClick={() => setShowApproveModal(false)} variant="secondary">
              Annuler
            </Button>
            <Button
              onClick={isPendingReview ? confirmReviewApprove : confirmApprove}
              disabled={busy}
              className="ml-2"
            >
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        {isPendingReview ? (
          <div>
            Valider la vérification et ouvrir l'étape CSR pour <strong>{request.id}</strong> ?
          </div>
        ) : (
          <div>
            Êtes-vous sûr de vouloir approuver et signer la CSR pour la demande <strong>{request.id}</strong> ?
          </div>
        )}
        {errorMsg && <div className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMsg}</div>}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={showRejectModal}
        title={isPendingReview ? 'Demander une correction' : 'Confirmer le rejet'}
        onClose={() => setShowRejectModal(false)}
        footer={
          <>
            <Button onClick={() => setShowRejectModal(false)} variant="secondary">
              Annuler
            </Button>
            <Button
              onClick={isPendingReview ? confirmReviewReject : confirmReject}
              disabled={busy}
              className="ml-2"
            >
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <div className="mb-3 text-sm text-slate-700 dark:text-slate-300">
          {isPendingReview ? (
            <>
              La demande <strong>{request.id}</strong> sera renvoyée à l'utilisateur pour correction.
            </>
          ) : (
            <>
              Veuillez confirmer le rejet de la demande <strong>{request.id}</strong>.
            </>
          )}
        </div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
          {isPendingReview ? 'Motif de correction' : 'Raison du rejet'}
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="pki-input h-24 w-full resize-none"
        />
        {errorMsg && <div className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMsg}</div>}
      </Modal>

      {/* PEM modal */}
      {request.status !== 'PENDING_REVIEW' && request.status !== 'PENDING' && (
        <Modal
          open={showPemModal}
          title="Certificat (PEM)"
          onClose={() => setShowPemModal(false)}
          footer={
            <>
              <Button onClick={copyPemToClipboard} variant="secondary">
                Copier
              </Button>
              <Button onClick={() => downloadPem()} className="ml-2">
                Télécharger
              </Button>
              <Button onClick={() => setShowPemModal(false)} className="ml-2">
                Fermer
              </Button>
            </>
          }
        >
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300 font-mono">
            {pemText}
          </pre>
        </Modal>
      )}

      {/* Document preview overlay */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{previewName}</div>
              <button
                onClick={closePreview}
                className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700"
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
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Aperçu non supporté pour ce type de fichier.
                  </p>
                  <a
                    href={previewUrl}
                    download={previewName}
                    className="btn btn-primary inline-block"
                  >
                    Télécharger le fichier
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

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{value || '-'}</div>
    </div>
  );
}
