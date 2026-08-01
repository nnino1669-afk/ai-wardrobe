CREATE TABLE `tryOns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`personImageUrl` text NOT NULL,
	`garmentImageUrl` text NOT NULL,
	`resultImageUrl` text NOT NULL,
	`clothType` enum('upper','lower','overall','inner','outer') NOT NULL,
	`name` varchar(255),
	`personSelector` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryOns_id` PRIMARY KEY(`id`)
);
