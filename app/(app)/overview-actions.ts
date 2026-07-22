"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth";
import { safeMaterializeMonth } from "@/lib/queries/materialize";

/** Explicit Overview Refresh: rematerialize the viewed month, then revalidate. */
export async function rematerializeOverviewAction(
  year: number,
  month: number
): Promise<void> {
  const userId = await requireUserId();
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return;
  }
  await safeMaterializeMonth(userId, year, month);
  revalidatePath("/");
  revalidatePath("/savings");
  revalidatePath("/projects");
}
