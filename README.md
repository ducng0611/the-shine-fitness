# The Shine Fitness & Yoga

A full-stack application built with React (Vite) and Express (Node.js).

## Architecture

This project is separated into Frontend and Backend for clear responsibility:

- `src/`: Contains all Frontend React code (components, styles, UI logic).
- `server/src/`: Contains all Backend Express code (API routes, database connection, middleware).
- `scripts/`: Contains python scripts for scraping and utilities.
- `public/`: Static assets served directly to the client.

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in the required values:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - PostgreSQL credentials (`SQL_HOST`, `SQL_USER`, etc.) or `DATABASE_URL`.

3. **Development**
   Start the unified dev server (Express serving API + Vite as middleware):
   ```bash
   npm run dev
   ```
   
   *Alternatively, if running locally outside AI Studio constraints:*
   ```bash
   npm run dev:server
   npm run dev:client
   ```

4. **Production Build**
   ```bash
   npm run build
   npm run start
   ```
