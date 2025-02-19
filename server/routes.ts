import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTransactionSchema, insertGameSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/transactions/deposit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const transaction = await storage.createTransaction({
      userId: req.user.id,
      type: "deposit",
      amount: req.body.amount,
      status: "completed",
      createdAt: new Date()
    });

    await storage.updateUserBalance(req.user.id, transaction.amount);
    res.json(transaction);
  });

  app.post("/api/transactions/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = await storage.getUser(req.user.id);
    if (!user || user.balance < req.body.amount) {
      return res.status(400).send("Insufficient balance");
    }

    const transaction = await storage.createTransaction({
      userId: req.user.id,
      type: "withdrawal",
      amount: -req.body.amount,
      status: "completed",
      createdAt: new Date()
    });

    await storage.updateUserBalance(req.user.id, -req.body.amount);
    res.json(transaction);
  });

  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getUserTransactions(req.user.id);
    res.json(transactions);
  });

  app.post("/api/games", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const game = await storage.createGame({
      userId: req.user.id,
      score: req.body.score,
      bet: req.body.bet,
      result: req.body.result,
      createdAt: new Date()
    });

    await storage.updateUserBalance(req.user.id, game.result);
    res.json(game);
  });

  app.get("/api/games", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const games = await storage.getUserGames(req.user.id);
    res.json(games);
  });

  app.get("/api/referrals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const referrals = await storage.getReferrals(req.user.referralCode);
    res.json(referrals);
  });

  const httpServer = createServer(app);
  return httpServer;
}
