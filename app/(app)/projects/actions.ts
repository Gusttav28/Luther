"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { projectSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import { safeMaterializeMonth, yearMonthFromDate } from "@/lib/queries/materialize";

async function materializeNow(userId: string) {
  const { year, month } = yearMonthFromDate(new Date());
  await safeMaterializeMonth(userId, year, month);
}

async function clearOtherPriorities(userId: string, exceptId?: string) {
  await prisma.project.updateMany({
    where: {
      userId,
      isPriority: true,
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    data: { isPriority: false },
  });
}

function parseProjectForm(formData: FormData) {
  return projectSchema.safeParse({
    name: formData.get("name") ?? "",
    cost: formData.get("cost") ?? "",
    currency: formData.get("currency"),
    allocationPercent: formData.get("allocationPercent") ?? "",
    periodMode: formData.get("periodMode") ?? "BOTH",
    goalDate: formData.get("goalDate") ?? "",
    link: formData.get("link") ?? "",
    isPriority: formData.get("isPriority") === "on",
  });
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = parseProjectForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const maxPriority = await prisma.project.aggregate({
      where: { userId },
      _max: { priority: true },
    });

    if (parsed.data.isPriority) {
      await clearOtherPriorities(userId);
    }

    await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name,
        costMinor: parsed.data.cost,
        currency: parsed.data.currency,
        priority: (maxPriority._max.priority ?? 0) + 1,
        allocationPercent: parsed.data.allocationPercent,
        periodMode: parsed.data.periodMode,
        goalDate: parsed.data.goalDate
          ? new Date(`${parsed.data.goalDate}T12:00:00`)
          : null,
        link: parsed.data.link ?? null,
        isPriority: parsed.data.isPriority,
      },
    });
    await materializeNow(userId);
    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath("/savings");
    return { ok: true };
  } catch (error) {
    console.error("createProjectAction failed", error);
    return GENERIC_ERROR;
  }
}

export async function updateProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const id = String(formData.get("id") ?? "");
    if (!id) return GENERIC_ERROR;

    const parsed = parseProjectForm(formData);
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    if (parsed.data.isPriority) {
      await clearOtherPriorities(userId, id);
    }

    const result = await prisma.project.updateMany({
      where: { id, userId },
      data: {
        name: parsed.data.name,
        costMinor: parsed.data.cost,
        currency: parsed.data.currency,
        allocationPercent: parsed.data.allocationPercent,
        periodMode: parsed.data.periodMode,
        goalDate: parsed.data.goalDate
          ? new Date(`${parsed.data.goalDate}T12:00:00`)
          : null,
        link: parsed.data.link ?? null,
        isPriority: parsed.data.isPriority,
      },
    });
    if (result.count === 0) return GENERIC_ERROR;
    await materializeNow(userId);
    revalidatePath("/projects");
    revalidatePath("/");
    revalidatePath("/savings");
    return { ok: true };
  } catch (error) {
    console.error("updateProjectAction failed", error);
    return GENERIC_ERROR;
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  await prisma.$transaction([
    prisma.projectContribution.deleteMany({ where: { userId, projectId: id } }),
    prisma.project.deleteMany({ where: { id, userId } }),
  ]);
  await materializeNow(userId);
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/savings");
}

export async function toggleProjectCompletedAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return;
  await prisma.project.update({
    where: { id },
    data: {
      completedAt: project.completedAt ? null : new Date(),
      isPriority: project.completedAt ? project.isPriority : false,
    },
  });
  await materializeNow(userId);
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/savings");
}

export async function setPriorityProjectAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const project = await prisma.project.findFirst({ where: { id, userId, completedAt: null } });
  if (!project) return;
  await clearOtherPriorities(userId);
  await prisma.project.update({ where: { id }, data: { isPriority: true } });
  await materializeNow(userId);
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath("/savings");
}

/** Swap display order with the neighbor above/below. */
export async function moveProjectAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";

  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return;

  const neighbor = await prisma.project.findFirst({
    where: {
      userId,
      priority: direction === "up" ? { lt: project.priority } : { gt: project.priority },
    },
    orderBy: { priority: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return;

  await prisma.$transaction([
    prisma.project.update({ where: { id: project.id }, data: { priority: neighbor.priority } }),
    prisma.project.update({ where: { id: neighbor.id }, data: { priority: project.priority } }),
  ]);
  revalidatePath("/projects");
}
