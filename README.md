# E-Poch POS System

This is the repository for the E-Poch Point of Sale (POS) system. It is built using Next.js 16 (App Router), Tailwind CSS v4, and Prisma 7.

The application features a dual-database design, using local SQLite for offline-capable terminal billing and cloud PostgreSQL for central management.

---

## Developer Getting Started Guide

Follow these steps to set up your local development environment.

### 1. Install Dependencies
Clone the repository and run the installation command to fetch all frontend, backend, and database driver dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the environment variables template file to create your local config file:
```bash
cp .env.example .env
```
By default, the application is configured to run offline using SQLite. You do not need to modify the .env file to run SQLite locally.

### 3. Initialize the Database
Generate your local SQLite database structure by running:
```bash
npx prisma db push
```
This command reads your database schema and automatically creates a dev.db database file in your project root. (Note: database files are ignored by git and will not be pushed to GitHub).

### 4. Seed Default Data
Populate the database with initial system roles (Owner, Manager, Cashier, Staff) and a default administrator login account:
```bash
npx prisma db seed
```
Default Login Credentials created by the seed script:
* Email: admin@epochlanka.com
* Password: admin123

### 5. Start the Development Server
Launch the local server:
```bash
npm run dev
```
Open http://localhost:3000 in your browser to view the application.

---

## Dual-Database Configuration

To switch from the local SQLite database to a cloud PostgreSQL database:
1. Open your local .env file.
2. Change the USE_POSTGRES variable:
   ```env
   USE_POSTGRES="true"
   ```
3. Set your PostgreSQL link in the DATABASE_URL_CLOUD variable:
   ```env
   DATABASE_URL_CLOUD="postgresql://username:password@localhost:5432/epochlanka_pos?schema=public"
   ```

---

## Essential Commands Reference

* **npm run dev** - Starts the local development server.
* **npm run build** - Verifies TypeScript typing and compiles the Next.js production build.
* **npx prisma db push** - Syncs database tables with the Prisma schema.
* **npx prisma db seed** - Populates tables with roles and default admin credentials.
* **npx prisma generate** - Re-generates the internal Prisma Client classes after schema modifications.
