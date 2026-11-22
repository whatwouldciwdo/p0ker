import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { TableState, PlayerAction } from '@p0ker/shared';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { getSocket } from '../socket/socketClient';
import { api } from '../api/axios';
import PokerTable from '../components/table/PokerTable';

interface ChatMessage {
  username: string;
  message: string;
  timestamp: number;
}

export default function TablePage() {
  const { tableId } = useParams<{ tableId: string }>();
  const [searchParams] = useSearchParams();
  const buyIn = Number(searchParams.get('buyIn')) || 200;

  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { tableState, setTableState, clearGame } = useGameStore();

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!tableId || !user) {
      navigate('/lobby');
      return;
    }

    const socket = getSocket();

    // Listen for game state updates
    const handleGameState = (state: TableState) => {
      setTableState(state);
    };

    const handleChat = (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-30), msg]);
    };

    const handleError = (err: any) => {
      const msg = typeof err === 'object' ? err.message : err;
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    };

    const handleToast = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
    };

    socket.on('table:state', handleGameState);
    socket.on('game:state', handleGameState);
    socket.on('chat:message', handleChat);
    socket.on('error', handleError);
    socket.on('toast', handleToast);

    // Join table
    socket.emit('table:join', { tableId, buyIn });

    return () => {
      socket.off('table:state', handleGameState);
      socket.off('game:state', handleGameState);
      socket.off('chat:message', handleChat);
      socket.off('error', handleError);
      socket.off('toast', handleToast);
    };
  }, [tableId, user]);

  const handleAction = (action: PlayerAction, amount?: number) => {
    const socket = getSocket();
    socket.emit('game:action', { tableId, action, amount });
  };

  const handleLeave = () => {
    const socket = getSocket();
    socket.emit('table:leave', { tableId });
    clearGame();
    navigate('/lobby');
  };

  const handleAddBot = async () => {
    const currentTableId = tableId || tableState?.tableId;
    if (!currentTableId) return;

    try {
      const socket = getSocket();
      socket.emit('table:addBot', { tableId: currentTableId });

      const res = await api.post(`/api/lobby/tables/${currentTableId}/bot`);
      if (res.data?.success) {
        setNotification('🤖 Bot AI berhasil ditambahkan!');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err: any) {
      console.error('handleAddBot error:', err);
      const msg = err.response?.data?.error || err.message || 'Gagal menambahkan bot';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleRemoveBot = async () => {
    const currentTableId = tableId || tableState?.tableId;
    if (!currentTableId) return;

    try {
      const socket = getSocket();
      socket.emit('table:removeBot', { tableId: currentTableId });
      await api.delete(`/api/lobby/tables/${currentTableId}/bot`);
      setNotification('Bot AI telah dikeluarkan.');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('handleRemoveBot error:', err);
    }
  };

  const handleSendChat = (message: string) => {
    const socket = getSocket();
    socket.emit('table:chat', { tableId, message });
  };

  if (!tableState) {
    return (
      <div className="table-loading-screen">
        <div className="loading-card">
          <div className="loading-spinner" />
          <h3>Menghubungkan ke meja...</h3>
          <p>Table ID: {tableId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-page-container">
      {errorMessage && (
        <div className="toast-notification toast-error">
          <span>⚠️ {errorMessage}</span>
        </div>
      )}

      {notification && (
        <div className="toast-notification toast-success">
          <span>{notification}</span>
        </div>
      )}

      <PokerTable
        tableState={tableState}
        myUserId={user?.id || ''}
        onAction={handleAction}
        onLeave={handleLeave}
        onAddBot={handleAddBot}
        onRemoveBot={handleRemoveBot}
        onSendChat={handleSendChat}
        chatMessages={chatMessages}
      />
    </div>
  );
}
