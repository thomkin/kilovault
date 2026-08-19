![kilovault](./docs/logo.png)

# Kilovault

- Key Value store for bunny.net edge scripts
- Uses crunch.ts as edge rpc style router
- Key/Value pairs are stored in bunny.net libsql database
- Github action used to deplay the script to bunny.net edge network

## Available Routes

The Kilovault service provides the following routes:

### Auth

- **`auth.getToken`** (Public)
  - **Input:** `{ secret: string, userId: string, permissions?: Record<string, boolean>, expiresIn?: number }`
    - `secret`: Authentication secret (must match `AUTH_SECRET` environment variable)
    - `userId`: Unique user identifier to embed in token
    - `permissions`: (optional) Object mapping permission names to boolean values
    - `expiresIn`: (optional) Token expiration time in seconds (e.g., 3600 for 1 hour). If omitted, token does not expire (suitable for backend services)
  - **Output:** `{ token: string }`

### History

- **`history.get`** (Requires `admin` permission)
  - **Input:** `{ userId?: string }`
  - **Output:** `{ history: { id: string, key: string, type: string, createdAt: string, userId: string }[] }`
- **`history.cleanup`** (Requires `admin` permission)
  - **Input:** `{}`
  - **Output:** `{ count: number }` (Deletes history older than 30 days)

### System

- **`system.alive`** (Public)
  - **Input:** `{}`
  - **Output:** `{ timestamp: number }`

### Vault

- **`vault.get`** (Requires `vault.get` permission)
  - **Input:** `{ key: string }`
  - **Output:** `{ value: string | undefined }`
- **`vault.set`** (Requires `vault.set` permission)
  - **Input:** `{ key: string, value: string }`
  - **Output:** `{}`

## Configuration

### Environment Variables

- **`JWT_SECRET`** (required): Secret key for signing and verifying JWT tokens
- **`AUTH_SECRET`** (required): Secret key for obtaining authentication tokens via `auth.getToken`
- **`DB_URL`** (required): LibSQL database URL
- **`DB_TOKEN`** (required): LibSQL authentication token
- **`ALLOWED_ORIGINS`** (optional): Comma-separated list of allowed CORS origins
  - Leave empty or omit to default to `*` (wildcard)
  - Set to `"https://app.example.com,https://api.example.com"` for specific origins
  - **Security Note**: Do not use wildcard (`*`) in production; restrict to known origins only

## Development

Start the application in development mode:

```bash
pnpm dev
```

This will start the server on port 5096 and watch for changes in the `src` directory.

## Tests

To run the test suite:

```bash
pnpm test
# To run tests without rebuilding
pnpm test:nobuild
```

## Creating a New Service

To create a new service:

1. Create a new directory or file under `src/services/`.
2. Define the `Request` and `Response` interfaces.
3. Export a `service` object of type `ServiceDefinition<Request, Response>`.

Example:

```typescript
import type { ServiceDefinition } from "@crunch/types/service";

export interface Request { ... }
export interface Response { ... }

export const service: ServiceDefinition<Request, Response> = {
  method: "myservice.action",
  isPublic: false, // Set to true if authorization is not needed
  requiredPermission: ["myservice.action"],
  handler: async (req, ctx) => { ... },
  validation: (input) => { ... }
};
```

## Deployment & GitHub Actions

The project uses a GitHub Action (`.github/workflows/deploy.yaml`) to automatically deploy the script to the bunny.net edge network on push to the `main` branch.
The action uses the `pnpm crunch` script to build the client and `pnpm bundle` to bundle everything into a single file at `dist/index.js`, which is then deployed using `BunnyWay/actions/deploy-script`.
