"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";
import { projectSchema, fieldErrors } from "@/lib/validation";
import { GENERIC_ERROR, type ActionState } from "@/lib/action-state";
import { getSettings, getAllocation } from "@/lib/queries/settings";
import { convertMinor, MissingRateError, sumInCurrency, type Currency } from "@/lib/money";
import { currentPeriod } from "@/lib/periods";

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const parsed = projectSchema.safeParse({
      name: formData.get("name") ?? "",
      cost: formData.get("cost") ?? "",
      currency: formData.get("currency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };

    const maxPriority = await prisma.project.aggregate({
      where: { userId },
      _max: { priority: true },
    });
    await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name,
        costMinor: parsed.data.cost,
        currency: parsed.data.currency,
        priority: (maxPriority._max.priority ?? 0) + 1,
      },
    });
    revalidatePath("/projects");
    return { ok: true };
  } catch {
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
    const parsed = projectSchema.safeParse({
      name: formData.get("name") ?? "",
      cost: formData.get("cost") ?? "",
      currency: formData.get("currency"),
    });
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const result = await prisma.project.updateMany({
      where: { id, userId },
      data: {
        name: parsed.data.name,
        costMinor: parsed.data.cost,
        currency: parsed.data.currency,
      },
    });
    if (result.count === 0) return GENERIC_ERROR;
    revalidatePath("/projects");
    return { ok: true };
  } catch {
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
  revalidatePath("/projects");
}

export async function toggleProjectCompletedAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const project = await prisma.project.findFirst({ where: { id, userId } });
  if (!project) return;
  await prisma.project.update({
    where: { id },
    data: { completedAt: project.completedAt ? null : new Date() },
  });
  revalidatePath("/projects");
}

/** Swap priority with the neighbor above/below (R9 reorder). */
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

/**
 * Apply the fixed per-period allocation to projects in priority order for the
 * current half-month period, recording ProjectContribution rows (R9). Refuses
 * to double-apply for the same period.
 */
export async function applyAllocationAction(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  try {
    const userId = await requireUserId();
    const [allocation, settings] = await Promise.all([
      getAllocation(userId),
      getSettings(userId),
    ]);
    if (allocation.amountMinor <= 0) {
      return { errors: { _form: "Set a per-period allocation amount in Settings first." } };
    }

    const ref = currentPeriod();
    const existing = await prisma.projectContribution.count({
      where: { userId, year: ref.year, month: ref.month, period: ref.period },
    });
    if (existing > 0) {
      return {
        errors: { _form: "This period's allocation has already been applied." },
      };
    }

    const projects = await prisma.project.findMany({
      where: { userId, completedAt: null },
      orderBy: { priority: "asc" },
    });
    const contributions = await prisma.projectContribution.findMany({ where: { userId } });

    let available = allocation.amountMinor;
    const writes: Array<{ projectId: string; amountMinor: number }> = [];

    for (const project of projects) {
      if (available <= 0) break;
      let costInAlloc: number;
      let savedInAlloc: number | null;
      try {
        costInAlloc = convertMinor(
          project.costMinor,
          project.currency as Currency,
          allocation.currency,
          settings.rates
        );
        savedInAlloc = sumInCurrency(
          contributions
            .filter((c) => c.projectId === project.id)
            .map((c) => ({ amountMinor: c.amountMinor, currency: c.currency as Currency })),
          allocation.currency,
          settings.rates
        );
      } catch (error) {
        if (error instanceof MissingRateError) {
          return {
            errors: { _form: "Set both exchange rates in Settings before applying allocations." },
          };
        }
        throw error;
      }
      if (savedInAlloc === null) {
        return {
          errors: { _form: "Set both exchange rates in Settings before applying allocations." },
        };
      }
      const needed = Math.max(0, costInAlloc - savedInAlloc);
      if (needed === 0) continue;
      const applied = Math.min(available, needed);
      writes.push({ projectId: project.id, amountMinor: applied });
      available -= applied;
    }

    if (writes.length === 0) {
      return { errors: { _form: "All projects are fully funded — nothing to allocate." } };
    }

    await prisma.projectContribution.createMany({
      data: writes.map((w) => ({
        userId,
        projectId: w.projectId,
        year: ref.year,
        month: ref.month,
        period: ref.period,
        amountMinor: w.amountMinor,
        currency: allocation.currency,
      })),
    });
    revalidatePath("/projects");
    return { ok: true };
  } catch {
    return GENERIC_ERROR;
  }
}
