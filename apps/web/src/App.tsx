import { useEffect, useState } from 'react';
import { apiClient, Location, Item } from './lib/apiClient';
import { StockDashboard } from './components/StockDashboard';
import { InboundForm } from './components/InboundForm';
import { TransferForm } from './components/TransferForm';

export default function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbound' | 'transfer'>('dashboard');

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locs, itms] = await Promise.all([
        apiClient.getLocations(),
        apiClient.getItems(),
      ]);
      setLocations(locs);
      setItems(itms);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metadata');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    // Trigger dashboard refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rugged-dark flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-heading-xl text-rugged-accent font-bold">
            Factory Nervous System
          </h1>
          <p className="text-rugged-light text-xl">⏳ Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-rugged-dark flex items-center justify-center p-6">
        <div className="card bg-rugged-danger max-w-lg space-y-4">
          <h2 className="text-heading-xl text-rugged-light font-bold">❌ Błąd</h2>
          <p className="text-rugged-light text-lg">{error}</p>
          <button onClick={fetchMetadata} className="btn-secondary w-full">
            🔄 Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rugged-dark">
      {/* Header */}
      <header className="bg-rugged-gray border-b-4 border-rugged-accent p-6">
        <h1 className="text-heading-xl text-rugged-accent font-bold">
          🏭 Factory Nervous System - Dashboard Operatora
        </h1>
        <p className="text-rugged-light text-lg mt-2">
          Zarządzaj stanem magazynu w realtime
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-rugged-gray border-b-2 border-rugged-light p-4 flex gap-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-8 py-3 font-bold text-lg rounded-lg transition-all ${
            activeTab === 'dashboard'
              ? 'bg-rugged-accent text-rugged-dark'
              : 'bg-rugged-light text-rugged-dark hover:bg-rugged-accent'
          }`}
        >
          📊 Stan Magazynu
        </button>
        <button
          onClick={() => setActiveTab('inbound')}
          className={`px-8 py-3 font-bold text-lg rounded-lg transition-all ${
            activeTab === 'inbound'
              ? 'bg-rugged-accent text-rugged-dark'
              : 'bg-rugged-light text-rugged-dark hover:bg-rugged-accent'
          }`}
        >
          📥 Przyjęcie
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-8 py-3 font-bold text-lg rounded-lg transition-all ${
            activeTab === 'transfer'
              ? 'bg-rugged-accent text-rugged-dark'
              : 'bg-rugged-light text-rugged-dark hover:bg-rugged-accent'
          }`}
        >
          🔄 Transfer
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <StockDashboard onRefresh={refreshTrigger} />
        )}

        {activeTab === 'inbound' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InboundForm
              locations={locations}
              items={items}
              onSuccess={handleFormSuccess}
            />
            <StockDashboard onRefresh={refreshTrigger} />
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TransferForm
              locations={locations}
              items={items}
              onSuccess={handleFormSuccess}
            />
            <StockDashboard onRefresh={refreshTrigger} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-rugged-gray border-t-2 border-rugged-light p-4 text-center text-rugged-light">
        <p className="text-sm">
          API: http://localhost:3000/api | UI: http://localhost:5173
        </p>
      </footer>
    </div>
  );
}
