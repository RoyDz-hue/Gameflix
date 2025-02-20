├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── form.tsx
│   │   │   │   └── [other UI components]
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
├── migrations/
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your environment variables
3. Install dependencies:
```bash
npm install
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev