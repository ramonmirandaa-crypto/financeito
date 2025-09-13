-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_userId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "Recurrence" DROP CONSTRAINT "Recurrence_userId_fkey";

-- DropForeignKey
ALTER TABLE "FamilyLoan" DROP CONSTRAINT "FamilyLoan_userId_fkey";

-- DropTable
DROP TABLE "Budget";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "Subscription";

-- DropTable
DROP TABLE "Recurrence";

-- DropTable
DROP TABLE "FamilyLoan";

