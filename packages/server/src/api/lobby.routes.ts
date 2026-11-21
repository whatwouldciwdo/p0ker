import { Router, Request, Response } from 'express';
import { cookieAuthMiddleware } from '../middleware/auth';
import { tableManager } from '../engine/TableManager';

const router = Router();

// All lobby routes require authentication
router.use(cookieAuthMiddleware);

// GET /api/lobby/tables
router.get('/tables', (req: Request, res: Response): void => {
  try {
    const tables = tableManager.listTables();
    res.json(tables);
  } catch (err) {
    console.error('List tables error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/lobby/tables
router.post('/tables', (req: Request, res: Response): void => {
  try {
    const { name, smallBlind, bigBlind, maxPlayers, minBuyIn, allowBots, initialBots } = req.body;

    if (!name || smallBlind == null || bigBlind == null || maxPlayers == null || minBuyIn == null) {
      res.status(400).json({ error: 'name, smallBlind, bigBlind, maxPlayers, minBuyIn are required' });
      return;
    }

    // Validation rules
    if (bigBlind < 2 * smallBlind) {
      res.status(400).json({ error: 'bigBlind must be >= 2 * smallBlind' });
      return;
    }

    if (maxPlayers < 2 || maxPlayers > 9) {
      res.status(400).json({ error: 'maxPlayers must be between 2 and 9' });
      return;
    }

    if (minBuyIn < 10 * bigBlind) {
      res.status(400).json({ error: 'minBuyIn must be >= 10 * bigBlind' });
      return;
    }

    const table = tableManager.createTable(
      {
        name,
        smallBlind: Number(smallBlind),
        bigBlind: Number(bigBlind),
        maxPlayers: Number(maxPlayers),
        minBuyIn: Number(minBuyIn),
        allowBots: allowBots !== false,
        initialBots: Number(initialBots) || 0,
      },
      () => {} // onStateChange placeholder; socket layer handles broadcasts
    );

    res.status(201).json({ tableId: table.id });
  } catch (err) {
    console.error('Create table error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
