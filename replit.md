# Partner Accounting System

## Overview

This is a bilingual (Arabic-focused, RTL) accounting application for managing partnerships between two partners across two projects. The system tracks expenses, revenues, and settlements organized by accounting periods, with comprehensive reporting and notification features.

The application follows a multi-tenant pattern where data is isolated by project_id, allowing users to switch between projects while maintaining separate financial records for each.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React Context API (`AppProvider`) for global app state, TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with RTL support, Cairo font for Arabic text
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Storage
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` - shared between frontend and backend
- **Migrations**: Drizzle Kit with migrations stored in `/migrations`

### Key Design Patterns
- **Shared Types**: Schema definitions in `/shared` are imported by both client and server
- **Path Aliases**: `@/` maps to client source, `@shared/` maps to shared code
- **Mock Data Pattern**: Frontend currently uses mock data in `appContext.tsx` for UI development
- **Single Source of Truth**: Period selection uses single dropdown per page, no duplicates

### Authentication & Authorization
- **Session-based authentication**: Using express-session for server-side session management
- **Two roles**: ADMIN (full access) and TX_ONLY (transactions only)
- **Partner credentials**: Stored in `partners` table with bcrypt-hashed passwords
- **Protected endpoints**: All data endpoints require authentication
- **Role-based access control**:
  - ADMIN: Full access to all features including period management and user administration
  - TX_ONLY: Can only manage transactions; periods and user pages are hidden and server-protected
- **Access denied logging**: Unauthorized access attempts are logged in event_logs

### Application Flow
1. User logs in (session-based authentication)
2. User selects a project (one-time per session)
3. Main application with sidebar navigation:
   - Transactions (Expenses/Revenues/Settlements tabs)
   - Periods (accounting period management) - **ADMIN only**
   - Reports (financial summaries)
   - Notifications
   - Event Log
   - Users - **ADMIN only**
   - Settings (profile management)

### Business Rules
- Transactions are tied to both Project and Period
- Closed periods prevent add/edit/delete operations
- Transactions page shows only the currently open period (no period selector)
- Partners have 50% profit share
- Event logging tracks all significant operations

### Strict Period Management
- **No manual "Add Period" button** - periods are managed automatically
- **First-run initialization**: "الفترة الافتتاحية" (Opening Period) is auto-created when a project has no periods
- **Close Period button**: Only appears for the open period on the Periods page
- **Auto-create next period**: When a period is closed, a new period is automatically created with:
  - Previous end balances become the new start balances
  - Name: "فترة N" where N is the period sequence number
  - Start date: Same as the closed period's end date (today)
- **Balance calculation on close**: 
  - Formula: opening + expenses_paid - revenues_received + settlements_paid - settlements_received + profit_share
  - Balances must sum to 0 (within 0.01 tolerance) to close
- **Only ONE open period allowed per project**
- **AppContext auto-selects ACTIVE period** when periods are loaded

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with `drizzle-orm` and `drizzle-zod` for validation

### UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **Lucide React**: Icon library
- **shadcn/ui**: Pre-built component patterns using Radix + Tailwind

### Build & Development
- **Vite**: Frontend bundler with HMR
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation with `@hookform/resolvers`

### Utilities
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Component variant management
- **clsx/tailwind-merge**: Conditional class composition