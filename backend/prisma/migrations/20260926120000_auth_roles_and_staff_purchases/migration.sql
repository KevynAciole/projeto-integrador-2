ALTER TYPE "Perfil" RENAME VALUE 'GESTOR' TO 'ADMIN';
ALTER TYPE "Perfil" ADD VALUE 'ESTOQUISTA';
ALTER TYPE "Perfil" ADD VALUE 'VISITANTE';

ALTER TABLE "Usuario" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "Usuario" ADD COLUMN "numeroUsuario" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "emailContato" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "telefone" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "senhaHash" TEXT;
ALTER TABLE "Usuario" ADD COLUMN "deveTrocarSenha" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Usuario" SET "emailContato" = "email" WHERE "emailContato" IS NULL;

WITH numerados AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "criadoEm", "id") AS sequencia
  FROM "Usuario"
)
UPDATE "Usuario" AS usuario
SET "numeroUsuario" = LPAD(numerados.sequencia::TEXT, 6, '0')
FROM numerados
WHERE usuario."id" = numerados."id";

ALTER TABLE "Usuario" ALTER COLUMN "numeroUsuario" SET NOT NULL;
ALTER TABLE "Usuario" ALTER COLUMN "emailContato" SET NOT NULL;
CREATE UNIQUE INDEX "Usuario_numeroUsuario_key" ON "Usuario"("numeroUsuario");
CREATE UNIQUE INDEX "Usuario_telefone_key" ON "Usuario"("telefone");

ALTER TABLE "Compra" ALTER COLUMN "unidadeId" DROP NOT NULL;