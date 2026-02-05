## Architecture

**Spectra** is a real-time multiplayer game platform with three arena types:
- **draw**: Excalidraw canvas sketching with voting (non-deterministic)
- **code**: LeetCode-style coding challenges (deterministic)
- **typing**: Speed typing races (deterministic)

### State Management Pattern

Two-tier architecture separating transient and persistent state:

1. **Cloudflare Durable Objects** (`arenas/server.ts`): Manages live game state via WebSocket. Created per game session, broadcasts real-time updates to all participants.

2. **Convex** (`convex/`): Handles persistence (arena metadata, user accounts, match history), authentication, and lobby state. Results saved here after game ends.

### Key Directories

- `src/routes/arena/` - Arena UI with `-draw/`, `-code/`, `-typing/` subdirectories
- `arenas/server.ts` - Durable Object WebSocket server
- `shared/arena-protocol.ts` - Client-server message protocol types
- `convex/schema/` - Database schema definitions

## Coding Conventions

### TypeScript
- Strict mode enabled; resolve all errors
- Avoid `any`, `let`, `else`, and `try/catch` where possible
- Use function guards and single-word variable names when clear
- Prefer clear names over comments

### React
- Avoid `useEffect` unless absolutely needed
- Compose smaller components; avoid massive JSX blocks

### Tailwind CSS
- Use Tailwind v4 with global CSS format
- Always use with shadcn/ui components
- Minimize utilities

## Package Management

Use `bun` exclusively. Do not edit `package.json` manually.
