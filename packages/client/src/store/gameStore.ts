import { create } from 'zustand';
import { TableState, LobbyTable } from '@p0ker/shared';

interface GameStore {
  tableState: TableState | null;
  lobbyTables: LobbyTable[];
  currentTableId: string | null;
  setTableState: (s: TableState) => void;
  setLobbyTables: (t: LobbyTable[]) => void;
  setCurrentTableId: (id: string | null) => void;
  clearGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  tableState: null,
  lobbyTables: [],
  currentTableId: null,
  setTableState: (s) => set({ tableState: s }),
  setLobbyTables: (t) => set({ lobbyTables: t }),
  setCurrentTableId: (id) => set({ currentTableId: id }),
  clearGame: () => set({ tableState: null, lobbyTables: [], currentTableId: null }),
}));
