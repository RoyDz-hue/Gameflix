import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number").notNull(),
  password: text("password").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  referralCode: text("referral_code").notNull(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type", { enum: ["deposit", "withdrawal", "game", "referral"] }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed"] }).notNull(),
  transactionId: text("transaction_id"),  // PayHero reference
  phoneNumber: text("phone_number"),      // For mobile money transactions
  checkoutRequestId: text("checkout_request_id"), // PayHero checkout request ID
  providerReference: text("provider_reference"), // PayHero provider reference
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),  
  gameType: text("game_type", { enum: ["wheel", "box"] }).notNull().default("wheel"),
  score: integer("score").notNull(),
  bet: decimal("bet", { precision: 12, scale: 2 }).notNull(),
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull(),
  result: decimal("result", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  phoneNumber: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions);
export const insertGameSchema = createInsertSchema(games);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Game = typeof games.$inferSelect;
```

### 2. server/db.ts
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

## Server Files

### 3. server/storage.ts
The complete storage implementation with PostgreSQL database integration.

### 4. server/auth.ts
Complete authentication implementation with Passport.js.

### 5. server/routes.ts
API routes implementation including PayHero integration.

### 6. server/services/payhero.ts
PayHero service implementation with your specified channel IDs:
- STK Push Channel ID: 1487
- Mobile Withdrawal Channel ID: 1564

## Client Files

### 7. client/src/pages/
- auth-page.tsx (Login/Registration)
- dashboard.tsx (User Dashboard)
- game.tsx (Gaming Interface)

### 8. client/src/components/
- UI components (button.tsx, card.tsx, form.tsx)
- Dashboard components
- Game components

### 9. client/src/hooks/
- use-auth.tsx (Authentication Hook)
- use-toast.tsx (Notifications)

## Configuration Files

### 10. Environment Variables (.env)
```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname
PGHOST=your_pg_host
PGPORT=5432
PGUSER=your_pg_user
PGPASSWORD=your_pg_password
PGDATABASE=your_pg_database

# Session Security
SESSION_SECRET=your_secure_session_secret_min_32_chars

# PayHero API Configuration
PAYHERO_API_USERNAME=your_payhero_username
PAYHERO_API_PASSWORD=your_payhero_password
API_BASE_URL=https://backend.payhero.co.ke/api/v2/