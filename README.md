git clone <your-repository-url>
cd payhero-gaming-platform
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
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

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:5000` to see the application.

## Project Structure

```
├── client/            # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utility functions and configurations
│   │   ├── pages/      # Page components
│   │   └── App.tsx     # Main application component
├── server/            # Backend Express application
│   ├── services/      # External service integrations
│   ├── auth.ts        # Authentication logic
│   ├── routes.ts      # API routes
│   └── storage.ts     # Database operations
└── shared/            # Shared types and schemas
    └── schema.ts      # Database schema definitions