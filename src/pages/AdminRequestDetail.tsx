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
      addToast({ type: 'success', message: 'Verification admin approuvee. Utilisateur autorise a soumettre le CSR.' });
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
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
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

  if (loading) return <div className="dark:text-neutral-300">Chargement...</div>;
  if (error) return <div className="text-red-600 dark:text-red-300">{error}</div>;
  if (!request) return <div className="dark:text-neutral-300">Aucune demande trouvee</div>;

  const statusTone =
    request.status === 'ISSUED'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
      : request.status === 'NEEDS_CORRECTION' || request.status === 'REJECTED'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
      : request.status === 'CSR_SUBMITTED'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
      : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200';

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-h3 font-semibold text-[var(--text-1)]">Demande {request.id}</h1>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}>{request.status}</span>
          </div>
          <button className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" onClick={() => navigate('/admin/requests')}>
            Retour
          </button>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Informations utilisateur</h2>
          <div className="grid gap-3 text-sm text-neutral-700 dark:text-neutral-300 md:grid-cols-2">
            <Info label="Utilisateur" value={request.userFullName || request.userEmail || request.userId} />
            <Info label="Email" value={request.userEmail} />
            <Info label="Prenom" value={request.firstName || '-'} />
            <Info label="Nom" value={request.lastName || '-'} />
            <Info label="Date de naissance" value={request.birthDate || '-'} />
            <Info label="Lieu de naissance" value={request.birthPlace || '-'} />
            <Info label="Nationalite" value={request.nationality || '-'} />
            <Info label="Type de piece" value={request.identityDocumentType || '-'} />
            <Info label="Numero de piece" value={request.identityDocumentNumber || '-'} />
            <Info label="Expiration piece" value={request.identityDocumentExpiry || '-'} />
            <Info label="Soumis" value={request.submittedAt || '-'} />
            <Info label="Statut" value={request.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Sujet / CSR</h2>
          {request.csrContent ? (
            <>
              <div className="grid gap-3 text-sm text-neutral-700 dark:text-neutral-300 md:grid-cols-2">
                <Info label="CN" value={request.commonName} />
                <Info label="O" value={request.organization} />
                <Info label="OU" value={request.organizationalUnit || '-'} />
                <Info label="L (Ville)" value={request.locality || '-'} />
                <Info label="ST (Region)" value={request.state || '-'} />
                <Info label="C (Pays)" value={request.country || '-'} />
                <Info label="Email CSR" value={request.email || '-'} />
              </div>
              <div className="mt-4 text-xs font-semibold text-neutral-600 dark:text-neutral-300">CSR</div>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs dark:bg-neutral-800 dark:text-neutral-300">{request.csrContent}</pre>
            </>
          ) : (
            <div className="rounded border border-dashed border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              Etape CSR non soumise par l utilisateur. Seules les informations du premier formulaire sont disponibles pour l instant.
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Pieces jointes</h2>
        {request.documents && request.documents.length > 0 ? (
          <ul className="space-y-2">
            {request.documents.map((d: string) => (
              <li key={d} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950/40">
                <span className="truncate text-sm text-neutral-700 dark:text-neutral-300">{d}</span>
                <button
                  className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/50"
                  onClick={() => handleDownload(d)}
                >
                  Visualiser
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-300">
            Aucune piece jointe
          </div>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Actions administrateur</h2>
        <div className="flex flex-wrap items-start gap-6">
          {(request.status === 'PENDING_REVIEW' || request.status === 'PENDING') && (
            <>
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowApproveModal(true)}>
                Verification OK (ouvrir etape CSR)
              </button>
              <div className="min-w-[260px] space-y-2">
                <label className="block text-sm text-neutral-600 dark:text-neutral-300">Motif de correction</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-20 w-full rounded-lg border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <div className="mt-2">
                  <button className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowRejectModal(true)}>
                    Demander correction
                  </button>
                </div>
              </div>
            </>
          )}

          {(request.status === 'CSR_SUBMITTED' || request.status === 'REVIEW_APPROVED') && (
            <>
              <div className="space-y-2">
                <label className="block text-sm text-neutral-600 dark:text-neutral-300">Validite (jours)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <button className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowApproveModal(true)}>
                Approuver & Signer
              </button>
              <div className="min-w-[260px] space-y-2">
                <label className="block text-sm text-neutral-600 dark:text-neutral-300">Raison du rejet final</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-20 w-full rounded-lg border border-neutral-300 p-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <div className="mt-2">
                  <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => setShowRejectModal(true)}>
                    Rejeter
                  </button>
                </div>
              </div>
            </>
          )}

          {(request.status === 'REVIEW_APPROVED' || request.status === 'ISSUED') && (
            <button
              disabled={busy}
              onClick={handleGenererRecepisse}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {busy ? 'Génération...' : 'Générer récépissé'}
            </button>
          )}

          {!(request.status === 'PENDING_REVIEW' || request.status === 'PENDING' || request.status === 'CSR_SUBMITTED' || request.status === 'REVIEW_APPROVED' || request.status === 'ISSUED') && (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-300">
              Aucune action disponible pour le statut actuel.
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showApproveModal}
        title={request.status === 'PENDING_REVIEW' || request.status === 'PENDING' ? "Confirmer la verification" : "Confirmer l'approbation"}
        onClose={() => setShowApproveModal(false)}
        footer={
          <>
            <Button onClick={() => setShowApproveModal(false)} variant="secondary">
              Annuler
            </Button>
            <Button
              onClick={request.status === 'PENDING_REVIEW' || request.status === 'PENDING' ? confirmReviewApprove : confirmApprove}
              disabled={busy}
              className="ml-2"
            >
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        {(request.status === 'PENDING_REVIEW' || request.status === 'PENDING') ? (
          <div>Valider la verification et ouvrir l'etape CSR pour <strong>{request.id}</strong> ?</div>
        ) : (
          <div>Etes-vous sur de vouloir approuver et signer la CSR pour la demande <strong>{request.id}</strong> ?</div>
        )}
        {errorMsg && <div className="mt-2 text-red-600 dark:text-red-300">{errorMsg}</div>}
      </Modal>

      <Modal
        open={showRejectModal}
        title={request.status === 'PENDING_REVIEW' || request.status === 'PENDING' ? 'Demander une correction' : 'Confirmer le rejet'}
        onClose={() => setShowRejectModal(false)}
        footer={
          <>
            <Button onClick={() => setShowRejectModal(false)} variant="secondary">
              Annuler
            </Button>
            <Button
              onClick={request.status === 'PENDING_REVIEW' || request.status === 'PENDING' ? confirmReviewReject : confirmReject}
              disabled={busy}
              className="ml-2"
            >
              {busy ? 'Traitement...' : 'Confirmer'}
            </Button>
          </>
        }
      >
        <div className="mb-2">
          {request.status === 'PENDING_REVIEW' || request.status === 'PENDING'
            ? <>La demande <strong>{request.id}</strong> sera renvoyee a l'utilisateur pour correction.</>
            : <>Veuillez confirmer le rejet de la demande <strong>{request.id}</strong>.</>}
        </div>
        <label className="block text-sm dark:text-neutral-300">
          {request.status === 'PENDING_REVIEW' || request.status === 'PENDING' ? 'Motif de correction' : 'Raison du rejet'}
        </label>
        <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="h-24 w-full rounded border border-neutral-300 p-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100" />
        {errorMsg && <div className="mt-2 text-red-600 dark:text-red-300">{errorMsg}</div>}
      </Modal>

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
                Telecharger
              </Button>
              <Button onClick={() => setShowPemModal(false)} className="ml-2">
                Fermer
              </Button>
            </>
          }
        >
          <pre className="max-h-96 overflow-auto rounded-xl bg-neutral-50 p-3 text-xs dark:bg-neutral-800 dark:text-neutral-300">{pemText}</pre>
        </Modal>
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

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="font-medium text-neutral-800 dark:text-neutral-200">{value || '-'}</div>
    </div>
  );
}
