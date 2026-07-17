import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { adminService } from '../services/api';
import {
  ArrowLeft, FileText, User, Calendar, Hash,
  Globe, Building2, MapPin, CreditCard, Clipboard, MessageSquare,
} from 'lucide-react';

export default function AdminRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest]     = useState<any | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState<number>(365);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [showPemModal, setShowPemModal]         = useState(false);
  const [pemText, setPemText]     = useState<string | null>(null);
  const [busy, setBusy]           = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [notes, setNotes]         = useState<string>('');
  const [confirmingPayment, setConfirmingPayment] = useState(false);
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

  useEffect(() => { load(); }, [id]);

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
      addToast({ type: 'error', message: e?.message || 'Impossible de visualiser la pièce jointe' });
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
    setBusy(true); setErrorMsg(null);
    try {
      const resp = await adminService.approveRequest(id, validityDays);
      setPemText(resp?.certificate || null);
      setShowApproveModal(false);
      if (resp?.certificate) setShowPemModal(true);
      addToast({ type: 'success', message: 'Demande approuvée.' });
    } catch (e: any) {
      setErrorMsg(e?.message || "Impossible d'approuver");
      addToast({ type: 'error', message: e?.message || "Impossible d'approuver" });
    } finally { setBusy(false); }
  };

  const confirmReviewApprove = async () => {
    if (!id) return;
    setBusy(true); setErrorMsg(null);
    try {
      await adminService.reviewApprove(id);
      addToast({ type: 'success', message: 'Vérification admin approuvée.' });
      setShowApproveModal(false);
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || "Impossible d'approuver");
      addToast({ type: 'error', message: e?.message || "Impossible d'approuver" });
    } finally { setBusy(false); }
  };

  const confirmReject = async () => {
    if (!id) return;
    setBusy(true); setErrorMsg(null);
    try {
      await adminService.rejectRequest(id, rejectReason);
      setShowRejectModal(false);
      addToast({ type: 'success', message: 'Demande rejetée.' });
      navigate('/admin/requests');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de rejeter');
      addToast({ type: 'error', message: e?.message || 'Impossible de rejeter' });
    } finally { setBusy(false); }
  };

  const confirmReviewReject = async () => {
    if (!id) return;
    setBusy(true); setErrorMsg(null);
    try {
      await adminService.reviewReject(id, rejectReason);
      setShowRejectModal(false);
      addToast({ type: 'success', message: 'Renvoyée en correction.' });
      await load();
    } catch (e: any) {
      setErrorMsg(e?.message || 'Impossible de renvoyer');
      addToast({ type: 'error', message: e?.message || 'Impossible de renvoyer' });
    } finally { setBusy(false); }
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
    } finally { setBusy(false); }
  };

  const handleConfirmPayment = async () => {
    if (!id) return;
    setConfirmingPayment(true);
    try {
      await adminService.confirmPayment(id);
      addToast({ type: 'success', message: 'Paiement confirmé manuellement.' });
      await load();
    } catch (e: any) {
      addToast({ type: 'error', message: e?.response?.data?.error || 'Impossible de confirmer le paiement.' });
    } finally { setConfirmingPayment(false); }
  };

  const copyPemToClipboard = async () => { if (pemText) await navigator.clipboard.writeText(pemText); };

  const downloadPem = (filename = `certificate-${request?.id || 'cert'}.pem`) => {
    if (!pemText) return;
    const blob = new Blob([pemText], { type: 'application/x-pem-file' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
    </div>
  );
  if (error) return <div className="mx-auto max-w-6xl py-10 text-sm text-rose-600 dark:text-rose-300">{error}</div>;
  if (!request) return <div className="mx-auto max-w-6xl py-10 text-sm text-slate-400">Aucune demande trouvée.</div>;

  const statusClass = request.status === 'ISSUED' ? 'status-badge status-active'
    : request.status === 'REJECTED' ? 'status-badge status-revoked'
    : request.status === 'NEEDS_CORRECTION' ? 'status-badge status-rejected'
    : 'status-badge status-pending';

  const isPendingReview  = request.status === 'PENDING_REVIEW' || request.status === 'PENDING';
  const isCsrStage       = request.status === 'CSR_SUBMITTED' || request.status === 'REVIEW_APPROVED';
  const isAwaitingPayment = request.status === 'AWAITING_PAYMENT';
  const hasActions       = isPendingReview || isCsrStage || isAwaitingPayment || request.status === 'ISSUED';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      {/* Header */}
      <div className="page-header-bar">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-white/50">Administration PKI</p>
            <h1 className="text-2xl font-bold text-white">Détail demande #{id?.slice(0, 8)}</h1>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={statusClass}>{request.status}</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/requests')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {/* Identité demandeur */}
          <div className="pki-card p-6">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <User size={15} className="text-blue-500" />
                <span>Informations de la demande</span>
              </div>
            </div>
            <div className="info-row">
              <span className="info-row-label"><User size={12} /> Utilisateur</span>
              <span className="info-row-value">{request.userFullName || request.userEmail || request.userId}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Globe size={12} /> Email</span>
              <span className="info-row-value">{request.userEmail || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><User size={12} /> Prénom</span>
              <span className="info-row-value">{request.firstName || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><User size={12} /> Nom</span>
              <span className="info-row-value">{request.lastName || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Calendar size={12} /> Date de naissance</span>
              <span className="info-row-value">{request.birthDate || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><MapPin size={12} /> Lieu de naissance</span>
              <span className="info-row-value">{request.birthPlace || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Globe size={12} /> Nationalité</span>
              <span className="info-row-value">{request.nationality || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><CreditCard size={12} /> Type de pièce</span>
              <span className="info-row-value">{request.identityDocumentType || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Hash size={12} /> Numéro pièce</span>
              <span className="info-row-value">{request.identityDocumentNumber || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Calendar size={12} /> Expiration pièce</span>
              <span className="info-row-value">{request.identityDocumentExpiry || '—'}</span>
            </div>
            <div className="info-row">
              <span className="info-row-label"><Calendar size={12} /> Soumis le</span>
              <span className="info-row-value">{request.submittedAt || '—'}</span>
            </div>
          </div>

          {/* CSR Subject */}
          {request.csrContent ? (
            <div className="pki-card p-6">
              <div className="section-title">
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-emerald-500" />
                  <span>Sujet du certificat</span>
                </div>
              </div>
              <div className="info-row">
                <span className="info-row-label"><Hash size={12} /> CN</span>
                <span className="info-row-value">{request.commonName || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><Building2 size={12} /> Organisation (O)</span>
                <span className="info-row-value">{request.organization || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><Building2 size={12} /> Unité (OU)</span>
                <span className="info-row-value">{request.organizationalUnit || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><MapPin size={12} /> Ville (L)</span>
                <span className="info-row-value">{request.locality || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><MapPin size={12} /> Région (ST)</span>
                <span className="info-row-value">{request.state || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><Globe size={12} /> Pays (C)</span>
                <span className="info-row-value">{request.country || '—'}</span>
              </div>
              <div className="info-row">
                <span className="info-row-label"><Globe size={12} /> Email CSR</span>
                <span className="info-row-value">{request.email || '—'}</span>
              </div>
            </div>
          ) : (
            <div className="pki-card p-5">
              <div className="section-title">
                <div className="flex items-center gap-2">
                  <Building2 size={15} className="text-slate-400" />
                  <span>Sujet du certificat</span>
                </div>
              </div>
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                Étape CSR non encore soumise par l'utilisateur.
              </div>
            </div>
          )}

          {/* Documents */}
          <div className="pki-card p-6">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-amber-500" />
                <span>Documents joints</span>
              </div>
              {request.documents && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  {request.documents.length}
                </span>
              )}
            </div>
            {request.documents && request.documents.length > 0 ? (
              <div className="space-y-2">
                {request.documents.map((d: string) => (
                  <div key={d} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate text-sm text-slate-700 dark:text-slate-300">{d}</span>
                    </div>
                    <button
                      onClick={() => handleDownload(d)}
                      className="btn btn-primary ml-3 shrink-0"
                      style={{ padding: '5px 12px', fontSize: '12px' }}
                    >
                      Visualiser
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center text-sm text-slate-400">
                Aucune pièce jointe
              </div>
            )}
          </div>

          {/* CSR PEM */}
          {request.csrContent && (
            <div className="pki-card p-6">
              <div className="section-title">
                <div className="flex items-center gap-2">
                  <Clipboard size={15} className="text-slate-500" />
                  <span>CSR (PEM)</span>
                </div>
              </div>
              <pre className="max-h-64 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                {request.csrContent}
              </pre>
            </div>
          )}
        </div>

        {/* Right — 1/3 */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <Building2 size={15} className="text-blue-500" />
                <span>Actions admin</span>
              </div>
            </div>

            {!hasActions && (
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 text-center text-sm text-slate-400">
                Aucune action disponible.
              </div>
            )}

            {isAwaitingPayment && (
              <div className="space-y-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 px-3 py-2">
                  L'utilisateur a initié un paiement SharePay. Si le webhook n'est pas arrivé automatiquement, vous pouvez confirmer manuellement après vérification.
                </p>
                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmingPayment || busy}
                  className="btn btn-green w-full"
                >
                  {confirmingPayment ? 'Confirmation…' : 'Confirmer le paiement manuellement'}
                </button>
              </div>
            )}

            {isPendingReview && (
              <div className="space-y-3">
                <button onClick={() => setShowApproveModal(true)} className="btn btn-green w-full">
                  Vérification OK — ouvrir CSR
                </button>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Motif de correction
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="pki-input h-20 resize-none"
                    placeholder="Décrivez la correction demandée..."
                  />
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    Demander correction
                  </button>
                </div>
              </div>
            )}

            {isCsrStage && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Validité (jours)
                  </label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    className="pki-input"
                  />
                </div>
                <button onClick={() => setShowApproveModal(true)} className="btn btn-green w-full">
                  Approuver &amp; Signer
                </button>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Raison du rejet
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="pki-input h-20 resize-none"
                    placeholder="Raison du rejet..."
                  />
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="mt-2 w-full inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
                  >
                    Rejeter définitivement
                  </button>
                </div>
              </div>
            )}

            {(request.status === 'REVIEW_APPROVED' || request.status === 'ISSUED') && (
              <div className="mt-3">
                <button
                  disabled={busy}
                  onClick={handleGenererRecepisse}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText size={14} />
                  {busy ? 'Génération...' : 'Générer récépissé'}
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="pki-card p-5">
            <div className="section-title">
              <div className="flex items-center gap-2">
                <MessageSquare size={15} className="text-slate-500" />
                <span>Commentaires internes</span>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="pki-input h-24 resize-none"
              placeholder="Notes internes sur cette demande..."
            />
            <button
              className="btn btn-primary mt-2 w-full"
              onClick={() => addToast({ type: 'success', message: 'Notes enregistrées.' })}
            >
              Enregistrer les notes
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={showApproveModal}
        title={isPendingReview ? 'Confirmer la vérification' : "Confirmer l'approbation"}
        onClose={() => setShowApproveModal(false)}
        footer={
          <>
            <Button onClick={() => setShowApproveModal(false)} variant="secondary">Annuler</Button>
            <Button onClick={isPendingReview ? confirmReviewApprove : confirmApprove} disabled={busy} className="ml-2">
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isPendingReview
            ? `Valider la vérification et ouvrir l'étape CSR pour la demande ${id} ?`
            : `Approuver et signer la CSR pour la demande ${id} ?`}
        </p>
        {errorMsg && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMsg}</p>}
      </Modal>

      <Modal
        open={showRejectModal}
        title={isPendingReview ? 'Demander une correction' : 'Confirmer le rejet'}
        onClose={() => setShowRejectModal(false)}
        footer={
          <>
            <Button onClick={() => setShowRejectModal(false)} variant="secondary">Annuler</Button>
            <Button onClick={isPendingReview ? confirmReviewReject : confirmReject} disabled={busy} className="ml-2">
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
          {isPendingReview
            ? `La demande ${id} sera renvoyée à l'utilisateur pour correction.`
            : `Confirmer le rejet définitif de la demande ${id}.`}
        </p>
        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
          {isPendingReview ? 'Motif de correction' : 'Raison du rejet'}
        </label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="pki-input h-24 resize-none"
        />
        {errorMsg && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{errorMsg}</p>}
      </Modal>

      {request.status !== 'PENDING_REVIEW' && request.status !== 'PENDING' && (
        <Modal
          open={showPemModal}
          title="Certificat (PEM)"
          onClose={() => setShowPemModal(false)}
          footer={
            <>
              <Button onClick={copyPemToClipboard} variant="secondary">Copier</Button>
              <Button onClick={() => downloadPem()} className="ml-2">Télécharger</Button>
              <Button onClick={() => setShowPemModal(false)} className="ml-2">Fermer</Button>
            </>
          }
        >
          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-50 dark:bg-slate-800 p-3 font-mono text-xs text-slate-700 dark:text-slate-300">
            {pemText}
          </pre>
        </Modal>
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
                  <p className="text-sm text-slate-500">Aperçu non supporté pour ce type de fichier.</p>
                  <a href={previewUrl} download={previewName} className="btn btn-primary inline-block">
                    Télécharger
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
