UPDATE "Compra" AS compra
SET "unidadeId" = usuario."unidadeId"
FROM "Usuario" AS usuario
WHERE compra."usuarioId" = usuario."id"
  AND compra."unidadeId" IS NULL
  AND usuario."unidadeId" IS NOT NULL;
