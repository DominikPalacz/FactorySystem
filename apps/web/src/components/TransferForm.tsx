import { useState } from 'react';
import { apiClient, Location, Item } from '../lib/apiClient';

export const TransferForm: React.FC<{
  locations: Location[];
  items: Item[];
  onSuccess: () => void;
}> = ({ locations, items, onSuccess }) => {
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!fromLocationId || !toLocationId || !itemId || !quantity) {
      setMessage({ type: 'error', text: 'Uzupełnij wszystkie pola' });
      return;
    }

    if (fromLocationId === toLocationId) {
      setMessage({ type: 'error', text: 'Lokacja źródłowa i docelowa muszą być różne' });
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setMessage({ type: 'error', text: 'Ilość musi być dodatnia' });
      return;
    }

    try {
      setLoading(true);
      await apiClient.transfer({
        fromLocationId,
        toLocationId,
        itemId,
        quantity: qty,
        operatorId: operatorId || 'unknown',
      });

      setMessage({ type: 'success', text: '✅ Transfer zarejestrowany' });
      setFromLocationId('');
      setToLocationId('');
      setItemId('');
      setQuantity('');
      setOperatorId('');
      onSuccess();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Błąd zatwierdzenia',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card space-y-6">
      <h3 className="text-2xl font-bold text-rugged-accent">🔄 Przesunięcie Towaru</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">Lokacja Źródłowa</label>
          <select
            value={fromLocationId}
            onChange={(e) => setFromLocationId(e.target.value)}
            className="input-field"
            disabled={loading}
          >
            <option value="">-- Wybierz --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Lokacja Docelowa</label>
          <select
            value={toLocationId}
            onChange={(e) => setToLocationId(e.target.value)}
            className="input-field"
            disabled={loading}
          >
            <option value="">-- Wybierz --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Artykuł</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="input-field"
            disabled={loading}
          >
            <option value="">-- Wybierz --</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sku} - {item.description || 'N/A'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="input-label">Ilość (szt.)</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-field"
            disabled={loading}
            placeholder="0"
          />
        </div>

        <div>
          <label className="input-label">ID Operatora (opcja)</label>
          <input
            type="text"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            className="input-field"
            disabled={loading}
            placeholder="np. OP001"
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg font-bold text-lg ${
              message.type === 'success'
                ? 'bg-rugged-success text-rugged-dark'
                : 'bg-rugged-danger text-rugged-light'
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-success w-full"
        >
          {loading ? '⏳ Przetwarzanie...' : '✓ Zatwierdź Transfer'}
        </button>
      </form>
    </div>
  );
};
