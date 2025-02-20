├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── form.tsx
│   │   │   ├── dashboard/
│   │   │   └── game/
│   │   ├── hooks/
│   │   │   ├── use-auth.tsx
│   │   │   └── use-toast.tsx
│   │   ├── lib/
│   │   │   ├── protected-route.tsx
│   │   │   └── queryClient.ts
│   │   ├── pages/
│   │   │   ├── auth-page.tsx
│   │   │   ├── dashboard.tsx
│   │   │   └── game.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── index.html
├── server/
│   ├── services/
│   │   └── payhero.ts
│   ├── auth.ts
│   ├── db.ts
│   ├── routes.ts
│   ├── storage.ts
│   └── index.ts
├── shared/
│   └── schema.ts
├── package.json
├── tsconfig.json
└── vite.config.ts

## Required Environment Variables

Create a `.env` file with the following variables:

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
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev