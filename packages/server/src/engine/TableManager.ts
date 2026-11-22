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
    // Start with 0 tables - lobby begins completely clean
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

  public createTableWithId(
    tableId: string,
    opts: CreateTableOptions,
    onStateChange?: (state: TableState) => void
  ): Table {
    const table = new Table(tableId, opts, (state) => {
      if (onStateChange) onStateChange(state);
      if (this.io) {
        broadcastToTable(this.io, tableId);
      }
    });
    this.tables.set(tableId, table);
    return table;
  }

  public createTable(
    opts: CreateTableOptions,
    onStateChange?: (state: TableState) => void
  ): Table {
    const tableId = uuidv4().slice(0, 8);
    return this.createTableWithId(tableId, opts, onStateChange);
  }

  public getTable(tableId: string): Table | undefined {
    return this.tables.get(tableId);
  }

  public deleteTable(tableId: string): boolean {
    const table = this.tables.get(tableId);
    if (!table) return false;
    if (this.io) {
      this.io.to(tableId).emit('toast', 'Meja ini telah ditutup.', 'info');
    }
    return this.tables.delete(tableId);
  }

  public clearAllTables(): void {
    if (this.io) {
      for (const tableId of this.tables.keys()) {
        this.io.to(tableId).emit('toast', 'Meja ini telah ditutup.', 'info');
      }
    }
    this.tables.clear();
  }

  public listTables(): LobbyTable[] {
    return Array.from(this.tables.values()).map((t) => t.toLobbyTable());
  }
}

export const tableManager = TableManager.getInstance();
