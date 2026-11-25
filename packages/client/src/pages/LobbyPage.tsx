import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LobbyTable, CreateTableOptions } from '@p0ker/shared';
import { api } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { getSocket, disconnectSocket } from '../socket/socketClient';
import {
  BotIcon,
  LogOutIcon,
  PokerChipIcon,
  SpadeEmblemIcon,
  TableMiniIcon,
  TrashIcon,
  UsersIcon,
} from '../components/icons/CasinoIcons';

export default function LobbyPage() {
  const navigate = useNavigate();
  const { user, setUser, clearUser } = useAuthStore();
  const { lobbyTables, setLobbyTables } = useGameStore();

  const [loading, setLoading] = useState(true);
  const [clearingAll, setClearingAll] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBuyInModal, setShowBuyInModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<LobbyTable | null>(null);
  const [buyInAmount, setBuyInAmount] = useState<number>(200);
  const [sideTab, setSideTab] = useState<'rooms' | 'info'>('rooms');

  // Create table form state
  const [tableName, setTableName] = useState('');
  const [smallBlind, setSmallBlind] = useState(10);
  const [bigBlind, setBigBlind] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [minBuyIn, setMinBuyIn] = useState(200);
  const [allowBots, setAllowBots] = useState(true);
  const [initialBots, setInitialBots] = useState(1);
  const [createError, setCreateError] = useState('');

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
    disconnectSocket();
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

  const handleDeleteTable = async (tableId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Yakin ingin menghapus meja ini?')) return;
    try {
      await api.delete(`/api/lobby/tables/${tableId}`);
      setLobbyTables(lobbyTables.filter((t) => t.tableId !== tableId));
      await fetchTables();
    } catch (err: any) {
      console.error('Delete table error', err);
      const msg = err?.response?.data?.error || 'Gagal menghapus meja.';
      window.alert(msg);
    }
  };

  const handleClearAllTables = async () => {
    if (clearingAll) return;
    if (!window.confirm('Hapus SEMUA meja yang ada di lobi?')) return;
    try {
      setClearingAll(true);
      await api.delete('/api/lobby/tables');
      setLobbyTables([]);
      await fetchTables();
    } catch (err: any) {
      console.error('Clear tables error', err);
      const msg = err?.response?.data?.error || 'Gagal menghapus semua meja.';
      window.alert(msg);
    } finally {
      setClearingAll(false);
    }
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
        allowBots,
        initialBots: allowBots ? Number(initialBots) : 0,
      };

      const res = await api.post('/api/lobby/tables', opts);
      const tableId = res.data.tableId;
      setShowCreateModal(false);
      fetchTables();
      navigate(`/table/${tableId}?buyIn=${minBuyIn}`);
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Gagal membuat meja.');
    }
  };

  const totalOnlinePlayers = lobbyTables.reduce((sum, t) => sum + t.playerCount, 0);

  return (
    <div className="fc-lobby-viewport">
      {/* Floating FigCraft Split Board (matches poker rooms+signup signin@2x.png) */}
      <div className="fc-lobby-board">
        {/* Left Main Panel: Poker Rooms Table */}
        <section className="fc-lobby-main">
          <header className="fc-lobby-header">
            <div className="fc-lobby-brand">
              <div className="fc-logo-ring">
                <SpadeEmblemIcon size={20} />
              </div>
              <h1>Poker Rooms</h1>
            </div>

            <div className="fc-lobby-top-controls">
              <div className="fc-balance-pill">
                <PokerChipIcon size={16} variant="blue" />
                <span className="fc-balance-amt">${(user?.chips ?? 0).toLocaleString()}</span>
                <span className="fc-balance-user">{user?.username}</span>
              </div>

              <button
                type="button"
                className="fc-soft-btn fc-soft-btn-cyan"
                onClick={() => setShowCreateModal(true)}
              >
                + Buat Meja
              </button>

              {lobbyTables.length > 0 && (
                <button
                  type="button"
                  className="fc-soft-btn fc-soft-btn-danger"
                  onClick={handleClearAllTables}
                  disabled={clearingAll}
                  title="Hapus semua meja"
                >
                  <TrashIcon size={14} />
                </button>
              )}

              <button
                type="button"
                className="fc-soft-btn"
                onClick={handleLogout}
                title="Keluar"
              >
                <LogOutIcon size={14} />
                <span className="hide-xs">Keluar</span>
              </button>
            </div>
          </header>

          {/* Table Columns Header */}
          <div className="fc-rooms-table-wrap">
            <div className="fc-rooms-thead">
              <span>ROOM / BLINDS</span>
              <span>BUY-IN</span>
              <span>TYPE</span>
              <span>MODE</span>
              <span>PLAYERS</span>
              <span className="align-right">ACTION</span>
            </div>

            {loading ? (
              <div className="fc-rooms-empty">Memuat daftar meja...</div>
            ) : lobbyTables.length === 0 ? (
              <div className="fc-rooms-empty">
                <p>Belum ada meja aktif saat ini.</p>
                <button
                  type="button"
                  className="fc-join-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Buat Meja Pertama
                </button>
              </div>
            ) : (
              <div className="fc-rooms-tbody">
                {lobbyTables.map((table) => {
                  const isFull = table.playerCount >= table.maxPlayers;
                  const typeLabel =
                    table.maxPlayers === 2
                      ? 'Heads-Up'
                      : table.maxPlayers <= 6
                      ? '6-Max'
                      : '9-Max';
                  const isPinkType = table.maxPlayers > 6;

                  return (
                    <div key={table.tableId} className="fc-room-row">
                      <div className="fc-col-blinds">
                        <span className="fc-room-row-name">{table.name}</span>
                        <span className="fc-room-row-stakes">
                          ${table.smallBlind} / ${table.bigBlind}
                        </span>
                      </div>

                      <div className="fc-col-buyin">${table.minBuyIn.toLocaleString()}</div>

                      <div className={`fc-col-type ${isPinkType ? 'is-pink' : 'is-cyan'}`}>
                        {typeLabel}
                      </div>

                      <div className="fc-col-mode">
                        {table.allowBots !== false ? (
                          <span className="fc-inline-meta">
                            <BotIcon size={14} />
                            <span>Bot AI</span>
                          </span>
                        ) : (
                          <span className="fc-inline-meta">
                            <UsersIcon size={14} />
                            <span>Manusia</span>
                          </span>
                        )}
                      </div>

                      <div className="fc-col-players">
                        <UsersIcon size={14} />
                        <span>
                          {table.playerCount} / {table.maxPlayers}
                        </span>
                      </div>

                      <div className="fc-col-action">
                        <button
                          type="button"
                          className="fc-join-btn"
                          disabled={isFull}
                          onClick={() => handleOpenBuyIn(table)}
                        >
                          {isFull ? 'FULL' : 'JOIN'}
                        </button>
                        <button
                          type="button"
                          className="fc-row-del-btn"
                          title="Hapus Meja Ini"
                          onClick={(e) => handleDeleteTable(table.tableId, e)}
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Striped Sidebar Panel (matches poker rooms+signup signin@2x.png) */}
        <aside className="fc-lobby-sidebar">
          <div className="fc-side-tabs">
            <button
              type="button"
              className={`fc-side-tab ${sideTab === 'rooms' ? 'is-active' : ''}`}
              onClick={() => setSideTab('rooms')}
              title="Active Tables"
            >
              <TableMiniIcon size={18} />
            </button>
            <button
              type="button"
              className={`fc-side-tab ${sideTab === 'info' ? 'is-active' : ''}`}
              onClick={() => setSideTab('info')}
              title="Lobby Stats"
            >
              <UsersIcon size={18} />
            </button>
          </div>

          <div className="fc-side-thead">
            <span>TABLE</span>
            <span>STATUS</span>
            <span className="align-right">STAKES</span>
          </div>

          <div className="fc-side-list">
            {lobbyTables.length === 0 ? (
              <div className="fc-side-empty">
                <p>0 meja aktif</p>
                <span>Total pemain: {totalOnlinePlayers}</span>
              </div>
            ) : (
              lobbyTables.map((t) => (
                <div
                  key={t.tableId}
                  className="fc-side-row"
                  onClick={() => handleOpenBuyIn(t)}
                >
                  <span className="fc-side-name">{t.name}</span>
                  <span className={`fc-side-dot ${t.phase === 'waiting' ? 'is-wait' : 'is-live'}`}>
                    {t.phase === 'waiting' ? 'Wait' : 'Live'}
                  </span>
                  <span className="fc-side-chips">${t.smallBlind}/${t.bigBlind}</span>
                </div>
              ))
            )}
          </div>

          <div className="fc-side-footer">
            <span>Meja Aktif: <strong>{lobbyTables.length}</strong></span>
            <span>Pemain: <strong>{totalOnlinePlayers}</strong></span>
          </div>
        </aside>
      </div>

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

              <div className="form-group">
                <label>Mode Bot AI</label>
                <div className="bot-mode-selector">
                  <button
                    type="button"
                    className={`btn-mode-tab ${allowBots ? 'active' : ''}`}
                    onClick={() => setAllowBots(true)}
                  >
                    <BotIcon size={15} />
                    <span>Izinkan Bot AI</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-mode-tab ${!allowBots ? 'active' : ''}`}
                    onClick={() => setAllowBots(false)}
                  >
                    <UsersIcon size={15} />
                    <span>Khusus Manusia</span>
                  </button>
                </div>
              </div>

              {allowBots && (
                <div className="form-group">
                  <label>Jumlah Bot AI Otomatis Masuk:</label>
                  <select
                    value={initialBots}
                    onChange={(e) => setInitialBots(Number(e.target.value))}
                  >
                    <option value={0}>0 (Mulai kosong, tambah bot manual nanti)</option>
                    <option value={1}>1 Bot AI (Langsung main Heads-up)</option>
                    <option value={2}>2 Bot AI (3 pemain)</option>
                    <option value={3}>3 Bot AI (4 pemain)</option>
                    <option value={5}>5 Bot AI (Meja penuh 6-Max)</option>
                  </select>
                </div>
              )}

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
                    className="fc-raise-slider"
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
