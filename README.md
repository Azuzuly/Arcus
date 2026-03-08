This is the Arcus frontend: a Next.js workspace for chat, research, image generation, and agent flows across Puter and OpenRouter-backed models.

## Getting Started

Install dependencies and run the development server:

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

Create a `.env.local` file with at least:

```bash
NEXT_PUBLIC_INSFORGE_BASE_URL=...
NEXT_PUBLIC_INSFORGE_ANON_KEY=...
OPENROUTER_API_KEY=...
TAVILY_API_KEY=...
```

You can start editing the page by modifying files under `src/`. The page auto-updates as you edit.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize Geist and Geist Mono.

## Remote sync setup

Arcus can sync conversations across devices through InsForge, but the backend needs the `conversations` and `messages` tables first.

Use the SQL in `insforge-sync-schema.sql` to provision them in the Arcus backend database.

Until those tables exist, Arcus now falls back cleanly to local-only history instead of throwing sync errors.

## Validation

Useful checks:

```bash
npm run lint
npm run build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

Deploy the Next.js app to your preferred host, then make sure the same environment variables are present in production.

If you want remote conversation sync in production, run `insforge-sync-schema.sql` against the production Arcus backend before testing multi-device history.
