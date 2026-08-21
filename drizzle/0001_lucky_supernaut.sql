CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`purpose` text NOT NULL,
	`created_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uploads_object_key_unique` ON `uploads` (`object_key`);--> statement-breakpoint
CREATE INDEX `uploads_owner_idx` ON `uploads` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `coin_reward_source_uq` ON `coin_transactions` (`user_id`,`source_type`,`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `xp_reward_source_uq` ON `xp_transactions` (`user_id`,`source_type`,`source_id`);