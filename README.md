# EpochLanka POS System

A multi-branch, offline-first Point of Sale (POS) system. Each branch keeps trading independently on a local database even when the internet is down, then securely syncs to a centralized cloud database once back online.

## Description

EpochLanka POS is built for retail businesses with multiple branches that can't afford downtime when the internet drops. Every branch runs its own local POS server with a local SQLite database, so counters and receipt printers keep working offline. A sync worker pushes and pulls changes over HTTPS to a centralized PostgreSQL server whenever a connection is available, giving head office real-time, consolidated visibility across all branches once synced.

## Tech Stack

| Layer              | Technology                          |
|--------------------|--------------------------------------|
| Frontend           | React / Next.js                      |
| Styling            | Tailwind CSS                         |
| Offline Database   | SQLite (per-branch, local)           |
| Online Database    | PostgreSQL (centralized cloud)       |
| ORM                | Prisma (separate schemas for SQLite and Postgres) |

## Architecture

- **Local branch (offline-first)**: Store Wi-Fi router → Main POS server (local SQLite + sync worker) → counters + receipt printer.
- **Sync**: Secure HTTPS sync from each branch's sync worker to the centralized cloud server, whenever online.
- **Cloud**: Centralized server backed by PostgreSQL, aggregating data from all branches.

## Project Structure

```
epochlanka-pos-system/
├── apps/
│   ├── pos-client/        # Next.js frontend (runs at each branch counter)
│   └── cloud-dashboard/   # Next.js frontend for head office / multi-branch view
├── packages/
│   ├── db-local/          # Prisma schema + client for SQLite (per branch)
│   ├── db-cloud/          # Prisma schema + client for PostgreSQL (cloud)
│   └── sync-worker/       # Sync engine: push/pull, retry queue, conflict resolution
├── docs/
│   └── architecture/      # Diagrams and SDLC/delivery plan
├── .gitignore
└── README.md
```

## Getting Started

```bash
# clone
git clone <your-remote-url> epochlanka-pos-system
cd epochlanka-pos-system

# install dependencies (once package.json files are added)
npm install

# generate Prisma clients
npx prisma generate --schema packages/db-local/schema.prisma
npx prisma generate --schema packages/db-cloud/schema.prisma
```

## Development Approach

This project follows an incremental delivery plan (not a strict Waterfall process) due to the complexity of the offline sync layer and multi-branch hardware integration. See `docs/architecture/` for the full SDLC and delivery schedule.

## License

TBD
