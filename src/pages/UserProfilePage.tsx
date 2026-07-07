import { useRef, useState } from 'react';
import {
  User, Mail, Calendar, Clock, Shield, Eye, EyeOff,
  CheckCircle2, Edit3, KeyRound, Save, X, Camera, Trash2,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userService, readApiError } from '../services/api';
import Button from '../components/Button';
import { PRESET_AVATARS, resolveAvatarSrc } from '../utils/avatar';

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin',    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
  ADMIN:       { label: 'Administrateur', color: '#DC2626', bg: 'rgba(220,38,38,0.1)'  },
  AE_CENTRALE: { label: 'AE Centrale',   color: '#D97706', bg: 'rgba(217,119,6,0.1)'  },
  ADMIN_AEL:   { label: 'Admin AEL',     color: '#B45309', bg: 'rgba(180,83,9,0.1)'   },
  AEL:         { label: 'AEL',           color: '#047857', bg: 'rgba(4,120,87,0.1)'   },
  USER:        { label: 'Utilisateur',   color: '#1D4ED8', bg: 'rgba(29,78,216,0.1)'  },
};

function getInitials(f?: string, l?: string) {
  return ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase() || '?';
}
function fmt(d?: string) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
}
function fmtFull(d?: string) {
  return d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
const DEFAULT_BG = 'linear-gradient(135deg,#065f46,#022c22)';

function AvatarCircle({ avatarUrl, firstName, lastName, size = 80 }: {
  avatarUrl?: string; firstName?: string; lastName?: string; size?: number;
}) {
  const style = { width: size, height: size, fontSize: size * 0.28 };
  const base  = 'flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-bold text-white shadow-lg';
  const src   = resolveAvatarSrc(avatarUrl);
  if (src) {
    return <div className={base} style={style}><img src={src} alt="avatar" className="w-full h-full object-cover object-top" /></div>;
  }
  return <div className={base} style={{ ...style, background: DEFAULT_BG }}>{getInitials(firstName, lastName)}</div>;
}

const INPUT = 'h-10 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30';

export default function UserProfilePage() {
  const { user, setUser } = useAuthStore();
  const meta = ROLE_META[user?.role ?? 'USER'] ?? ROLE_META.USER;
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Avatar ─────────────────────────────────────────────────────────────── */
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarMsg,  setAvatarMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarMsg({ ok: false, text: 'Image trop grande (max 2 Mo).' }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 300;
        const scale   = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas  = document.createElement('canvas');
        canvas.width  = img.width  * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        await saveAvatar(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveAvatar = async (url: string | null) => {
    setAvatarBusy(true); setAvatarMsg(null);
    try {
      setUser(await userService.updateAvatar(url));
      setShowPicker(false);
      setAvatarMsg({ ok: true, text: 'Avatar mis à jour.' });
    } catch (err) {
      setAvatarMsg({ ok: false, text: readApiError(err, 'Erreur.') });
    } finally { setAvatarBusy(false); }
  };

  /* ── Profile ────────────────────────────────────────────────────────────── */
  const [editMode,    setEditMode]    = useState(false);
  const [firstName,   setFirstName]   = useState(user?.firstName ?? '');
  const [lastName,    setLastName]    = useState(user?.lastName  ?? '');
  const [profileMsg,  setProfileMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) { setProfileMsg({ ok: false, text: 'Prénom et nom requis.' }); return; }
    setProfileBusy(true); setProfileMsg(null);
    try {
      setUser(await userService.updateProfile({ firstName: firstName.trim(), lastName: lastName.trim() }));
      setEditMode(false);
      setProfileMsg({ ok: true, text: 'Profil mis à jour.' });
    } catch (e) {
      setProfileMsg({ ok: false, text: readApiError(e, 'Erreur.') });
    } finally { setProfileBusy(false); }
  };

  /* ── Password ───────────────────────────────────────────────────────────── */
  const [currentPwd,  setCurrentPwd]  = useState('');
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showC, setShowC] = useState(false);
  const [showN, setShowN] = useState(false);
  const [showX, setShowX] = useState(false);
  const [pwdMsg,  setPwdMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdBusy, setPwdBusy] = useState(false);

  const strength = [
    newPwd.length >= 8, newPwd.length >= 12,
    /[A-Z]/.test(newPwd), /[0-9]/.test(newPwd), /[^A-Za-z0-9]/.test(newPwd),
  ].filter(Boolean).length;
  const sLabel = ['','Très faible','Faible','Moyen','Fort','Très fort'][strength];
  const sColor = ['','#EF4444','#F97316','#EAB308','#22C55E','#059669'][strength];

  const handlePwd = async () => {
    setPwdMsg(null);
    if (!currentPwd || !newPwd || !confirmPwd) { setPwdMsg({ ok: false, text: 'Tous les champs requis.' }); return; }
    if (newPwd.length < 8)   { setPwdMsg({ ok: false, text: 'Minimum 8 caractères.' }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ ok: false, text: 'Les mots de passe ne correspondent pas.' }); return; }
    setPwdBusy(true);
    try {
      await userService.changePassword({ currentPassword: currentPwd, newPassword: newPwd, confirmPassword: confirmPwd });
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setPwdMsg({ ok: true, text: 'Mot de passe modifié.' });
    } catch (e) {
      setPwdMsg({ ok: false, text: readApiError(e, 'Erreur.') });
    } finally { setPwdBusy(false); }
  };

  const alert = (msg: { ok: boolean; text: string } | null) => msg && (
    <div className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium border ${msg.ok
      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500/30 dark:text-emerald-300'
      : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-300'}`}>
      {msg.text}
    </div>
  );

  const PwdField = ({ label, val, set, show, toggle, ac }: {
    label: string; val: string; set: (v: string) => void;
    show: boolean; toggle: () => void; ac: string;
  }) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={val} onChange={(e) => set(e.target.value)}
          autoComplete={ac} placeholder="••••••••" className={`${INPUT} pr-10`} />
        <button type="button" onClick={toggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {ac === 'new-password' && label.includes('Nouveau') && newPwd.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= strength ? sColor : '#E2E8F0' }} />
            ))}
          </div>
          <p className="text-xs font-medium" style={{ color: sColor }}>{sLabel}</p>
        </div>
      )}
      {ac === 'new-password' && label.includes('Confirmer') && confirmPwd.length > 0 && (
        <p className={`mt-1 text-xs ${newPwd === confirmPwd ? 'text-emerald-600' : 'text-red-500'}`}>
          {newPwd === confirmPwd ? 'Correspond ✓' : 'Ne correspond pas'}
        </p>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="page-header-bar flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
          <User size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Mon profil</h1>
          <p className="text-sm text-emerald-100/80">Gérez vos informations et votre sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── LEFT ────────────────────────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-1">

          {/* Avatar card */}
          <div className="pki-card p-6 text-center">
            {/* Circle with camera button */}
            <div className="relative mx-auto mb-4 w-fit">
              <AvatarCircle avatarUrl={user?.avatarUrl} firstName={user?.firstName} lastName={user?.lastName} size={88} />
              <button onClick={() => fileRef.current?.click()} disabled={avatarBusy}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-white shadow-md hover:bg-emerald-600 disabled:opacity-50 transition"
                title="Importer une photo">
                <Camera size={13} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>

            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{user?.firstName} {user?.lastName}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>

            {avatarMsg && (
              <p className={`mt-3 text-xs ${avatarMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{avatarMsg.text}</p>
            )}

            {/* Picker toggle */}
            <button onClick={() => setShowPicker((v) => !v)}
              className="mt-4 w-full rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              {showPicker ? '▲ Masquer les avatars' : '▼ Choisir un avatar'}
            </button>

            {showPicker && (
              <div className="mt-4">
                <p className="mb-3 text-[11px] text-slate-400">Sélectionnez un style ou importez une photo</p>
                <div className="grid grid-cols-3 gap-3 justify-items-center">
                  {PRESET_AVATARS.map((a) => {
                    const sel = user?.avatarUrl === `avatar:${a.id}`;
                    const url = resolveAvatarSrc(`avatar:${a.id}`) ?? '';
                    return (
                      <button key={a.id} onClick={() => saveAvatar(`avatar:${a.id}`)} disabled={avatarBusy}
                        className={`relative h-14 w-14 rounded-full overflow-hidden transition-transform shadow-sm ${
                          sel ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105 hover:shadow-md'}`}
                        style={{ background: `#${a.bg}` }}>
                        <img src={url} alt={`avatar ${a.id}`} className="w-full h-full object-cover object-top" />
                      </button>
                    );
                  })}
                </div>
                {user?.avatarUrl && (
                  <button onClick={() => saveAvatar(null)} disabled={avatarBusy}
                    className="mt-3 flex items-center gap-1.5 mx-auto text-xs text-red-500 hover:text-red-700 transition">
                    <Trash2 size={12} /> Supprimer l'avatar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Account info */}
          <div className="pki-card p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Informations compte</h3>
            {[
              { icon: <Mail size={14} />,         label: 'Email',              val: user?.email },
              { icon: <CheckCircle2 size={14} />,  label: 'Email vérifié',     val: user?.emailVerified ? 'Vérifié ✓' : 'Non vérifié', color: user?.emailVerified ? '#059669' : '#F59E0B' },
              { icon: <Calendar size={14} />,      label: 'Membre depuis',      val: fmt(user?.createdAt) },
              { icon: <Clock size={14} />,         label: 'Dernière connexion', val: fmtFull(user?.lastLogin) },
              { icon: <Shield size={14} />,        label: 'Statut',             val: user?.isActive ? 'Actif' : 'Inactif', color: user?.isActive ? '#059669' : '#EF4444' },
            ].map(({ icon, label, val, color }) => (
              <div key={label} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400">{icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
                  <div className="truncate font-medium text-slate-800 dark:text-white" style={color ? { color } : {}}>{val ?? '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT ───────────────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Edit profile */}
          <div className="pki-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Edit3 size={15} className="text-emerald-700 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Informations personnelles</h3>
              </div>
              {!editMode && (
                <Button variant="outline" size="sm" onClick={() => setEditMode(true)} icon={<Edit3 size={14} />}>Modifier</Button>
              )}
            </div>

            {alert(profileMsg)}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Adresse email</label>
                <div className={`${INPUT} flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed`}>
                  <Mail size={14} className="flex-shrink-0 text-slate-400" />
                  <span>{user?.email}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">L'email ne peut pas être modifié.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Prénom</label>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    disabled={!editMode} placeholder="Prénom"
                    className={`${INPUT} disabled:bg-slate-50 disabled:opacity-60 dark:disabled:bg-slate-800/50`} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    disabled={!editMode} placeholder="Nom"
                    className={`${INPUT} disabled:bg-slate-50 disabled:opacity-60 dark:disabled:bg-slate-800/50`} />
                </div>
              </div>
              {editMode && (
                <div className="flex items-center gap-3 pt-1">
                  <Button variant="primary" onClick={handleSaveProfile} loading={profileBusy} icon={<Save size={15} />}>Enregistrer</Button>
                  <Button variant="secondary" onClick={() => { setEditMode(false); setFirstName(user?.firstName ?? ''); setLastName(user?.lastName ?? ''); }} icon={<X size={15} />}>Annuler</Button>
                </div>
              )}
            </div>
          </div>

          {/* Change password */}
          <div className="pki-card p-6">
            <div className="mb-5 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <KeyRound size={15} className="text-amber-700 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Changer le mot de passe</h3>
            </div>
            {alert(pwdMsg)}
            <div className="space-y-4">
              <PwdField label="Mot de passe actuel"           val={currentPwd} set={setCurrentPwd} show={showC} toggle={() => setShowC(v => !v)} ac="current-password" />
              <PwdField label="Nouveau mot de passe"          val={newPwd}     set={setNewPwd}     show={showN} toggle={() => setShowN(v => !v)} ac="new-password" />
              <PwdField label="Confirmer le nouveau mot passe"val={confirmPwd} set={setConfirmPwd} show={showX} toggle={() => setShowX(v => !v)} ac="new-password" />
              <div className="pt-1">
                <Button variant="primary" onClick={handlePwd} loading={pwdBusy} icon={<KeyRound size={15} />}>
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
