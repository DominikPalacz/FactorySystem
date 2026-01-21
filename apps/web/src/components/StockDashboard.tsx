import { useEffect, useState } from 'react';
import { apiClient, Location, Item, StockEntry } from '../lib/apiClient';

export const StockDashboard: React.FC<{
  onRefresh: () => void;
}> = ({ onRefresh }) => {
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [locations, setLocations] = useState<Map<string, string>>(new Map());
  const [items, setItems] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [onRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locData, itemData, stockData] = await Promise.all([
        apiClient.getLocations(),
        apiClient.getItems(),
        apiClient.getStock(),
      ]);

      const locMap = new Map(locData.map((l: Location) => [l.id, l.name]));
      const itemMap = new Map(itemData.map((i: Item) => [i.id, i.sku]));

      setLocations(locMap);
      setItems(itemMap);

      const enrichedStock: StockEntry[] = stockData
        .map((entry: any) => ({
          ...entry,
          locationName: locMap.get(entry.locationId) || 'N/A',
          itemSku: itemMap.get(entry.itemId) || 'N/A',
        }))
        .sort((a, b) => a.locationName.localeCompare(b.locationName));

      setStock(enrichedStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-heading-xl font-bold text-rugged-accent">
        📦 Stan Magazynu
      </h2>

      {error && (
        <div className="card bg-rugged-danger border-rugged-danger">
          <p className="text-rugged-light font-bold">❌ Błąd: {error}</p>
        </div>
      )}

      {loading && (
        <div className="card">
          <p className="text-rugged-accent font-bold text-lg">⏳ Ładowanie...</p>
        </div>
      )}

      {!loading && stock.length === 0 && (
        <div className="card">
          <p className="text-rugged-light">Brak danych na magazynie.</p>
        </div>
      )}

      {!loading && stock.length > 0 && (
        <div className="overflow-x-auto border-2 border-rugged-light rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-rugged-accent text-rugged-dark">
                <th className="table-header">Lokacja</th>
                <th className="table-header">Artykuł (SKU)</th>
                <th className="table-header text-right">Ilość</th>
                <th className="table-header">Ostatnia Zmiana</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((entry) => (
                <tr key={`${entry.locationId}-${entry.itemId}`} className="border-b border-rugged-light hover:bg-rugged-gray transition-colors">
                  <td className="table-row font-bold">{entry.locationName}</td>
                  <td className="table-row">{entry.itemSku}</td>
                  <td className="table-row text-right text-rugged-success font-bold text-lg">
                    {entry.quantity}
                  </td>
                  <td className="table-row text-sm">
                    {new Date(entry.lastUpdated).toLocaleString('pl-PL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        onClick={fetchData}
        disabled={loading}
        className="btn-secondary"
      >
        🔄 Odśwież
      </button>
    </div>
  );
};
