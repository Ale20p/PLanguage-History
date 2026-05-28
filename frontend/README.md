This is the static Next.js frontend for PLanguage-History.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The frontend needs a Spring Boot API URL at build time. For local development, copy `.env.example` to `.env.local` and keep the local API URL:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/api/v1
```

## Cloudflare Pages

Use these settings from the `frontend` directory:

```text
Build command: npm run build
Output directory: out
```

Set this Cloudflare Pages environment variable before deploying:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-api.example.com/api/v1
```

Do not set `NEXT_PUBLIC_API_BASE_URL` to `localhost` for Cloudflare Pages. In production, `localhost` means the visitor's device, not your backend server.
