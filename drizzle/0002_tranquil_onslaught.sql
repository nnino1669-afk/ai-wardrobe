CREATE TABLE `garmentCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`displayOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `garmentCategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `garmentCategories_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `garments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`imageUrl` text NOT NULL,
	`clothType` enum('upper','lower','overall','inner','outer') NOT NULL,
	`color` varchar(50),
	`sizes` varchar(100) DEFAULT 'XS,S,M,L,XL,XXL',
	`price` int,
	`brand` varchar(100),
	`rating` int DEFAULT 0,
	`reviewCount` int DEFAULT 0,
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `garments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `outfits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`garmentIds` text NOT NULL,
	`previewImageUrl` text,
	`rating` int DEFAULT 0,
	`isPublic` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `outfits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`garmentId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`)
);
