# Project Files Overview

## Configuration Files
- `.replit` - Replit configuration
- `package.json` - Node.js dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `drizzle.config.ts` - Database ORM configuration

## Client-Side Files

### Core
- `client/index.html` - Entry HTML file
- `client/src/main.tsx` - React application entry point
- `client/src/App.tsx` - Main application component

### Pages
- `client/src/pages/auth-page.tsx` - Authentication page (login/register)
- `client/src/pages/dashboard.tsx` - User dashboard
- `client/src/pages/game.tsx` - Gaming interface
- `client/src/pages/not-found.tsx` - 404 page

### Components
- `client/src/components/ui/*` - UI components (button, card, form, etc.)
- `client/src/components/dashboard/*` - Dashboard-specific components
- `client/src/components/game/*` - Game-specific components

### Hooks and Utilities
- `client/src/hooks/use-auth.tsx` - Authentication hook
- `client/src/hooks/use-toast.tsx` - Toast notifications
- `client/src/lib/protected-route.tsx` - Route protection
- `client/src/lib/queryClient.ts` - API client configuration

## Server-Side Files

### Core
- `server/index.ts` - Express server entry point
- `server/routes.ts` - API routes
- `server/auth.ts` - Authentication setup
- `server/db.ts` - Database connection
- `server/storage.ts` - Data storage interface

### Services
- `server/services/payhero.ts` - PayHero integration service

## Shared Files
- `shared/schema.ts` - Database schema and types

## Additional Resources
- `README.md` - Project documentation
- `migrations/*` - Database migrations

## Getting Started
1. Download all files maintaining the directory structure
2. Install dependencies using `npm install`
3. Set up environment variables as specified in `.env.example`
4. Run database migrations: `npm run db:push`
5. Start development server: `npm run dev`

## Note
Make sure to download all files and maintain the exact directory structure for the project to work correctly.