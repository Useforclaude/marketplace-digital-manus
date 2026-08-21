CREATE TABLE `store_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(96) NOT NULL,
	`productType` enum('ebook','course') NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`title` varchar(220) NOT NULL,
	`subtitle` varchar(255),
	`description` text NOT NULL,
	`category` varchar(120) NOT NULL,
	`coverUrl` varchar(1024) NOT NULL,
	`coverKey` varchar(512),
	`accent` enum('lime','violet','rose','cyan') NOT NULL DEFAULT 'lime',
	`priceSatang` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'thb',
	`unitCount` int NOT NULL DEFAULT 1,
	`durationLabel` varchar(80) NOT NULL,
	`content` text NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `store_products` ADD CONSTRAINT `store_products_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;