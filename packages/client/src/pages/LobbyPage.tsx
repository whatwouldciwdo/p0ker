import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyTable, CreateTableOptions } from '@p0ker/shared';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socketClient';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const { lobbyTables, setLobbyTables } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<LobbyTable | null>(null);
  const [buyInAmount, setBuyInAmount] = useState<number>(200);

  // Create table form state
  const [tableName, setTableName] = useState('');
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [minBuyIn, setMinBuyIn] = useState(200);
  const [createError, setCreateError] = useState('');

  // Fetch tables and current user
  useEffect(() => {
    fetchTables();
    fetchMe();

    const socket = getSocket();
    socket.emit('lobby:list');

    socket.on('lobby:tables', (tables: LobbyTable[]) => {
      setLobbyTables(tables);
    });

    return () => {
      socket.off('lobby:tables');
    };
  }, []);

  const fetchMe = async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data) {
        setUser(res.data);
      }
    } catch {
      // not logged in
      clearUser();
      navigate('/login');
    }
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/lobby/tables');
      setLobbyTables(res.data || []);
    } catch (err) {
      console.error('Fetch tables failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    clearUser();
    navigate('/login');
  };

  const handleOpenBuyIn = (table: LobbyTable) => {
    setSelectedTable(table);
    setBuyInAmount(Math.max(table.minBuyIn, Math.min(table.minBuyIn * 2, user?.chips || 1000)));
    setShowBuyInModal(true);
  };

  const handleConfirmJoin = () => {
    if (!selectedTable) return;
    setShowBuyInModal(false);
    navigate(`/table/${selectedTable.tableId}?buyIn=${buyInAmount}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (bigBlind < 2 * smallBlind) {
      setCreateError('Big Blind harus minimal 2x Small Blind!');
      return;
    }
    if (minBuyIn < 10 * bigBlind) {
      setCreateError('Min Buy-In harus minimal 10x Big Blind!');
      return;
    }

    try {
      const opts: CreateTableOptions = {
        name: tableName.trim() || 'Custom Poker Table',
        smallBlind: Number(smallBlind),
        bigBlind: Number(bigBlind),
        maxPlayers: Number(maxPlayers),
        minBuyIn: Number(minBuyIn),
      };

      const res = await api.post('/api/lobby/tables', opts);
      const tableId = res.data.tableId;
      setShowCreateModal(false);

      // Refresh table list
      fetchTables();
      // Join newly created table
      navigate(`/table/${tableId}?buyIn=${minBuyIn}`);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Gagal membuat meja.');
    }
  };

  return (
    <div className="lobby-page">
      {/* Top Navbar */}
      <nav className="lobby-navbar">
        <div className="navbar-brand">
          <span className="brand-suit">♠</span>
          <h1>Texas Hold'em Web</h1>
        </div>

        <div className="navbar-user">
          <div className="user-chips-pill">
            <span className="chip-symbol">🪙</span>
            <span className="chip-value">${(user?.chips ?? 0).toLocaleString()}</span>
          </div>

          <div className="user-profile">
            <span className="user-avatar">{user?.username?.slice(0, 2).toUpperCase() || 'U'}</span>
            <span className="user-name">{user?.username}</span>
          </div>

          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="lobby-content">
        <div className="lobby-header-actions">
          <div>
            <h2>Daftar Meja Poker</h2>
            <p className="subtitle">Pilih meja yang tersedia atau buat meja dengan aturan Anda sendiri.</p>
          </div>

          <button
            className="btn btn-primary btn-create-table"
            onClick={() => setShowCreateModal(true)}
          >
            + Buat Meja Baru
          </button>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="lobby-loading">Memuat daftar meja...</div>
        ) : lobbyTables.length === 0 ? (
          <div className="lobby-empty">
            <p>Belum ada meja aktif saat ini.</p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Buat Meja Pertama
            </button>
          </div>
        ) : (
          <div className="tables-grid">
            {lobbyTables.map((table) => {
              const isFull = table.playerCount >= table.maxPlayers;
              return (
                <div key={table.tableId} className="table-card">
                  <div className="table-card-top">
                    <span className="table-name">{table.name}</span>
                    <span className={`status-pill ${table.phase === 'waiting' ? 'status-waiting' : 'status-live'}`}>
                      {table.phase === 'waiting' ? 'Menunggu' : 'Bermain'}
                    </span>
                  </div>

                  <div className="table-card-body">
                    <div className="stat-row">
                      <span className="stat-label">Stakes:</span>
                      <span className="stat-value">${table.smallBlind} / ${table.bigBlind}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Pemain:</span>
                      <span className="stat-value">{table.playerCount} / {table.maxPlayers}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Min Buy-In:</span>
                      <span className="stat-value">${table.minBuyIn.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="table-card-footer">
                    <button
                      className="btn btn-primary btn-join-table"
                      disabled={isFull}
                      onClick={() => handleOpenBuyIn(table)}
                    >
                      {isFull ? 'Penuh' : 'Bergabung'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Buat Meja Poker Baru</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              {createError && <div className="auth-error">{createError}</div>}

              <div className="form-group">
                <label>Nama Meja</label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Contoh: Meja Santai VIP"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Small Blind ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={smallBlind}
                    onChange={(e) => {
                      const sb = Number(e.target.value);
                      setSmallBlind(sb);
                      setBigBlind(sb * 2);
                      setMinBuyIn(sb * 20);
                    }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Big Blind ($)</label>
                  <input
                    type="number"
                    min={smallBlind * 2}
                    value={bigBlind}
                    onChange={(e) => {
                      const bb = Number(e.target.value);
                      setBigBlind(bb);
                      setMinBuyIn(bb * 10);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Maksimal Pemain</label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  >
                    <option value={2}>2 Pemain (Heads-up)</option>
                    <option value={6}>6 Pemain (6-Max)</option>
                    <option value={9}>9 Pemain (Full Ring)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Min. Buy-In ($)</label>
                  <input
                    type="number"
                    min={bigBlind * 10}
                    value={minBuyIn}
                    onChange={(e) => setMinBuyIn(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Buat Meja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buy-In Modal */}
      {showBuyInModal && selectedTable && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Beli Chip Meja (Buy-In)</h3>
              <button className="modal-close" onClick={() => setShowBuyInModal(false)}>✕</button>
            </div>

            <div className="modal-form">
              <p className="buyin-info">
                Meja: <strong>{selectedTable.name}</strong><br />
                Blinds: ${selectedTable.smallBlind} / ${selectedTable.bigBlind}
              </p>

              <div className="form-group">
                <label>Jumlah Chip yang Dibawa:</label>
                <div className="buyin-slider-container">
                  <input
                    type="range"
                    min={selectedTable.minBuyIn}
                    max={Math.min(selectedTable.minBuyIn * 5, user?.chips || 10000)}
                    step={selectedTable.bigBlind}
                    value={buyInAmount}
                    onChange={(e) => setBuyInAmount(Number(e.target.value))}
                  />
                  <div className="buyin-value">${buyInAmount.toLocaleString()}</div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBuyInModal(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmJoin}
                >
                  Duduk & Main
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
