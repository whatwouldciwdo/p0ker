import { v4 as uuidv4 } from 'uuid';
import { CreateTableOptions, LobbyTable, TableState } from '@p0ker/shared';
import { Server } from 'socket.io';
import { Table } from './Table';
import { broadcastToTable } from '../socket/tableHandler';

export class TableManager {
  private static instance: TableManager;
  private tables: Map<string, Table> = new Map();
  private io?: Server;

  private constructor() {
    // Default starter tables
    this.createTable({
      name: 'Casual Table ($10 / $20)',
      smallBlind: 10,
      bigBlind: 20,
      maxPlayers: 6,
      minBuyIn: 200,
    });
    this.createTable({
      name: 'High Roller ($50 / $100)',
      smallBlind: 50,
      bigBlind: 100,
      maxPlayers: 9,
      minBuyIn: 1000,
    });
  }

  public static getInstance(): TableManager {
    if (!TableManager.instance) {
      TableManager.instance = new TableManager();
    }
    return TableManager.instance;
  }

  public setIO(io: Server) {
    this.io = io;
  }

  public getIO(): Server | undefined {
    return this.io;
  }

  public createTable(
    opts: CreateTableOptions,
    onStateChange?: (state: TableState) => void
  ): Table {
    const tableId = uuidv4().slice(0, 8);
    const table = new Table(tableId, opts, (state) => {
      if (onStateChange) onStateChange(state);
      if (this.io) {
        broadcastToTable(this.io, tableId);
      }
    });
    this.tables.set(tableId, table);
    return table;
  }

  public getTable(tableId: string): Table | undefined {
    return this.tables.get(tableId);
  }

  public deleteTable(tableId: string): void {
    this.tables.delete(tableId);
  }

  public listTables(): LobbyTable[] {
    return Array.from(this.tables.values()).map((t) => t.toLobbyTable());
  }
}

export const tableManager = TableManager.getInstance();
