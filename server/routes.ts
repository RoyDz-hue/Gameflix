import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertTransactionSchema, insertGameSchema } from "@shared/schema";
import { payHero } from "./services/payhero";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/transactions/deposit", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { amount, phone } = req.body;

      // Initiate STK push
      const payment = await payHero.initiateSTKPush(
        Number(amount),
        phone,
        req.user.id
      );

      // Create pending transaction
      const transaction = await storage.createTransaction({
        userId: req.user.id,
        type: "deposit",
        amount: amount.toString(),
        status: "pending",
        transactionId: payment.reference,
        phoneNumber: phone,
        checkoutRequestId: payment.checkout_request_id || null,
        providerReference: null,
        createdAt: new Date()
      });

      res.json({
        ...transaction,
        paymentRef: payment.reference,
        checkoutRequestId: payment.checkout_request_id,
        status: payment.status
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/transactions/withdraw", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const user = await storage.getUser(req.user.id);
    if (!user || Number(user.balance) < Number(req.body.amount)) {
      return res.status(400).send("Insufficient balance");
    }

    try {
      const payment = await payHero.initiateWithdrawal(
        Number(req.body.amount),
        req.body.phone,
        req.user.id
      );

      const transaction = await storage.createTransaction({
        userId: req.user.id,
        type: "withdrawal",
        amount: (-req.body.amount).toString(),
        status: "pending",
        transactionId: payment.reference,
        phoneNumber: req.body.phone,
        checkoutRequestId: payment.checkout_request_id || null,
        providerReference: null,
        createdAt: new Date()
      });

      res.json({
        ...transaction,
        paymentRef: payment.reference,
        checkoutRequestId: payment.checkout_request_id,
        status: payment.status
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/transactions/callback", async (req, res) => {
    const { reference, status, success, provider_reference } = req.body;

    // Find transaction by PayHero reference
    const transactions = await storage.getAllTransactions();
    const transaction = transactions.find(t => t.transactionId === reference);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Update transaction status based on PayHero callback
    if (status === "SUCCESS" && success === true) {
      // Update transaction status and provider reference
      await storage.updateTransactionStatus(transaction.id, "completed");

      // Update user balance for completed transactions
      const amount = Number(transaction.amount);
      await storage.updateUserBalance(transaction.userId, amount);

    } else if (status === "FAILED" || success === false) {
      await storage.updateTransactionStatus(transaction.id, "failed");
    }
    // For QUEUED status, keep transaction as pending

    res.sendStatus(200);
  });

  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transactions = await storage.getUserTransactions(req.user.id);
    res.json(transactions);
  });

  app.get("/api/transactions/status/:reference", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const status = await payHero.checkTransactionStatus(req.params.reference);

      // Find and update transaction if status has changed
      const transactions = await storage.getAllTransactions();
      const transaction = transactions.find(t => t.transactionId === req.params.reference);

      if (transaction && transaction.status === "pending") {
        if (status.status === "SUCCESS" && status.success === true) {
          await storage.updateTransactionStatus(transaction.id, "completed");
          const amount = Number(transaction.amount);
          await storage.updateUserBalance(transaction.userId, amount);
        } else if (status.status === "FAILED" || status.success === false) {
          await storage.updateTransactionStatus(transaction.id, "failed");
        }
      }

      res.json(status);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/games", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const game = await storage.createGame({
      userId: req.user.id,
      gameType: req.body.gameType,
      score: req.body.score,
      bet: req.body.bet.toString(),
      multiplier: req.body.multiplier.toString(),
      result: req.body.result.toString(),
      createdAt: new Date()
    });

    await storage.updateUserBalance(req.user.id, Number(game.result));
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