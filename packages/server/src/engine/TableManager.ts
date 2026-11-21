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
    // Default starter tables with fixed IDs
    this.createTableWithId('casual-1', {
      name: 'Casual Table ($10 / $20)',
      smallBlind: 10,
      bigBlind: 20,
      maxPlayers: 6,
      minBuyIn: 200,
      allowBots: true,
      initialBots: 1,
    });
    this.createTableWithId('high-roller-1', {
      name: 'High Roller ($50 / $100)',
      smallBlind: 50,
      bigBlind: 100,
      maxPlayers: 9,
      minBuyIn: 1000,
      allowBots: true,
      initialBots: 2,
    });
    this.createTableWithId('ai-arena-1', {
      name: '🤖 AI Arena ($10 / $20)',
      smallBlind: 10,
      bigBlind: 20,
      maxPlayers: 6,
      minBuyIn: 200,
      allowBots: true,
      initialBots: 2,
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

  public getTable(tableId: string): Table {
    let table = this.tables.get(tableId);
    if (!table) {
      // Gracefully auto-recreate table if lost on server restart
      console.log(`[TableManager] Auto-recreating missing table ${tableId}`);
      table = this.createTableWithId(tableId, {
        name: `Table ${tableId}`,
        smallBlind: 10,
        bigBlind: 20,
        maxPlayers: 6,
        minBuyIn: 200,
        allowBots: true,
        initialBots: 0,
      });
    }
    return table;
  }

  public deleteTable(tableId: string): void {
    this.tables.delete(tableId);
  }

  public listTables(): LobbyTable[] {
    return Array.from(this.tables.values()).map((t) => t.toLobbyTable());
  }
}

export const tableManager = TableManager.getInstance();
