CREATE TABLE `checkout_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`offerType` enum('upsell','downsell') NOT NULL,
	`sourceProductId` varchar(96) NOT NULL,
	`offerProductId` varchar(96) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` varchar(600) NOT NULL,
	`ctaLabel` varchar(80) NOT NULL,
	`offerTotalPriceSatang` int NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `checkout_offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bundles` ADD `previewContent` text;--> statement-breakpoint
ALTER TABLE `store_products` ADD `previewContent` text;--> statement-breakpoint
ALTER TABLE `checkout_offers` ADD CONSTRAINT `checkout_offers_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `checkout_offers_source_status_type_priority_index` ON `checkout_offers` (`sourceProductId`,`status`,`offerType`,`priority`);--> statement-breakpoint
CREATE INDEX `checkout_offers_offer_product_index` ON `checkout_offers` (`offerProductId`);