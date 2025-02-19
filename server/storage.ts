import { InsertUser, User, Transaction, Game } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createGame(game: Omit<Game, "id">): Promise<Game>;
  getUserGames(userId: number): Promise<Game[]>;
  getReferrals(referralCode: string): Promise<User[]>;
  sessionStore: session.Store;
  updateTransactionStatus(transactionId: number, status: "pending" | "completed" | "failed"): Promise<Transaction>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private games: Map<number, Game>;
  private currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.games = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      balance: 0,
      referralCode: nanoid(8),
      referredBy: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    user.balance += amount;
    this.users.set(userId, user);
    return user;
  }

  async createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const id = this.currentId++;
    const newTransaction: Transaction = { ...transaction, id };
    this.transactions.set(id, newTransaction);
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId,
    );
  }

  async createGame(game: Omit<Game, "id">): Promise<Game> {
    const id = this.currentId++;
    const newGame: Game = { ...game, id };
    this.games.set(id, newGame);
    return newGame;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.userId === userId,
    );
  }

  async getReferrals(referralCode: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.referredBy === referralCode,
    );
  }

  async updateTransactionStatus(transactionId: number, status: "pending" | "completed" | "failed"): Promise<Transaction> {
    const transaction = Array.from(this.transactions.values()).find(t => t.id === transactionId);
    if (!transaction) throw new Error("Transaction not found");

    transaction.status = status;
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }
}

export const storage = new MemStorage();