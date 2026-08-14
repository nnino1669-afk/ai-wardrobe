CREATE TABLE `styleProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`preferredColor` varchar(50) DEFAULT '',
	`preferredFit` enum('relaxed','regular','tailored') NOT NULL DEFAULT 'regular',
	`preferredOccasion` enum('everyday','work','evening','active') NOT NULL DEFAULT 'everyday',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `styleProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `styleProfiles_userId_unique` UNIQUE(`userId`)
);
