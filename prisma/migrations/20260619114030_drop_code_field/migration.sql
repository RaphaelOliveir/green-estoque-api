/*
  Warnings:

  - The values [MONOCRYSTALLINE,POLYCRYSTALLINE,THIN_FILM,BIFACIAL] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `quantity` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `inventory_movements` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `inventory_movements` table. All the data in the column will be lost.
  - The `type` column on the `inventory_movements` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `brand` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `category_id` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `wattage` on the `products` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `inventory_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cost` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_date` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('EM_ESTOQUE', 'INSTALADO');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('SOLAR_PANEL', 'INVERTER', 'STRUCTURE');
ALTER TABLE "products" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TABLE "inventory_movements" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "public"."ProductType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_user_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropIndex
DROP INDEX "products_code_key";

-- AlterTable
ALTER TABLE "inventory_movements" DROP COLUMN "quantity",
DROP COLUMN "reason",
DROP COLUMN "user_id",
ADD COLUMN     "cost" DECIMAL(65,30),
ADD COLUMN     "customer" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "entryStockDate" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3),
ADD COLUMN     "status" "ItemStatus" NOT NULL DEFAULT 'EM_ESTOQUE',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "ProductType";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "brand",
DROP COLUMN "category_id",
DROP COLUMN "code",
DROP COLUMN "price",
DROP COLUMN "quantity",
DROP COLUMN "wattage",
ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "customer" TEXT,
ADD COLUMN     "entry_stock_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "purchase_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor" TEXT NOT NULL;

-- DropEnum
DROP TYPE "MovementType";
