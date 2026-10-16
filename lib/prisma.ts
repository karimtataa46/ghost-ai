import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "@/app/generated/prisma/client";

// The generated client's models, as one string. In development the client is cached on
// `globalThis` so hot reloads share one connection pool, but that cache also outlives a
// `prisma generate`: a model added since would be missing (`prisma.taskRun` undefined) until the
// server restarted. A cached client is reused only when it was made from the same model set.
const modelFingerprint = Object.keys(Prisma.ModelName).sort().join(",");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaModelFingerprint?: string;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  if (url.startsWith("prisma://") || url.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: url });
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
}

function getPrismaClient() {
  if (process.env.NODE_ENV === "production") {
    return createPrismaClient();
  }

  const cached = globalForPrisma.prisma;

  if (cached && globalForPrisma.prismaModelFingerprint === modelFingerprint) {
    return cached;
  }

  // Release the old client's connections; it is unusable for the new models anyway.
  void cached?.$disconnect().catch(() => {});

  const client = createPrismaClient();

  globalForPrisma.prisma = client;
  globalForPrisma.prismaModelFingerprint = modelFingerprint;

  return client;
}

export const prisma = getPrismaClient();
