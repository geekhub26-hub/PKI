import { useEffect, useState } from 'react';
import { CreditCard, Save, Loader2 } from 'lucide-react';
import { adminService, readApiError } from '../services/api';

export default function AdminSettingsPage() {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    adminService.getPaymentSettings()
      .then(d => setAmount(d.payment_amount))
      .catch(() => setAmount('5000'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = amount.trim();
    if (!v || isNaN(Number(v)) || Number(v) <= 0) {
      setMsg({ type: 'error', text: 'Veuillez saisir un montant valide (nombre positif).' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await adminService.updatePaymentSettings(v);
      setMsg({ type: 'success', text: 'Prix mis à jour avec succès.' });
    } catch (err) {
      setMsg({ type: 'error', text: readApiError(err) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-xl font-bold mb-1 flex items-center gap-2">
        <CreditCard size={20} className="text-emerald-500" />
        Prix du certificat numérique
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Montant en FCFA que l'utilisateur doit payer avant de soumettre sa demande de certificat.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          Chargement…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="amount">
              Montant (FCFA)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="amount"
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="input w-40"
                required
              />
              <span className="text-sm text-gray-500">FCFA</span>
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Enregistrer
          </button>
        </form>
      )}
    </div>
  );
}
