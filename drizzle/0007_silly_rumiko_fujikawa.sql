CREATE TABLE `bundle_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bundleSlug` varchar(96) NOT NULL,
	`productId` varchar(96) NOT NULL,
	CONSTRAINT `bundle_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `bundle_items_unique` UNIQUE(`bundleSlug`,`productId`)
);
--> statement-breakpoint
CREATE TABLE `bundles` (
	`slug` varchar(96) NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`title` varchar(220) NOT NULL,
	`subtitle` varchar(255),
	`description` text NOT NULL,
	`category` varchar(120) NOT NULL,
	`coverUrl` varchar(1024) NOT NULL,
	`priceSatang` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'thb',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bundles_slug` PRIMARY KEY(`slug`)
);
--> statement-breakpoint
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_bundleSlug_bundles_slug_fk` FOREIGN KEY (`bundleSlug`) REFERENCES `bundles`(`slug`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bundle_items` ADD CONSTRAINT `bundle_items_productId_store_products_slug_fk` FOREIGN KEY (`productId`) REFERENCES `store_products`(`slug`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bundles` ADD CONSTRAINT `bundles_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `bundle_items_product_index` ON `bundle_items` (`productId`);