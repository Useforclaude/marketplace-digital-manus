CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(96) NOT NULL,
	`displayName` varchar(80) NOT NULL,
	`feedback` text NOT NULL,
	`consentToPublish` boolean NOT NULL DEFAULT false,
	`status` enum('pending','approved','hidden') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`),
	CONSTRAINT `testimonials_user_product_unique` UNIQUE(`userId`,`productId`)
);
--> statement-breakpoint
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `testimonials_public_feed_index` ON `testimonials` (`status`,`consentToPublish`,`createdAt`);