-- AlterTable
ALTER TABLE `products` ADD COLUMN `pdfAuthor` VARCHAR(191) NULL,
    ADD COLUMN `pdfDownloadLimit` INTEGER NULL,
    ADD COLUMN `pdfExpiryDays` INTEGER NULL,
    ADD COLUMN `pdfFileName` VARCHAR(191) NULL,
    ADD COLUMN `pdfFilePath` VARCHAR(191) NULL,
    ADD COLUMN `pdfFileSize` INTEGER NULL,
    ADD COLUMN `pdfLanguage` VARCHAR(191) NULL DEFAULT 'English',
    ADD COLUMN `pdfPageCount` INTEGER NULL,
    ADD COLUMN `productType` VARCHAR(191) NOT NULL DEFAULT 'physical';

-- CreateTable
CREATE TABLE `pdf_purchases` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `downloadLink` VARCHAR(191) NOT NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `maxDownloads` INTEGER NOT NULL DEFAULT 5,
    `purchaseDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `emailSent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pdf_purchases_userId_idx`(`userId`),
    INDEX `pdf_purchases_productId_idx`(`productId`),
    INDEX `pdf_purchases_orderId_idx`(`orderId`),
    INDEX `pdf_purchases_status_idx`(`status`),
    INDEX `pdf_purchases_purchaseDate_idx`(`purchaseDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_deliveries` (
    `id` VARCHAR(191) NOT NULL,
    `purchaseId` VARCHAR(191) NOT NULL,
    `recipientEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `attachments` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `sentAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(191) NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `email_deliveries_purchaseId_idx`(`purchaseId`),
    INDEX `email_deliveries_status_idx`(`status`),
    INDEX `email_deliveries_recipientEmail_idx`(`recipientEmail`),
    INDEX `email_deliveries_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pdf_purchases` ADD CONSTRAINT `pdf_purchases_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pdf_purchases` ADD CONSTRAINT `pdf_purchases_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_deliveries` ADD CONSTRAINT `email_deliveries_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `pdf_purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
