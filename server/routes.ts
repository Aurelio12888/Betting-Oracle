import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { processNewResult } from "./telegram-service";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Get Game History
  app.get(api.game.list.path, async (req, res) => {
    const history = await storage.getGameHistory(50);
    res.json(history);
  });

  // Add Result & Trigger Analysis
  app.post(api.game.add.path, async (req, res) => {
    try {
      const input = api.game.add.input.parse(req.body);
      await processNewResult(input.color as 'blue' | 'red' | 'tie');
      const result = await storage.getGameHistory(1);
      res.status(201).json(result[0]);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Reset
  app.post(api.game.reset.path, async (req, res) => {
    await storage.clearGameHistory();
    res.status(204).send();
  });

  // Get Latest Signal
  app.get(api.signals.latest.path, async (req, res) => {
    const signal = await storage.getLatestSignal();
    res.json(signal || null);
  });

  // Get Signals History
  app.get(api.signals.list.path, async (req, res) => {
    const signals = await storage.getSignals(20);
    res.json(signals);
  });

  return httpServer;
}
