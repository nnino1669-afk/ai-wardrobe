CREATE TABLE `garmentReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`garmentId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `garmentReviews_id` PRIMARY KEY(`id`)
);
