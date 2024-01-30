-- CreateTable
CREATE TABLE "Macro" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "macros" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Macro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Macro_userId_macros_key" ON "Macro"("userId", "macros");

-- AddForeignKey
ALTER TABLE "Macro" ADD CONSTRAINT "Macro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
