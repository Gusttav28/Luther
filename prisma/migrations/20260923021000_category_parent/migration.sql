-- AlterTable (idempotent so a manual Supabase apply + migrate deploy both succeed)
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Category_userId_parentId_idx" ON "Category"("userId", "parentId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Category_parentId_fkey'
  ) THEN
    ALTER TABLE "Category"
      ADD CONSTRAINT "Category_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "Category"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
