This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


 Browser (user types a prompt)
    │  1. POST /api/ai/design  { prompt, roomId, projectId }
    ▼
 Your Next.js API route
    │  checks Clerk login + project access (Prisma / Postgres)
    │  2. uses TRIGGER_SECRET_KEY to say "start design-agent"
    │  3. saves a TaskRun row (who started which run)
    │  returns { runId } straight away
    ▼
 Trigger.dev  (runs the job in the background)
    │  design-agent task
    │
    ├─ 4. Liveblocks: read the current canvas
    │       (LIVEBLOCKS_SECRET_KEY)
    ├─ 5. Gemini: "turn this prompt into a list of actions"
    │       (GOOGLE_AI_API_KEY)
    └─ 6. Liveblocks: apply each action, set the AI's cursor,
            post status lines
                │
                ▼
          Liveblocks room (the shared canvas)
                │  pushes changes live over WebSocket
                ▼
          Everyone's browser: nodes appear, "Ghost AI" cursor moves
