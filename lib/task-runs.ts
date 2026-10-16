import { prisma } from "@/lib/prisma";

export async function createTaskRun(input: { runId: string; projectId: string; userId: string }) {
  return prisma.taskRun.create({ data: input, select: { runId: true } });
}

// The run when this user started it, otherwise null. A missing run and someone else's run look
// the same to the caller, so run IDs cannot be probed.
export async function findOwnedTaskRun(runId: string, userId: string) {
  return prisma.taskRun.findFirst({ where: { runId, userId }, select: { runId: true } });
}
