import { prisma } from "@/lib/prisma";

/**
 * Resolve a category for an expense: use an existing id, match by name, or create a new one.
 */
export async function resolveCategoryId(
  userId: string,
  categoryId: string | undefined,
  categoryName: string | undefined
): Promise<string | null> {
  if (categoryId) {
    const byId = await prisma.category.findFirst({
      where: { id: categoryId, userId, archived: false },
    });
    if (byId) return byId.id;
  }

  const name = categoryName?.trim();
  if (!name) return null;

  const existing = await prisma.category.findUnique({
    where: { userId_name: { userId, name } },
  });
  if (existing) {
    if (existing.archived) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { archived: false },
      });
    }
    return existing.id;
  }

  const created = await prisma.category.create({ data: { userId, name } });
  return created.id;
}
