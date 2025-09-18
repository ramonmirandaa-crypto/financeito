CREATE TABLE "PluggyResource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "providerResourceId" TEXT NOT NULL,
    "accountId" TEXT,
    "name" TEXT,
    "category" TEXT,
    "currency" TEXT,
    "amount" DECIMAL(18,2),
    "balance" DECIMAL(18,2),
    "dueDate" TIMESTAMP(3),
    "date" TIMESTAMP(3),
    "dataEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "PluggyResource"
  ADD CONSTRAINT "PluggyResource_pkey" PRIMARY KEY ("id");

CREATE UNIQUE INDEX "PluggyResource_provider_resourceType_providerResourceId_key"
  ON "PluggyResource"("provider", "resourceType", "providerResourceId");

CREATE INDEX "PluggyResource_userId_resourceType_idx"
  ON "PluggyResource"("userId", "resourceType");

ALTER TABLE "PluggyResource"
  ADD CONSTRAINT "PluggyResource_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
