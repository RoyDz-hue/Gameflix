// File: server/storage.ts
// Database storage interface implementation

import { InsertUser, User, Transaction, Game } from "@shared/schema";
import { users, transactions, games } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(userId: number, amount: number): Promise<User>;
  createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  updateTransactionStatus(transactionId: number, status: "pending" | "completed" | "failed"): Promise<Transaction>;
  createGame(game: Omit<Game, "id">): Promise<Game>;
  getUserGames(userId: number): Promise<Game[]>;
  getReferrals(referralCode: string): Promise<User[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      balance: "0",
      referralCode: Math.random().toString(36).substring(7),
      referredBy: null,
    }).returning();
    return user;
  }

  async updateUserBalance(userId: number, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const currentBalance = Number(user.balance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    const [updatedUser] = await db
      .update(users)
      .set({ balance: newBalance.toString() })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async createTransaction(transaction: Omit<Transaction, "id">): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.userId, userId));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions);
  }

  async updateTransactionStatus(
    transactionId: number,
    status: "pending" | "completed" | "failed"
  ): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, transactionId))
      .returning();

    return transaction;
  }

  async createGame(game: Omit<Game, "id">): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return db.select().from(games).where(eq(games.userId, userId));
  }

  async getReferrals(referralCode: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.referredBy, referralCode));
  }
}

export const storage = new DatabaseStorage();
