CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`productId` varchar(96) NOT NULL,
	`stripeCheckoutSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_user_product_unique` UNIQUE(`userId`,`productId`),
	CONSTRAINT `purchases_session_product_unique` UNIQUE(`stripeCheckoutSessionId`,`productId`)
);
--> statement-breakpoint
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;