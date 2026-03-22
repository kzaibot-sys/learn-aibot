-- CreateEnum
CREATE TYPE "FriendRelationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');

-- CreateTable
CREATE TABLE "FriendRelation" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendRelationStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FriendRelation_requesterId_addresseeId_key" ON "FriendRelation"("requesterId", "addresseeId");

CREATE INDEX "FriendRelation_requesterId_idx" ON "FriendRelation"("requesterId");

CREATE INDEX "FriendRelation_addresseeId_idx" ON "FriendRelation"("addresseeId");

CREATE INDEX "FriendRelation_status_idx" ON "FriendRelation"("status");

-- AddForeignKey
ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FriendRelation" ADD CONSTRAINT "FriendRelation_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
