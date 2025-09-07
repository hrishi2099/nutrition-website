-- AlterTable
ALTER TABLE `order_items` MODIFY `price` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `orders` MODIFY `totalAmount` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `products` MODIFY `price` INTEGER NOT NULL;
