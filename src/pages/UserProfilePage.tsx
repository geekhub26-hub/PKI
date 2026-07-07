import { useState } from 'react';
import { User, Mail, Calendar, Clock, Shield, Eye, EyeOff, CheckCircle2, Edit3, KeyRound, Save, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userService, readApiError } from '../services/api';
import Button from '../components/Button';

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin',    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  ADMIN:       { label: 'Administrateur', color: '#DC2626', bg: 'rgba(220,38,38,0.1)'  },
  AE_CENTRALE: { label: 'AE Centrale',   color: '#D97706', bg: 'rgba(217,119,6,0.1)'  },
  ADMIN_AEL:   { label: 'Admin AEL',     color: '#B45309', bg: 'rgba(180,83,9,0.1)'   },
  AEL:         { label: 'AEL',           color: '#047857', bg: 'rgba(4,120,87,0.1)'   },
  USER:        { label: 'Utilisateur',   color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)'  },
};

function getInitials(first?: string, last?: string) {
  return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '?';
}

function fmt(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function fmtFull(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UserProfilePage() {
  const { user, setUser } = useAuthStore();
  const meta = ROLE_META[user?.role ?? 'USER'] ?? ROLE_META.USER;

  // ── Edit profile state ────────────────────────────────────────
  const [editMode,    setEditMode]    = useState(false);
  const [firstName,   setFirstName]   = useState(user?.firstName ?? '');
  const [lastName,    setLastName]    = useState(user?.lastName  ?? '');
  const [profileMsg,  setProfileMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setProfileMsg({ ok: false, text: 'Prénom et nom sont requis.' });
      return;
    }
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      const updated = await userService.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() });
      setUser(updated);
      setEditMode(false);
      setProfileMsg({ ok: true, text: 'Profil mis à jour avec succès.' });
    } catch (e) {
      setProfileMsg({ ok: false, text: readApiError(e, 'Erreur lors de la mise à jour.') });
    } finally {
      setProfileBusy(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(user?.firstName ?? '');
    setLastName(user?.lastName ?? '');
    setEditMode(false);
    setProfileMsg(null);
  };

  // ── Change password state ─────────────────────────────────────
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdMsg,      setPwdMsg]      = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdBusy,     setPwdBusy]     = useState(false);

  const pwdStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };
  const strength = pwdStrength(newPwd);
  const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength] ?? '';
  const strengthColor = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#059669'][strength] ?? '#EF4444';

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg({ ok: false, text: 'Tous les champs sont requis.' });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ ok: false, text: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    setPwdBusy(true);
    try {
      await userService.changePassword({ currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setShowCurrent(false); setShowNew(false); setShowConfirm(false);
      setPwdMsg({ ok: true, text: 'Mot de passe modifié avec succès.' });
    } catch (e) {
      setPwdMsg({ ok: false, text: readApiError(e, 'Erreur lors du changement de mot de passe.') });
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="page-header-bar flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mon profil</h1>
          <p className="text-sm text-emerald-100/80">Gérez vos informations personnelles et votre sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left: identity summary ─────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Avatar card */}
          <div className="pki-card rounded-2xl p-6 text-center">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, #065f46, #022c22)' }}
            >
              {getInitials(user?.firstName, user?.lastName)}
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>

          {/* Account info */}
          <div className="pki-card rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Informations compte
            </h3>

            <div className="flex items-start gap-3 text-sm">
              <Mail size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Email</div>
                <div className="font-medium text-slate-800 dark:text-white break-all">{user?.email}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Email vérifié</div>
                <div className="font-medium">
                  {user?.emailVerified
                    ? <span className="text-emerald-600 dark:text-emerald-400">Vérifié</span>
                    : <span className="text-amber-500">Non vérifié</span>}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Calendar size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Membre depuis</div>
                <div className="font-medium text-slate-800 dark:text-white">{fmt(user?.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Clock size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Dernière connexion</div>
                <div className="font-medium text-slate-800 dark:text-white">{fmtFull(user?.lastLogin)}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Shield size={15} className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wide">Statut compte</div>
                <div className="font-medium">
                  {user?.isActive
                    ? <span className="text-emerald-600 dark:text-emerald-400">Actif</span>
                    : <span className="text-red-500">Inactif</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: forms ──────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Edit profile card */}
          <div className="pki-card rounded-2xl p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Edit3 size={15} className="text-emerald-700 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Informations personnelles</h3>
              </div>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} icon={<Edit3 size={14} />}>
                  Modifier
                </Button>
              )}
            </div>

            {profileMsg && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                profileMsg.ok
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-300'
                  : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <div className="space-y-4">
              {/* Email — always read-only */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Adresse email
                </label>
                <div className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-70">
                  <Mail size={15} className="flex-shrink-0 text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-300 text-sm">{user?.email}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">L'adresse email ne peut pas être modifiée.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!editMode}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 w-full disabled:bg-slate-50 disabled:opacity-70 dark:disabled:bg-slate-800/50"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!editMode}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 w-full disabled:bg-slate-50 disabled:opacity-70 dark:disabled:bg-slate-800/50"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              {editMode && (
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    loading={profileBusy}
                    icon={<Save size={15} />}
                  >
                    Enregistrer
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit} icon={<X size={15} />}>
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Change password card */}
          <div className="pki-card rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <KeyRound size={15} className="text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Changer le mot de passe</h3>
            </div>

            {pwdMsg && (
              <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                pwdMsg.ok
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-300'
                  : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300'
              }`}>
                {pwdMsg.text}
              </div>
            )}

            <div className="space-y-4">
              {/* Current password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mot de passe actuel
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 w-full pr-10"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 w-full pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPwd.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColor : '#E2E8F0' }}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: strengthColor }}>{strengthLabel}</p>
                  </div>
                )}
                <p className="mt-1.5 text-xs text-slate-400">Au moins 8 caractères. Combinez majuscules, chiffres et symboles.</p>
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirmer le nouveau mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 w-full pr-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPwd.length > 0 && newPwd !== confirmPwd && (
                  <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                )}
                {confirmPwd.length > 0 && newPwd === confirmPwd && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">Les mots de passe correspondent.</p>
                )}
              </div>

              <div className="pt-1">
                <Button
                  variant="primary"
                  onClick={handleChangePassword}
                  loading={pwdBusy}
                  icon={<KeyRound size={15} />}
                >
                  Changer le mot de passe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
