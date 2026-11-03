DROP INDEX IF EXISTS "Unidade_numero_key";

UPDATE "Unidade" SET "bloco" = '' WHERE "bloco" IS NULL;

ALTER TABLE "Unidade"
ALTER COLUMN "bloco" SET DEFAULT '',
ALTER COLUMN "bloco" SET NOT NULL;

CREATE UNIQUE INDEX "Unidade_numero_bloco_key" ON "Unidade"("numero", "bloco");
